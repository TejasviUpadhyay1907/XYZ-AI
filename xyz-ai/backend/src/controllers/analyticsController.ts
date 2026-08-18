import { Request, Response } from 'express';
import db from '../db/sqlite';

export const getSchoolAnalytics = (req: Request, res: Response) => {
    // Principal-only access middleware should wrap this call in routes
    const stmt = db.prepare('SELECT status, COUNT(*) as count FROM attendance GROUP BY status');
    const stats = stmt.all();
    res.json({ success: true, data: stats });
};
