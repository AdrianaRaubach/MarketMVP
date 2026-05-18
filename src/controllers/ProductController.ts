import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { productImageUpload, removeLocalProductImage, getUploadDriverLabel, multipleProductImageUpload, removeLocalProductImages, getLocalProductImageUrls } from '../config/upload';
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

export const uploadMultipleProductImages = (req: Request, res: Response, next: any) => {
  multipleProductImageUpload.array('images', 10)(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível processar as imagens enviadas.';
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
        },
        images: {
          take: 1,
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const adaptedProducts = products.map((product: any) => ({
      ...product,
      imageUrl: product.images[0]?.imageUrl || null,
      imageStorage: product.images[0]?.imageStorage || null
    }));

    res.render('seller-dashboard', {
      products: adaptedProducts,
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

export const getProductDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        seller: {
          include: {
            person: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                store_description: true,
                categories: true
              }
            }
          }
        },
        images: {
          orderBy: { created_at: 'asc' }
        },
        likes: true
      }
    });

    if (!product) {
      return res.status(404).render('404', { message: 'Produto não encontrado' });
    }

    let userLiked = false;
    if (req.session.user) {
      const user = await prisma.user.findUnique({
        where: { person_id: req.session.user.id }
      });

      if (user) {
        const likes = product.likes as any[];
        userLiked = likes.some((like) => like.user_id === user.id);
      }
    }

    const isAvailable = product.stock > 0;

    res.render('product-details', {
      product: {
        ...product,
        available: isAvailable,
        seller: {
          ...product.seller,
          person: product.seller.person
        }
      },
      user: req.session.user || null,
      userLiked,
      totalLikes: (product.likes as any[]).length,
      getProductCategoryLabel: (category: string) => {
        const option = PRODUCT_CATEGORY_OPTIONS.find(opt => opt.value === category);
        return option ? option.label : category;
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).render('500', { error: 'Erro ao carregar produto' });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Faça login para curtir produtos' });
  }

  const productId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { person_id: req.session.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const prismaAny = prisma as any;

    const existingLike = await prismaAny.productLike.findUnique({
      where: {
        product_id_user_id: {
          product_id: productId,
          user_id: user.id
        }
      }
    });

    let liked;
    if (existingLike) {
      await prismaAny.productLike.delete({
        where: {
          product_id_user_id: {
            product_id: productId,
            user_id: user.id
          }
        }
      });
      liked = false;
    } else {
      await prismaAny.productLike.create({
        data: {
          product_id: productId,
          user_id: user.id
        }
      });
      liked = true;
    }

    const totalLikes = await prismaAny.productLike.count({
      where: { product_id: productId }
    });

    res.json({ liked, totalLikes });
  } catch (error) {
    console.error('Erro ao processar like:', error);
    res.status(500).json({ error: 'Erro ao processar like' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number.parseFloat(String(req.body.price || '').replace(',', '.'));
  const stock = Number.parseInt(String(req.body.stock || ''), 10);

  if (!name || !description || !category || Number.isNaN(price) || Number.isNaN(stock)) {
    if (req.file) await removeLocalProductImage(req.file);
    if (req.files) await removeLocalProductImages(req.files as Express.Multer.File[]);
    return res.redirect('/seller-dashboard?error=Preencha todos os campos do produto.');
  }

  if (!isProductCategory(category)) {
    if (req.file) await removeLocalProductImage(req.file);
    if (req.files) await removeLocalProductImages(req.files as Express.Multer.File[]);
    return res.redirect('/seller-dashboard?error=Selecione uma categoria válida.');
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price,
        stock,
        seller_id: req.session.user!.id,
      }
    });

    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      const images = getLocalProductImageUrls(files);

      for (const img of images) {
        await prisma.productImage.create({
          data: {
            product_id: product.id,
            imageUrl: img.imageUrl,
            imageStorage: img.imageStorage
          }
        });
      }
    } else if (req.file) {
      const storedImage = await storeProductImage(req.file);
      if (storedImage) {
        await prisma.productImage.create({
          data: {
            product_id: product.id,
            imageUrl: storedImage.imageUrl,
            imageStorage: storedImage.imageStorage
          }
        });
      }
    }

    await LogModel.createLog({
      user_id: req.session.user!.id,
      method: 'POST',
      endpoint: '/seller-dashboard',
      action_summary: `Criou produto: ${name}`
    });

    return res.redirect('/seller-dashboard?success=Produto publicado com sucesso.');
  } catch (error) {
    if (req.file) await removeLocalProductImage(req.file);
    if (req.files) await removeLocalProductImages(req.files as Express.Multer.File[]);
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
      },
      images: {
        take: 1,
        orderBy: { created_at: 'asc' }
      }
    },
    orderBy: { created_at: 'desc' },
  });

  const adaptedProducts = products.map((product: any) => ({
    ...product,
    User: {
      name: `${product.seller.person.first_name} ${product.seller.person.last_name}`
    },
    imageUrl: product.images[0]?.imageUrl || null,
    imageStorage: product.images[0]?.imageStorage || null
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
