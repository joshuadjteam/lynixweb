
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
        CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            notes TEXT,
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
    } catch (e) {
        console.error("Failed to ensure contacts table exists", e);
        return res.status(500).json({ message: 'Database initialization failed.' });
    }
    
    const { id } = req.query;

    if (id && typeof id === 'string' && /^\d+$/.test(id)) {
        const contactId = parseInt(id, 10);
        // Handle single-contact operations (PUT, DELETE)
        if (req.method === 'PUT') {
            try {
                const { name, email, phone, notes } = req.body;
                if (!name) {
                    return res.status(400).json({ message: 'Name is a required field.' });
                }
                const { rows } = await pool.query(
                    'UPDATE contacts SET name = $1, email = $2, phone = $3, notes = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
                    [name, email, phone, notes, contactId, userId]
                );
                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Contact not found or you do not have permission to edit it.' });
                }
                return res.status(200).json(rows[0]);
            } catch (error) {
                console.error(`Error updating contact ${id}:`, error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }

        if (req.method === 'DELETE') {
            try {
                const { rowCount } = await pool.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [contactId, userId]);
                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Contact not found or you do not have permission to delete it.' });
                }
                return res.status(204).end();
            } catch (error) {
                console.error(`Error deleting contact ${id}:`, error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    } else {
         // Handle collection operations (GET all, POST create)
        if (req.method === 'GET') {
            try {
                const { rows } = await pool.query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY name ASC', [userId]);
                return res.status(200).json(rows);
            } catch (error) {
                console.error('Error fetching contacts:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }

        if (req.method === 'POST') {
            try {
                const { name, email, phone, notes } = req.body;
                if (!name) {
                    return res.status(400).json({ message: 'Name is a required field.' });
                }
                const { rows } = await pool.query(
                    'INSERT INTO contacts (user_id, name, email, phone, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [userId, name, email, phone, notes]
                );
                return res.status(201).json(rows[0]);
            } catch (error) {
                console.error('Error creating contact:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
