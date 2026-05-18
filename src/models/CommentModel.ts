import prisma from '../config/prisma';

export interface Comment {
    id: number;
    content: string;
    user_id: number;
    product_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface CommentImage {
    id: number;
    imageUrl: string | null;
    imageStorage: string | null;
    comment_id: number;
    created_at: Date;
    updated_at: Date;
}

export async function createComment(data: {
    content: string;
    user_id: number;
    product_id: number;
}) {
    return await prisma.comment.create({
        data: {
            content: data.content,
            user_id: data.user_id,
            product_id: data.product_id
        }
    });
}

export async function deleteComment(comment_id: number) {
    return await prisma.comment.delete({
        where: { id: comment_id }
    });
}

export async function getCommentsByProduct(product_id: number) {
    return await prisma.comment.findMany({
        where: { product_id },
        include: {
            user: {
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

export async function getCommentById(comment_id: number) {
    return await prisma.comment.findUnique({
        where: { id: comment_id },
        include: {
            user: {
                include: {
                    person: true
                }
            },
            images: true
        }
    });
}
