import prisma from '../config/prisma';

export interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    seller_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface ProductImage {
    id: number;
    imageUrl: string | null;
    imageStorage: string | null;
    product_id: number;
    created_at: Date;
    updated_at: Date;
}

export async function createProduct(data: {
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    seller_id: number;
}) {
    return await prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            stock: data.stock,
            seller_id: data.seller_id
        }
    });
}

export async function getAllProducts(filters?: {
    search?: string;
    category?: string;
    matchingCategories?: string[];
}) {
    const where: any = {};

    if (filters?.category) {
        where.category = filters.category;
    }

    if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        where.OR = [
            { name: { contains: searchLower } },
            { description: { contains: searchLower } },
            ...(filters.matchingCategories?.length ?
                [{ category: { in: filters.matchingCategories } }] : [])
        ];
    }

    return await prisma.product.findMany({
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
            images: true
        },
        orderBy: { created_at: 'desc' }
    });
}

export async function getProductsBySeller(seller_id: number) {
    return await prisma.product.findMany({
        where: { seller_id },
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
            images: true
        },
        orderBy: { created_at: 'desc' }
    });
}

export async function getProductById(id: number) {
    return await prisma.product.findUnique({
        where: { id },
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
                            categories: true,
                        }
                    }
                }
            },
            images: true,
            likes: true,
            comments: {
                include: {
                    user: {
                        include: {
                            person: {
                                select: {
                                    first_name: true,
                                    last_name: true
                                }
                            }
                        }
                    },
                    images: true,
                    likes: true
                },
                orderBy: { created_at: 'desc' }
            }
        }
    });
}
