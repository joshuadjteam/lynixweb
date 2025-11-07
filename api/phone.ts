
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CallStatus } from '../src/types';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const getUserIdFromRequest = (req: VercelRequest): string | null => {
    return req.headers['x-user-id'] as string || null;
}

const ensureTableExists = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS calls (
            id SERIAL PRIMARY KEY,
            caller_id VARCHAR(255) NOT NULL,
            callee_id VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            answered_at TIMESTAMPTZ,
            ended_at TIMESTAMPTZ,
            FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (callee_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { type, id: callId } = req.query;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    try {
        await ensureTableExists();
    } catch(e) {
        console.error("Failed to ensure calls table exists", e);
        return res.status(500).json({ message: 'Database initialization failed.' });
    }

    // GET operations
    if (req.method === 'GET') {
        // GET /api/phone?type=users - Fetch all callable users
        if (type === 'users') {
            try {
                const { rows } = await pool.query('SELECT id, username FROM users WHERE id != $1', [userId]);
                return res.status(200).json(rows);
            } catch (error) {
                console.error('Error fetching phone users:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
        // GET /api/phone?type=status - Check for incoming calls or active call status
        if (type === 'status') {
            try {
                const { rows } = await pool.query(
                    `SELECT c.id, c.status, c.answered_at, u_caller.username as caller_username, u_callee.username as callee_username
                     FROM calls c
                     JOIN users u_caller ON c.caller_id = u_caller.id
                     JOIN users u_callee ON c.callee_id = u_callee.id
                     WHERE (c.callee_id = $1 OR c.caller_id = $1) AND c.status != $2 AND c.status != $3
                     ORDER BY c.created_at DESC LIMIT 1`,
                    [userId, CallStatus.Ended, CallStatus.Declined]
                );
                return res.status(200).json(rows[0] || null);
            } catch (error) {
                console.error('Error fetching call status:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
        // GET /api/phone?id=[id] - Get details for a specific call
        if (callId) {
             try {
                const { rows } = await pool.query(
                     `SELECT c.id, c.status, c.answered_at, u_caller.username as caller_username, u_callee.username as callee_username
                     FROM calls c
                     JOIN users u_caller ON c.caller_id = u_caller.id
                     JOIN users u_callee ON c.callee_id = u_callee.id
                     WHERE c.id = $1 AND (c.caller_id = $2 OR c.callee_id = $2)`,
                    [callId, userId]
                );
                if(rows.length === 0) return res.status(404).json({ message: 'Call not found.' });
                return res.status(200).json(rows[0]);
            } catch (error) {
                console.error(`Error fetching call ${callId}:`, error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
        
    }
    // POST /api/phone?type=call - Initiate a call
    else if (req.method === 'POST' && type === 'call') {
        try {
            const { calleeId } = req.body;
            if (!calleeId) {
                return res.status(400).json({ message: 'calleeId is required.' });
            }
            const { rows } = await pool.query(
                'INSERT INTO calls (caller_id, callee_id, status) VALUES ($1, $2, $3) RETURNING *',
                [userId, calleeId, CallStatus.Ringing]
            );
            return res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error initiating call:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
    // PUT /api/phone?id=[id] - Update a call's status (answer, end, decline)
    else if (req.method === 'PUT' && callId) {
        try {
            const { status } = req.body;
            if (!status || !Object.values(CallStatus).includes(status as CallStatus)) {
                return res.status(400).json({ message: 'A valid status is required.' });
            }
            let query = 'UPDATE calls SET status = $1';
            const values: any[] = [status];
            if (status === CallStatus.Active) {
                query += ', answered_at = NOW()';
            }
            if (status === CallStatus.Ended) {
                query += ', ended_at = NOW()';
            }
            query += ' WHERE id = $2 RETURNING *';
            values.push(callId);
            
            const { rows } = await pool.query(query, values);
            if(rows.length === 0) return res.status(404).json({ message: 'Call not found.' });
            return res.status(200).json(rows[0]);

        } catch (error) {
            console.error(`Error updating call ${callId}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
