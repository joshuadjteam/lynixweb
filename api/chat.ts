
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const getUserIdFromRequest = (req: VercelRequest): string | null => {
    return req.headers['x-user-id'] as string || null;
}

const ensureTableExists = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender_id VARCHAR(255) NOT NULL,
            recipient_id VARCHAR(255) NOT NULL,
            text TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { type } = req.query;

    if (req.method === 'GET') {
        if (type === 'users') {
            try {
                const { rows } = await pool.query(
                    "SELECT id, username FROM users WHERE chat_enabled = TRUE ORDER BY username ASC"
                );
                return res.status(200).json(rows);
            } catch (error) {
                console.error('Error fetching chat users:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }

        if (type === 'messages') {
            try {
                await ensureTableExists();
            } catch(e) {
                console.error("Failed to ensure messages table exists", e);
                return res.status(500).json({ message: 'Database initialization failed.' });
            }
            const client = await pool.connect();
            try {
                const { senderId, recipientId } = req.query;
                if (typeof senderId !== 'string' || typeof recipientId !== 'string') {
                    return res.status(400).json({ message: 'senderId and recipientId are required.' });
                }
                
                await client.query('BEGIN');
                const { rows } = await client.query(
                    `SELECT * FROM messages 
                     WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
                     ORDER BY timestamp ASC`,
                    [senderId, recipientId]
                );
                await client.query(
                    `UPDATE messages SET is_read = TRUE WHERE recipient_id = $1 AND sender_id = $2 AND is_read = FALSE`,
                    [senderId, recipientId]
                );
                await client.query('COMMIT');
                return res.status(200).json(rows);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error fetching messages:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            } finally {
                client.release();
            }
        }

        if (type === 'alerts') {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required.' });
            }
            try {
                const { rows } = await pool.query(
                    `SELECT m.sender_id, u.username as sender_username, LEFT(m.text, 50) as message_snippet
                     FROM messages m
                     JOIN users u ON m.sender_id = u.id
                     WHERE m.recipient_id = $1 AND m.is_read = FALSE
                     ORDER BY m.timestamp DESC`,
                    [userId]
                );
                return res.status(200).json(rows);
            } catch (error) {
                console.error('Error fetching alerts:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
        
        return res.status(400).json({ message: 'Invalid or missing "type" parameter for GET request.' });

    } else if (req.method === 'POST') {
        if (type === 'messages') {
            try {
                await ensureTableExists();
            } catch(e) {
                console.error("Failed to ensure messages table exists", e);
                return res.status(500).json({ message: 'Database initialization failed.' });
            }
            try {
                const { senderId, recipientId, text } = req.body;
                if (!senderId || !recipientId || !text) {
                    return res.status(400).json({ message: 'senderId, recipientId, and text are required.' });
                }
                const { rows } = await pool.query(
                    'INSERT INTO messages (sender_id, recipient_id, text, is_read) VALUES ($1, $2, $3, FALSE) RETURNING *',
                    [senderId, recipientId, text]
                );
                return res.status(201).json(rows[0]);
            } catch (error) {
                console.error('Error sending message:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
        
        return res.status(400).json({ message: 'Invalid or missing "type" parameter for POST request.' });

    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
