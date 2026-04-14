import { NextFunction, Response, Request } from 'express';
import { ForbiddenError } from './errorHandler';


export const isSeller = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.type !== 'seller') {
        throw new ForbiddenError('Acesso restrito a vendedores.');
    }

    next();
};
