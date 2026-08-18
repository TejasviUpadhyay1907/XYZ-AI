import { Request, Response } from 'express';
import db from '../db/sqlite';

export const getStudentProfile = (req: Request, res: Response) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM students WHERE student_id = ?');
    const student = stmt.get(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
};
