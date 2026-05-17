import prisma from '../config/prisma';

export interface User {
    id: number;
    person_id: number;
    hash_password: string;
    created_at: Date;
    updated_at: Date;
}

export async function getAll() {
    return await prisma.user.findMany();
}

export async function getByPersonId(person_id: number) {
    return await prisma.user.findUnique({
        where: { person_id }
    });
}

export async function create(person_id: number, hash_password: string) {
    return await prisma.user.create({
        data: { person_id, hash_password }
    });
}
