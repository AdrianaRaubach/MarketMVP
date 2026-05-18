import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import * as LogModel from '../models/LogModel';
import { updateProfileSchema, addressSchema, changePasswordSchema } from '../validations/profileSchema';
import { z } from 'zod';
import { ProductCategory, parseCategories, stringifyCategories, OPTIONS } from '../constants/product-categories';

export const showProfileSellerPublic = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);

    const person = await prisma.person.findUnique({
      where: {
        id: sellerId,
        type: 'seller'
      },
      include: {
        user: true,
        Addresses: true
      }
    });

    if (!person) {
      return res.status(404).render('404', { message: 'Vendedor não encontrado' });
    }

    const sellerProducts = await prisma.product.findMany({
      where: { seller_id: person.user?.id },
      include: {
        images: { take: 1 },
        seller: {
          include: {
            person: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const adaptedProducts = sellerProducts.map(product => ({
      ...product,
      User: {
        name: `${person.first_name} ${person.last_name}`
      },
      imageUrl: product.images[0]?.imageUrl || null
    }));

    const categoriesString = (person as any).categories;
    const sellerCategories = categoriesString ? parseCategories(categoriesString) : [];
    const mainAddress = person.Addresses?.[0] || null;

    const userData = {
      id: person.id,
      name: `${person.first_name} ${person.last_name}`,
      email: person.email,
      type: person.type,
      first_name: person.first_name,
      last_name: person.last_name,
      phone: person.phone,
      store_description: (person as any).store_description || '',
      categories: sellerCategories,
      address: mainAddress
    };

    res.render('profile-seller-public', {
      seller: userData,
      products: adaptedProducts,
      categoryOptions: OPTIONS,
      user: req.session.user || null,
      getProductCategoryLabel: (category: string) => {
        const option = OPTIONS.find(opt => opt.value === category);
        return option ? option.label : category;
      }
    });
  } catch (error) {
    console.error('Erro ao carregar perfil público do vendedor:', error);
    res.status(500).render('500', { error: 'Erro ao carregar perfil do vendedor' });
  }
};

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
    let sellerCategories: ProductCategory[] = [];

    if (person.type === 'seller' && person.user) {
      userProducts = await prisma.product.findMany({
        where: { seller_id: person.user.id },
        include: { images: { take: 1 } },
        take: 10,
        orderBy: { created_at: 'desc' }
      });

      const categoriesString = (person as any).categories;
      sellerCategories = categoriesString ? parseCategories(categoriesString) : [];
    }

    const mainAddress = person.Addresses?.[0] || null;

    const userData: any = {
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
    };

    if (person.type === 'seller') {
      userData.store_description = (person as any).store_description || '';
      userData.categories = sellerCategories;
    }

    res.render('profile', {
      user: userData,
      userProducts,
      categoryOptions: OPTIONS,
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

    const updateData: any = {
      first_name,
      last_name,
      email,
      cpf,
      phone,
      payment_method
    };

    if (req.session.user.type === 'seller') {
      const { store_description, categories } = req.body;

      if (store_description !== undefined) {
        updateData.store_description = store_description;
      }

      if (categories) {
        const categoriesArray = Array.isArray(categories) ? categories : [categories];
        updateData.categories = stringifyCategories(categoriesArray);
      }
    }

    await prisma.person.update({
      where: { id: req.session.user.id },
      data: updateData
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
