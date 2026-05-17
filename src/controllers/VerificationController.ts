import { Request, Response } from 'express';
import * as PersonModel from '../models/PersonModel';
import * as VerificationModel from '../models/VerificationModel';
import { EmailService } from '../services/EmailService';

const emailService = new EmailService();

export const showCheckEmailPage = (req: Request, res: Response) => {
    if (req.session.user?.verified_email === true) {
        return res.redirect('/');
    }

    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('check-email', {
        user: req.session.user,
        email: req.session.user.email,
    });
};

export const resendVerification = async (req: Request, res: Response) => {
    if (!req.session.user && !req.session.pendingVerificationPersonId) {
        return res.status(401).json({ error: 'Usuário não logado' });
    }

    const personId = req.session.user?.id || req.session.pendingVerificationPersonId;

    if (!personId) {
        return res.status(401).json({ error: 'Sessão inválida' });
    }

    const person = await PersonModel.getById(personId);

    if (!person) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (person.verified_email === true) {
        return res.status(400).json({ error: 'Email já verificado' });
    }

    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await VerificationModel.invalidateOldVerifications(personId);
        await VerificationModel.createVerification(personId, verificationCode, 15);

        await emailService.sendVerificationEmail(person.email, verificationCode, true);

        return res.status(200).json({ message: 'Código reenviado com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({ error: 'Erro ao enviar email' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { code } = req.body;
    const personId = req.session.user?.id || req.session.pendingVerificationPersonId;

    if (!personId) {
        return res.status(401).json({ error: 'Sessão inválida. Por favor, faça login novamente.' });
    }

    try {
        const verification = await VerificationModel.getValidVerification(personId, code);

        if (!verification) {
            return res.status(400).json({ error: 'Código inválido ou expirado' });
        }

        if (verification.attempts >= 5) {
            return res.status(400).json({ error: 'Muitas tentativas. Solicite um novo código.' });
        }

        await VerificationModel.updateVerificationAttempts(verification.id, verification.attempts + 1);
        await VerificationModel.markAsVerified(personId);

        if (req.session.user) {
            req.session.user.verified_email = true;
        }

        delete req.session.pendingVerificationPersonId;

        if (!req.session.user) {
            const person = await PersonModel.getById(personId);
            if (person) {
                req.session.user = {
                    id: person.id,
                    name: `${person.first_name} ${person.last_name}`,
                    email: person.email,
                    type: person.type,
                    blocked: person.blocked,
                    verified_email: true,
                };
            }
        }

        res.redirect('/');
    } catch (error) {
        console.error('Erro ao verificar email:', error);
        res.status(500).json({ error: 'Erro interno ao verificar código' });
    }
};
