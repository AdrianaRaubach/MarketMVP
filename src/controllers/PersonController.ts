import { Request, Response } from 'express';
import * as PersonModel from '../models/PersonModel';
import { PersonType } from '../enums/PersonType';
import bcrypt from 'bcryptjs';
import { userSchema } from '../validations/userSchema';
import { ZodError } from 'zod';
import * as VerificationModel from '../models/VerificationModel';
const nodemailer = require('nodemailer');

export function index(req: Request, res: Response): void {
    res.render('home', {
        user: req.session.user,
    });
}

export function showRegisterForm(req: Request, res: Response): void {
    res.render('signup', {
        PersonType: PersonType,
        error: null,
    });
}

export async function create(req: Request, res: Response): Promise<void> {
    try {
        const { first_name, last_name, email, password, confirm_password, type } = req.body;

        const validatedData = await userSchema.parseAsync({
            first_name,
            last_name,
            email,
            password,
            confirm_password,
            type,
        });

        const saltRounds = 12;
        const hash_password = await bcrypt.hash(validatedData.password, saltRounds);

        const personId = await PersonModel.create(
            validatedData.first_name,
            validatedData.last_name,
            validatedData.email,
            validatedData.type as PersonType,
            hash_password
        );

        const person =  await PersonModel.getById(personId);

        if (!person) {
            throw new Error('Erro ao criar usuário');
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        VerificationModel.createVerification(person.id, verificationCode, 15);

        req.session.pendingVerificationPersonId = person.id;

        const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verifique sua conta - MarketMVP',
            html: `
        <h1>Bem-vindo ao MarketMVP!</h1>
        <p>Seu código de verificação é: <strong style="font-size: 24px;">${verificationCode}</strong></p>
        <p>Este código expira em 15 minutos.</p>
        <p>Se você não criou uma conta, ignore este email.</p>
      `,
        });

        res.redirect('/check-email');
    } catch (error) {
        console.error('Erro ao criar usuário:', error);

        if (error instanceof ZodError) {
            const errorMessages = error.issues.map((err) => err.message).join(', ');
            return res.render('signup', {
                PersonType: PersonType,
                error: errorMessages,
            });
        }

        res.render('signup', {
            PersonType: PersonType,
            error: 'Erro ao criar usuário, por favor tente novamente mais tarde.',
        });
    }
}
