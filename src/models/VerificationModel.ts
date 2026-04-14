import db from '../config/db';

export interface EmailVerification {
    id: number;
    person_id: number;
    code: string;
    expires_at: Date;
    attempts: number;
    verified_at: Date | null;
    created_at: Date;
}

export const createVerification = (
    personId: number,
    code: string,
    expiresInMinutes: number = 15
) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const stmt = db.prepare(`
    INSERT INTO email_verifications (person_id, code, expires_at)
    VALUES (?, ?, ?)
  `);

    return stmt.run(personId, code, expiresAt.toISOString());
};

export const getValidVerification = (personId: number, code: string) => {
    const stmt = db.prepare(`
    SELECT * FROM email_verifications 
    WHERE person_id = ? 
    AND code = ? 
    AND verified_at IS NULL 
    AND expires_at > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `);

    return stmt.get(personId, code) as EmailVerification | undefined;
};

export const updateVerificationAttempts = (id: number, attempts: number) => {
    const stmt = db.prepare(`
    UPDATE email_verifications 
    SET attempts = ? 
    WHERE id = ?
  `);

    return stmt.run(attempts, id);
};

export const markAsVerified = (personId: number) => {
    const stmt = db.prepare(`
    UPDATE email_verifications 
    SET verified_at = datetime('now') 
    WHERE person_id = ? AND verified_at IS NULL
  `);

    const updatePerson = db.prepare(`
    UPDATE persons 
    SET verified_email = 1 
    WHERE id = ?
  `);

    stmt.run(personId);
    updatePerson.run(personId);
};

export const invalidateOldVerifications = (personId: number) => {
    const stmt = db.prepare(`
    UPDATE email_verifications 
    SET expires_at = datetime('now') 
    WHERE person_id = ? AND verified_at IS NULL
  `);

    return stmt.run(personId);
};
