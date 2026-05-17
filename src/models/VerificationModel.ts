// src/models/VerificationModel.ts
import prisma from '../config/prisma';

export async function createVerification(personId: number, code: string, expiresInMinutes: number = 15) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    return await prisma.emailVerification.create({
        data: {
            person_id: personId,
            code,
            expires_at: expiresAt,
            attempts: 0
        }
    });
}

export async function getValidVerification(personId: number, code: string) {
    return await prisma.emailVerification.findFirst({
        where: {
            person_id: personId,
            code,
            verified_at: null,
            expires_at: { gt: new Date() }
        },
        orderBy: { created_at: 'desc' }
    });
}

export async function updateVerificationAttempts(id: number, attempts: number) {
    return await prisma.emailVerification.update({
        where: { id }, // ← CORRIGIDO: passar o id corretamente
        data: { attempts }
    });
}

export async function markAsVerified(personId: number) {
    await prisma.$transaction([
        prisma.emailVerification.updateMany({
            where: {
                person_id: personId,
                verified_at: null
            },
            data: { verified_at: new Date() }
        }),
        prisma.person.update({
            where: { id: personId },
            data: { verified_email: true }
        })
    ]);
}

export async function invalidateOldVerifications(personId: number) {
    return await prisma.emailVerification.updateMany({
        where: {
            person_id: personId,
            verified_at: null
        },
        data: { expires_at: new Date() }
    });
}
