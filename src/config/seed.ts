import bcrypt from 'bcryptjs';
import * as PersonModel from '../models/PersonModel';
import { PersonType } from '../enums/PersonType';

export async function createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketmvp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'System';

    const existing = PersonModel.getByEmail(adminEmail);
    if (!existing) {
        const hash_password = await bcrypt.hash(adminPassword, 12);
        PersonModel.create(
            adminFirstName,
            adminLastName,
            adminEmail,
            PersonType.ADMIN,
            hash_password
        );
    }
}
