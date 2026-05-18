import { z } from 'zod';
import { PaymentMethod } from '../enums/PaymentMethod';

export const updateProfileSchema = z.object({
  first_name: z.string().min(3, 'Nome é obrigatório'),
  last_name: z.string().min(3, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpf: z.string()
    .regex(/^\d+$/, 'CPF deve conter apenas números')
    .pipe(z.string().refine(isValidCPF, 'CPF inválido'))
    .optional(),
  phone: z.string()
    .regex(/^\d+$/, 'Telefone deve conter apenas números')
    .min(10, 'Telefone deve ter no mínimo 10 caracteres')
    .max(11, 'Telefone deve ter no máximo 11 caracteres')
    .optional(),
    payment_method: z.enum([PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.PIX] as const, {
        error: 'Tipo de pessoa inválido',
    }),
});

export const addressSchema = z.object({
  zipCode: z.string()
    .regex(/^\d+$/, 'CEP deve conter apenas números')
    .min(8, 'CEP deve ter 8 caracteres')
    .max(8, 'CEP deve ter 8 caracteres'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Estado deve ter 2 caracteres'),
  city: z.string().min(3, 'Cidade é obrigatória'),
  street: z.string().min(3, 'Logradouro é obrigatório'),
  number: z.string()
    .regex(/^\d+$/, 'Número deve conter apenas números')
    .optional(),
  complement: z.string().optional()
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .refine(
      (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password),
      'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    ),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password']
});

function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cleanCPF.charAt(10));
}

