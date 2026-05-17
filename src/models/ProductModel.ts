import prisma from '../config/prisma';

export interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    imageUrl: string | null;
    imageStorage: string | null;
    seller_id: number;
    created_at: Date;
    updated_at: Date;
}

export async function createProduct(data: {
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    imageUrl?: string;
    imageStorage?: string;
    seller_id: number;
}) {
    return await prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            stock: data.stock,
            imageUrl: data.imageUrl,
            imageStorage: data.imageStorage,
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
            }
        },
        orderBy: { created_at: 'desc' }
    });
}

export async function getProductsBySeller(seller_id: number) {
    return await prisma.product.findMany({
        where: { seller_id },
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
            }
        }
    });
}

export async function updateProduct(id: number, data: Partial<Product>) {
    return await prisma.product.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            stock: data.stock,
            imageUrl: data.imageUrl,
            imageStorage: data.imageStorage,
            updated_at: new Date()
        }
    });
}

export async function deleteProduct(id: number) {
    return await prisma.product.delete({
        where: { id }
    });
}

export async function updateStock(id: number, quantity: number) {
    return await prisma.product.update({
        where: { id },
        data: {
            stock: {
                decrement: quantity
            }
        }
    });
}
