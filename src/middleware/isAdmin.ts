import { NextFunction, Response, Request } from 'express';
import { ForbiddenError } from './errorHandler';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.type !== 'admin') {
        throw new ForbiddenError('Acesso restrito a administradores.');
    }

    next();
};
