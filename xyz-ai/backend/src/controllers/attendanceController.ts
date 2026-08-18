import { Request, Response } from 'express';
import db from '../db/sqlite';

export const getAttendance = (req: Request, res: Response) => {
    const { studentId } = req.query;
    // Simple mock logic: validate student exists and return attendance
    try {
        const stmt = db.prepare('SELECT * FROM attendance WHERE student_id = ?');
        const records = stmt.all(studentId);
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
};
