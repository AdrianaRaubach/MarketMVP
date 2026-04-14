import { z } from 'zod';
import { PersonType } from '../enums/PersonType';
import * as PersonModel from '../models/PersonModel';

export const userSchema = z
    .object({
        first_name: z.string().min(3, 'Nome é obrigatório'),
        last_name: z.string().min(3, 'Sobrenome é obrigatório'),
        email: z.email('Email inválido').refine(async (email) => {
            const existingUser = PersonModel.getByEmail(email);
            return !existingUser;
        }, 'Este email já está cadastrado'),
        password: z
            .string()
            .min(8, 'A senha deve ter no mínimo 8 caracteres')
            .refine(
                (password) =>
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
                        password
                    ),
                'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
            ),
        confirm_password: z.string(),
        type: z.enum([PersonType.CUSTOMER, PersonType.SELLER, PersonType.ADMIN] as const, {
            error: 'Tipo de pessoa inválido',
        }),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'As senhas não coincidem',
        path: ['confirm_password'],
    });
