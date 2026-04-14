import db from '../config/db';

export interface ActionLog {
    id: number;
    user_id: number | null;
    method: string;
    endpoint: string;
    action_summary: string;
    created_at: string;
}

export const createLog = (log: Omit<ActionLog, 'id' | 'created_at'>) => {
    const stmt = db.prepare(`
        INSERT INTO logs (user_id, method, endpoint, action_summary)
        VALUES (?, ?, ?, ?)
    `);

    return stmt.run(log.user_id, log.method, log.endpoint, log.action_summary);
};

export const getAllLogs = (limit: number = 50, offset: number = 0) => {
    const stmt = db.prepare(`
        SELECT l.*, u.hash_password
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as (ActionLog & { hash_password?: string })[];
};

export const getLogsCount = () => {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM logs');
    return (stmt.get() as { total: number }).total;
};
