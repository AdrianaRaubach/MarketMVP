import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import * as LogModel from '../models/LogModel';
import { updateProfileSchema, addressSchema, changePasswordSchema } from '../validations/profileSchema';
import { z } from 'zod';

export const showProfile = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const person = await prisma.person.findUnique({
      where: { id: req.session.user.id },
      include: {
        user: true,
        Addresses: true
      }
    });

    if (!person) {
      return res.redirect('/login');
    }

    let userProducts: any = [];
    if (person.type === 'seller' && person.user) {
      userProducts = await prisma.product.findMany({
        where: { seller_id: person.user.id },
        include: { images: { take: 1 } },
        take: 10,
        orderBy: { created_at: 'desc' }
      });
    }

    const mainAddress = person.Addresses?.[0] || null;

    res.render('profile', {
      user: {
        id: person.id,
        name: `${person.first_name} ${person.last_name}`,
        email: person.email,
        type: person.type,
        first_name: person.first_name,
        last_name: person.last_name,
        cpf: person.cpf,
        phone: person.phone,
        payment_method: person.payment_method,
        address: mainAddress
      },
      userProducts,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    res.status(500).send('Erro ao carregar perfil');
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const { first_name, last_name, email, cpf, phone, payment_method } = validatedData;

    await prisma.person.update({
      where: { id: req.session.user.id },
      data: { first_name, last_name, email, cpf, phone, payment_method }
    });

    req.session.user.name = `${first_name} ${last_name}`;
    req.session.user.email = email;

    await LogModel.createLog({
      user_id: req.session.user.id,
      method: 'POST',
      endpoint: '/profile/update',
      action_summary: 'Atualizou o perfil'
    });

    res.redirect('/profile?success=Perfil atualizado com sucesso!');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => err.message).join(', ');
      return res.redirect(`/profile?error=${encodeURIComponent(errors)}`);
    }
    console.error('Erro ao atualizar perfil:', error);
    res.redirect('/profile?error=Erro ao atualizar perfil');
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const validatedData = addressSchema.parse(req.body);
    const { zipCode, state, city, street, number, complement } = validatedData;

    const existingAddress = await prisma.address.findFirst({
      where: { person_id: req.session.user.id }
    });

    if (existingAddress) {
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          zipCode,
          state,
          city,
          street,
          number: number || '',
          complement: complement || ''
        }
      });
    } else {
      await prisma.address.create({
        data: {
          zipCode,
          state,
          city,
          street,
          number: number || '',
          complement: complement || '',
          person_id: req.session.user.id
        }
      });
    }

    await LogModel.createLog({
      user_id: req.session.user.id,
      method: 'POST',
      endpoint: '/profile/address',
      action_summary: 'Atualizou o endereço'
    });

    res.redirect('/profile?success=Endereço atualizado com sucesso!');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => err.message).join(', ');
      return res.redirect(`/profile?error=${encodeURIComponent(errors)}`);
    }
    console.error('Erro ao atualizar endereço:', error);
    res.redirect('/profile?error=Erro ao atualizar endereço');
  }
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const { current_password, new_password } = validatedData;

    const person = await prisma.person.findUnique({
      where: { id: req.session.user.id },
      include: { user: true }
    });

    if (!person || !person.user) {
      return res.redirect('/profile?error=Usuário não encontrado');
    }

    const user = person.user;

    if (!bcrypt.compareSync(current_password, user.hash_password)) {
      return res.redirect('/profile?error=Senha atual incorreta');
    }

    const newHash = bcrypt.hashSync(new_password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hash_password: newHash }
    });

    await LogModel.createLog({
      user_id: req.session.user.id,
      method: 'POST',
      endpoint: '/profile/change-password',
      action_summary: 'Alterou a senha'
    });

    res.redirect('/profile?success=Senha alterada com sucesso!');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => err.message).join(', ');
      return res.redirect(`/profile?error=${encodeURIComponent(errors)}`);
    }
    console.error('Erro ao alterar senha:', error);
    res.redirect('/profile?error=Erro ao alterar senha');
  }
};
