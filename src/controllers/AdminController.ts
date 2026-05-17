import { Request, Response } from 'express';
import * as PersonModel from '../models/PersonModel';

export const showAdminDashboard = async (req: Request, res: Response) => {
    try {
        const persons = await PersonModel.getAll();
        res.render('admin-dashboard', {
            user: req.session.user,
            persons: persons,
            count: persons.length,
            total_blocked: persons.filter((p) => p.blocked).length,
        });
    } catch (error) {
        console.error('Erro ao carregar admin dashboard:', error);
        res.status(500).send('Erro interno do servidor');
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const persons = await PersonModel.getByName(name);
        res.render('admin-dashboard', {
            user: req.session.user,
            persons: persons,
            count: persons.length,
            total_blocked: persons.filter((p) => p.blocked).length,
        });
    } catch (error) {
        console.error('Erro ao carregar admin dashboard:', error);
        res.status(500).send('Erro interno do servidor');
    }
};

export const blockUser = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const person = await PersonModel.getById(userId);

        if (!person) {
            return res.status(404).send('Usuário não encontrado');
        }

        const newBlockedStatus = !person.blocked;
        PersonModel.updateBlocked(userId, newBlockedStatus);

        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error('Erro ao alternar status do usuário:', error);
        res.status(500).send('Erro interno ao processar solicitação');
    }
};
