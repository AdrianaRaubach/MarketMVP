import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';
import { PersonType } from '../src/enums/PersonType';

export async function createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketmvp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'System';

    const existing = await prisma.person.findUnique({
        where: { email: adminEmail }
    });

    if (!existing) {
        const hash_password = await bcrypt.hash(adminPassword, 12);

        await prisma.$transaction(async (tx: any) => {
            const person = await tx.person.create({
                data: {
                    first_name: adminFirstName,
                    last_name: adminLastName,
                    email: adminEmail,
                    type: PersonType.ADMIN.toLowerCase(),
                    verified_email: true
                }
            });

            await tx.user.create({
                data: {
                    person_id: person.id,
                    hash_password: hash_password
                }
            });
        });
    } else {
        console.log('Admin já existe');
    }
}

createDefaultAdmin()
    .catch((e) => {
        console.error('Erro ao criar admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
