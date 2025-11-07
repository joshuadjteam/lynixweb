import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../src/types';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.POSTGRES_URL) {
        console.error('FATAL: POSTGRES_URL environment variable is not set.');
        return res.status(503).json({ message: 'Service Unavailable: Database connection is not configured.' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const { rows } = await pool.query(
            "SELECT id, username, password_hash, role, plan, email, sip, billing, chat_enabled, ai_enabled, localmail_enabled FROM users WHERE lower(username) = $1",
            [username.toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Do not send the password hash to the client
        const userToReturn: User = {
            id: user.id,
            username: user.username,
            role: user.role,
            plan: user.plan,
            email: user.email,
            sip: user.sip,
            billing: user.billing,
            chat_enabled: user.chat_enabled || false,
            ai_enabled: user.ai_enabled || false,
            localmail_enabled: user.localmail_enabled || false
        };

        return res.status(200).json(userToReturn);

    } catch (error) {
        console.error('Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown internal error occurred.';
        return res.status(500).json({ message: errorMessage });
    }
}