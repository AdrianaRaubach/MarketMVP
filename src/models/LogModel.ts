import prisma from '../config/prisma';

export async function createLog(log: { user_id: number; method: string; endpoint: string; action_summary: string }) {
    return await prisma.log.create({
        data: {
            user_id: log.user_id,
            method: log.method,
            endpoint: log.endpoint,
            action_summary: log.action_summary
        }
    });
}

export async function getAllLogs(limit: number = 50, offset: number = 0) {
    const logs = await prisma.$queryRaw`
        SELECT
            l.*,
            p.id as person_id,
            p.first_name,
            p.last_name,
            p.email
        FROM logs l
        INNER JOIN users u ON l.user_id = u.id
        INNER JOIN persons p ON u.person_id = p.id
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;

    return logs;
}

export async function getLogsCount(): Promise<number> {
    return await prisma.log.count();
}
