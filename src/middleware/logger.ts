import { Request, Response, NextFunction } from 'express';
import * as LogModel from '../models/LogModel';

const METHODS_TO_LOG = ['POST', 'PUT', 'PATCH', 'DELETE'];

function generateActionSummary(req: Request): string {
    const { method, originalUrl, params } = req;

    if (originalUrl.includes('/login')) return 'Tentativa de login';
    if (originalUrl.includes('/logout')) return 'Logout do sistema';
    if (originalUrl.includes('/signup')) return 'Cadastro de novo usuário';
    if (originalUrl.includes('/verify-email')) return 'Verificação de email';
    if (originalUrl.includes('/resend-verification')) return 'Reenvio de código de verificação';
    if (originalUrl.includes('/block-user')) {
        return 'Bloqueio/desbloqueio de usuário';
    }
    if (originalUrl.includes('/admin-dashboard')) return 'Acesso ao painel administrativo';

    return `${method} ${originalUrl}`;
}

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
    if (!METHODS_TO_LOG.includes(req.method)) {
        return next();
    }

    let actionSummary = generateActionSummary(req);

    const logAction = () => {
        if (!req.session?.user?.id) {
            return;
        }

        setImmediate(() => {
            try {
                LogModel.createLog({
                    user_id: req.session.user!.id,
                    method: req.method,
                    endpoint: req.originalUrl,
                    action_summary: actionSummary,
                }).catch((logError) => {
                    console.error('Erro ao registrar log:', logError);
                });
            } catch (error) {
                console.error('Erro ao processar log:', error);
            }
        });
    };

    logAction();
    next();
};
