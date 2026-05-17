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

export async function getAllProducts() {
    return await prisma.product.findMany({
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
                    person: true
                }
            },
            images: true
        }
    });
}
