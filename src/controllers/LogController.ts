import { Request, Response } from 'express';
import * as LogModel from '../models/LogModel';
import * as PersonModel from '../models/PersonModel';

export const showLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const logs = await LogModel.getAllLogs(limit, offset);
        const total = await LogModel.getLogsCount();

        const enrichedLogs = await Promise.all((logs as any[]).map(async (log: any) => {
            const person = log.user_id ? await PersonModel.getById(log.user_id) : null;
            return {
                ...log,
                user_name: person ? `${person.first_name} ${person.last_name}` : 'Sistema',
                user_email: person?.email || 'Não autenticado',
            };
        }));

        res.render('admin-logs', {
            user: req.session.user,
            logs: enrichedLogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        res.status(500).send('Erro interno do servidor');
    }
};
