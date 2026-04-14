import dotenv from 'dotenv';
dotenv.config();
const nodemailer = require('nodemailer');

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendVerificationEmail(to: string, code: string, isResend: boolean = false) {
        const subject = isResend
            ? 'Novo código de verificação - MarketMVP'
            : 'Verifique sua conta - MarketMVP';
        const title = isResend ? 'Novo código de verificação' : 'Bem-vindo ao MarketMVP!';

        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            html: `
        <h1>${title}</h1>
        <p>Seu código de verificação é: <strong style="font-size: 24px;">${code}</strong></p>
        <p>Este código expira em 15 minutos.</p>
        ${!isResend ? '<p>Se você não criou uma conta, ignore este email.</p>' : ''}
      `,
        });
    }
}
