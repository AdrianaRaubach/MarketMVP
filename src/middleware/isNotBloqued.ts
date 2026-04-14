import { NextFunction, Response, Request } from 'express';
import { ForbiddenError } from './errorHandler';

export const isNotBlocked = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user?.blocked === true) {
        throw new ForbiddenError('Sua conta está bloqueada. Entre em contato com o suporte.');
    }
    next();
};
