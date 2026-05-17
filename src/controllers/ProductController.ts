import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { productImageUpload, removeLocalProductImage, getUploadDriverLabel } from '../config/upload';
import { storeProductImage } from '../services/product-image-storage';
import { findMatchingProductCategories, isProductCategory, PRODUCT_CATEGORY_OPTIONS, getProductCategoryLabel } from '../constants/product-categories';
import * as LogModel from '../models/LogModel';

export const uploadProductImage = (req: Request, res: Response, next: any) => {
  productImageUpload.single('image')(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível processar a imagem enviada.';
      if (req.accepts('html')) {
        return res.redirect(`/seller-dashboard?error=${encodeURIComponent(message)}`);
      }
      return res.status(400).json({ message });
    }
    next();
  });
}

export const showSellerDashboard = async (req: Request, res: Response) => {
  try {
    const where = req.session.user!.type === 'admin'
      ? {}
      : { seller_id: req.session.user!.id };

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          include: {
            person: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.render('seller-dashboard', {
      products,
      user: req.session.user,
      error: req.query.error,
      success: req.query.success,
      uploadDriverLabel: getUploadDriverLabel(),
      categoryOptions: PRODUCT_CATEGORY_OPTIONS,
      getProductCategoryLabel,
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).render('seller-dashboard', {
      products: [],
      user: req.session.user,
      error: 'Erro ao carregar produtos',
      uploadDriverLabel: getUploadDriverLabel(),
      categoryOptions: PRODUCT_CATEGORY_OPTIONS,
      getProductCategoryLabel,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number.parseFloat(String(req.body.price || '').replace(',', '.'));
  const stock = Number.parseInt(String(req.body.stock || ''), 10);

  if (!name || !description || !category || Number.isNaN(price) || Number.isNaN(stock)) {
    await removeLocalProductImage(req.file);
    return res.redirect('/seller-dashboard?error=Preencha todos os campos do produto.');
  }

  if (!isProductCategory(category)) {
    await removeLocalProductImage(req.file);
    return res.redirect('/seller-dashboard?error=Selecione uma categoria válida.');
  }

  try {
    const storedImage = await storeProductImage(req.file);

    await prisma.product.create({
      data: {
        name,
        description,
        category,
        price,
        stock,
        imageUrl: storedImage?.imageUrl,
        imageStorage: storedImage?.imageStorage,
        seller_id: req.session.user!.id,
      }
    });

    await LogModel.createLog({
      user_id: req.session.user!.id,
      method: 'POST',
      endpoint: '/seller-dashboard',
      action_summary: `Criou produto: ${name}`
    });

    return res.redirect('/seller-dashboard?success=Produto publicado com sucesso.');
  } catch (error) {
    await removeLocalProductImage(req.file);
    console.error(error);
    return res.redirect('/seller-dashboard?error=Não foi possível publicar o produto.');
  }
};

export const listAllProducts = async (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const selectedCategory = isProductCategory(category) ? category : '';
  const matchingCategories = findMatchingProductCategories(search);

  const products = await prisma.product.findMany({
    where: {
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          ...(matchingCategories.length > 0 ? [{ category: { in: matchingCategories } }] : []),
        ],
      } : {}),
    },
    include: {
      seller: {
        include: {
          person: {
            select: {
              first_name: true,
              last_name: true,
            }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' },
  });

  const adaptedProducts = products.map(product => ({
    ...product,
    User: {
      name: `${product.seller.person.first_name} ${product.seller.person.last_name}`
    }
  }));

  res.render('home', {
    products: adaptedProducts,
    search: search,
    selectedCategory: selectedCategory,
    categoryOptions: PRODUCT_CATEGORY_OPTIONS,
    getProductCategoryLabel,
    user: req.session.user,
    featuredCategories: PRODUCT_CATEGORY_OPTIONS.slice(0, 4),
  });
};
