import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// FIX: Import Buffer to resolve 'Cannot find name 'Buffer'' TypeScript error.
// Buffer is globally available in the Node.js environment where this function runs.
import { Buffer } from 'buffer';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const getUserIdFromRequest = (req: VercelRequest): string | null => {
    return req.headers['x-user-id'] as string || null;
}

const ensureTablesExist = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS voice_servers (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
    `);
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS voice_server_participants (
            room_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            PRIMARY KEY (room_id, user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES voice_servers(id) ON DELETE CASCADE
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS voice_messages (
            id SERIAL PRIMARY KEY,
            room_id VARCHAR(255) NOT NULL,
            sender_id VARCHAR(255) NOT NULL,
            audio_data BYTEA NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES voice_servers(id) ON DELETE CASCADE
        );
    `);

    // Pre-populate with default servers if table is empty
    const { rowCount } = await pool.query('SELECT 1 FROM voice_servers LIMIT 1');
    if (rowCount === 0) {
        await pool.query(`
            INSERT INTO voice_servers (id, name) VALUES
            ('general', 'General Chat'),
            ('tech-talk', 'Tech Talk'),
            ('support-desk', 'Support Desk');
        `);
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        await ensureTablesExist();
    } catch (e) {
        console.error("Failed to ensure voice server tables exist", e);
        return res.status(500).json({ message: 'Database initialization failed.' });
    }

    const { type, roomId, since } = req.query;

    if (req.method === 'GET') {
        try {
            if (type === 'rooms') {
                const { rows } = await pool.query('SELECT * FROM voice_servers ORDER BY name');
                return res.status(200).json(rows);
            }
            if (type === 'participants' && typeof roomId === 'string') {
                const { rows } = await pool.query(
                    'SELECT p.user_id, u.username FROM voice_server_participants p JOIN users u ON p.user_id = u.id WHERE p.room_id = $1',
                    [roomId]
                );
                return res.status(200).json(rows);
            }
            if (type === 'messages' && typeof roomId === 'string') {
                const sinceTimestamp = typeof since === 'string' ? since : new Date(0).toISOString();
                const { rows } = await pool.query(
                    `SELECT m.id, m.sender_id, u.username as sender_username, m.audio_data, m.created_at
                     FROM voice_messages m
                     JOIN users u ON m.sender_id = u.id
                     WHERE m.room_id = $1 AND m.created_at > $2
                     ORDER BY m.created_at ASC`,
                    [roomId, sinceTimestamp]
                );
                // Convert BYTEA to base64
                const messages = rows.map(row => ({
                    ...row,
                    audio_data: row.audio_data.toString('base64'),
                }));
                return res.status(200).json(messages);
            }
            return res.status(400).json({ message: 'Invalid GET request type.' });
        } catch (error) {
            console.error('Error handling GET request in voiceserver:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'POST') {
        try {
            if (type === 'message') {
                const { roomId, audioData } = req.body;
                if (!roomId || !audioData) return res.status(400).json({ message: 'roomId and audioData are required.' });
                const audioBuffer = Buffer.from(audioData, 'base64');
                await pool.query(
                    'INSERT INTO voice_messages (room_id, sender_id, audio_data) VALUES ($1, $2, $3)',
                    [roomId, userId, audioBuffer]
                );
                return res.status(201).json({ message: 'Message sent.' });
            } else {
                const { roomId, action } = req.body;
                if (!roomId || !action) return res.status(400).json({ message: 'roomId and action are required.' });
                
                if (action === 'join') {
                    await pool.query(
                        'INSERT INTO voice_server_participants (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [roomId, userId]
                    );
                    return res.status(200).json({ message: 'Joined room.' });
                }
                if (action === 'leave') {
                    await pool.query(
                        'DELETE FROM voice_server_participants WHERE room_id = $1 AND user_id = $2',
                        [roomId, userId]
                    );
                    return res.status(200).json({ message: 'Left room.' });
                }
                return res.status(400).json({ message: 'Invalid POST action.' });
            }
        } catch (error) {
            console.error('Error handling POST request in voiceserver:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}