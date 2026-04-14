import { Request, Response, NextFunction } from 'express';

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro:', err);

    if (err.name === 'ForbiddenError' || err.message.includes('bloqueado')) {
        return res.status(403).render('403', {
            user: req.session.user,
            error: err.message,
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.redirect('/login?error=' + encodeURIComponent(err.message));
    }
};
