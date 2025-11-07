import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// Simplified auth helper - NOT FOR PRODUCTION
const getUserIdFromRequest = (req: VercelRequest): string | null => {
    return req.headers['x-user-id'] as string || null;
}

const EXPIRATION_HOURS = 72;

// Function to ensure the necessary tables exist
const ensureTableExists = async () => {
    // This table is a dependency for many other tables. The PRIMARY KEY on `id` is crucial.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) NOT NULL,
            plan JSONB,
            sip VARCHAR(255),
            billing JSONB,
            chat_enabled BOOLEAN DEFAULT FALSE,
            ai_enabled BOOLEAN DEFAULT FALSE,
            localmail_enabled BOOLEAN DEFAULT FALSE
        );
    `);
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
            user_id VARCHAR(255) PRIMARY KEY,
            content TEXT,
            updated_at TIMESTAMP WITH TIME ZONE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        await ensureTableExists();
    } catch(e) {
        console.error("Failed to ensure notes table exists", e);
        return res.status(500).json({ message: 'Database initialization failed.' });
    }
    

    // GET /api/notepad - Fetch user's note
    if (req.method === 'GET') {
        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                'SELECT content, updated_at FROM notes WHERE user_id = $1',
                [userId]
            );

            if (rows.length === 0) {
                // No note exists for this user yet, return empty content
                return res.status(200).json({ content: '' });
            }

            const { content, updated_at } = rows[0];

            // Check for expiration
            if (updated_at) {
                const lastUpdated = new Date(updated_at).getTime();
                const expirationTime = lastUpdated + EXPIRATION_HOURS * 60 * 60 * 1000;
                if (Date.now() > expirationTime) {
                    // Note has expired, clear it
                    await client.query(
                        'UPDATE notes SET content = $1, updated_at = NULL WHERE user_id = $2',
                        ['', userId]
                    );
                    return res.status(200).json({ content: '' });
                }
            }
            
            return res.status(200).json({ content: content || '' });

        } catch (error) {
            console.error('Error fetching note:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        } finally {
            client.release();
        }
    }

    // PUT /api/notepad - Save user's note
    if (req.method === 'PUT') {
        try {
            const { content } = req.body;
            if (typeof content !== 'string') {
                return res.status(400).json({ message: 'A "content" string is required.' });
            }

            // Use an UPSERT operation to either insert a new note or update an existing one
            const query = `
                INSERT INTO notes (user_id, content, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at;
            `;
            await pool.query(query, [userId, content]);
            
            return res.status(200).json({ message: 'Note saved successfully.' });

        } catch (error) {
            console.error('Error saving note:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}