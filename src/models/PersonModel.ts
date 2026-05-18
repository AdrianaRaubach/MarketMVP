import prisma from '../config/prisma';
import { PersonType } from '../enums/PersonType.js';

export interface Person {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    type: PersonType;
    blocked: boolean;
    verified_email: boolean;
    last_login: Date | null;
    created_at: Date;
    updated_at: Date;
}

export async function getAll(): Promise<Person[]> {
    const people = await prisma.person.findMany({
        orderBy: { id: 'asc' }
    });
    return people.map(p => ({ ...p, type: p.type as PersonType }));
}

export async function getByName(name: string): Promise<Person[]> {
    const people = await prisma.person.findMany({
        where: {
            OR: [
                { first_name: { contains: name } },
                { last_name: { contains: name } }
            ]
        },
        orderBy: { id: 'asc' }
    });
    return people.map(p => ({ ...p, type: p.type as PersonType }));
}

export async function getByEmail(email: string): Promise<Person | undefined> {
    const person = await prisma.person.findUnique({
        where: { email }
    });
    return person ? { ...person, type: person.type as PersonType } : undefined;
}

export async function getById(id: number): Promise<Person | undefined> {
    const person = await prisma.person.findUnique({
        where: { id }
    });
    return person ? { ...person, type: person.type as PersonType } : undefined;
}

export async function create(
    first_name: string,
    last_name: string,
    email: string,
    type: PersonType,
    hash_password: string
): Promise<number> {
    const result = await prisma.$transaction(async (tx:any) => {
        const person = await tx.person.create({
            data: {
                first_name,
                last_name,
                email,
                type: type.toLowerCase(),
                verified_email: false
            }
        });

        await tx.user.create({
            data: {
                person_id: person.id,
                hash_password
            }
        });

        return person.id;
    });
    return result;
}

export async function updateLastLogin(personId: number): Promise<void> {
    await prisma.person.update({
        where: { id: personId },
        data: { last_login: new Date() }
    });
}

export async function updateBlocked(personId: number, blocked: boolean): Promise<void> {
    await prisma.person.update({
        where: { id: personId },
        data: { blocked }
    });
}

export async function updateVerifiedEmail(personId: number, verified: boolean): Promise<void> {
    await prisma.person.update({
        where: { id: personId },
        data: { verified_email: verified }
    });
}

export async function getPersonForSession(id: number) {
    const person = await getById(id);
    if (person) {
        return {
            id: person.id,
            name: `${person.first_name} ${person.last_name}`,
            email: person.email,
            type: person.type,
            blocked: person.blocked,
            verified_email: person.verified_email,
        };
    }
    return null;
}
