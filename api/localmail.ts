
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// Simplified auth helper - NOT FOR PRODUCTION
const getUserIdFromRequest = (req: VercelRequest): string | null => {
    return req.headers['x-user-id'] as string || null;
}

const ensureTableExists = async () => {
    // Note: This relies on the `users` table already existing.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS localmails (
            id SERIAL PRIMARY KEY,
            sender_id VARCHAR(255) NOT NULL,
            recipient_username VARCHAR(255) NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
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
        console.error("Failed to ensure localmails table exists", e);
        return res.status(500).json({ message: 'Database initialization failed.' });
    }

    // GET /api/localmail?view=inbox|sent
    if (req.method === 'GET') {
        try {
            const { view } = req.query;
            let query;
            if (view === 'sent') {
                query = `
                    SELECT m.id, m.sender_id, u.username as sender_username, m.recipient_username, m.subject, m.body, m.timestamp, m.is_read
                    FROM localmails m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.sender_id = $1
                    ORDER BY m.timestamp DESC`;
            } else { // Default to inbox
                query = `
                    SELECT m.id, m.sender_id, u.username as sender_username, m.recipient_username, m.subject, m.body, m.timestamp, m.is_read
                    FROM localmails m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.recipient_username = (SELECT username FROM users WHERE id = $1)
                    ORDER BY m.timestamp DESC`;
            }
            const { rows } = await pool.query(query, [userId]);
            return res.status(200).json(rows);

        } catch (error) {
            console.error('Error fetching localmail:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // POST /api/localmail - Send a new message
    if (req.method === 'POST') {
        const client = await pool.connect();
        try {
            const { recipients, subject, body } = req.body;
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !body) {
                return res.status(400).json({ message: 'Recipients, subject, and body are required.' });
            }

            const senderUsernameResult = await client.query('SELECT username FROM users WHERE id = $1', [userId]);
            if (senderUsernameResult.rows.length === 0) {
                 return res.status(404).json({ message: 'Sender not found.' });
            }
            
            await client.query('BEGIN');

            for (const recipient of recipients) {
                const recipientUsername = recipient.split('@')[0].toLowerCase();
                const recipientUserResult = await client.query('SELECT id, username, localmail_enabled FROM users WHERE lower(username) = $1', [recipientUsername]);
                
                if (recipientUserResult.rows.length === 0) {
                    throw new Error(`Recipient "${recipient}" not found.`);
                }
                if (!recipientUserResult.rows[0].localmail_enabled) {
                    throw new Error(`Recipient "${recipient}" does not have LocalMail enabled.`);
                }

                await client.query(
                    'INSERT INTO localmails (sender_id, recipient_username, subject, body) VALUES ($1, $2, $3, $4)',
                    [userId, recipientUserResult.rows[0].username, subject, body]
                );
            }
            
            await client.query('COMMIT');
            return res.status(201).json({ message: 'Message sent successfully.' });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error sending localmail:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown internal error occurred.';
            return res.status(500).json({ message: errorMessage });
        } finally {
            client.release();
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
