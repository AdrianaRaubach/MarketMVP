import { NextFunction, Response, Request } from 'express';

export const isVerified = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user?.verified_email !== true) {
        return res.redirect('/check-email');
    }
    next();
};
