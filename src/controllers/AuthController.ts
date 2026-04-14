import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as PersonModel from '../models/PersonModel';
import * as UserModel from '../models/UserModel';

export const showLoginForm = (req: Request, res: Response) => {
    if (req.session.user) return res.redirect('/');
    res.render('login');
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const person = PersonModel.getByEmail(email);

        if (!person) {
            return res.status(401).render('login', {
                error: 'Email ou senha inválidos',
            });
        }

        const user = UserModel.getByPersonId(person.id);

        if (!user) {
            return res.status(401).render('login', {
                error: 'Email ou senha inválidos',
            });
        }

        const isValid = await bcrypt.compare(password, user.hash_password);

        if (isValid) {
            PersonModel.updateLastLogin(person.id);
            req.session.user = {
                id: person.id,
                name: `${person.first_name} ${person.last_name}`,
                email: person.email,
                type: person.type,
                blocked: person.blocked,
                verified_email: person.verified_email,
            };

            const redirectTo = req.session.returnTo || '/';
            delete req.session.returnTo;

            return res.redirect(redirectTo);
        }

        return res.status(401).render('login', {
            error: 'Email ou senha inválidos',
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).render('login', {
            error: 'Erro interno no servidor',
        });
    }
};

export const logout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
        }
        res.redirect('/');
    });
};

