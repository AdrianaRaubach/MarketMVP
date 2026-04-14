import db from '../config/db';
import { PersonType } from '../enums/PersonType';

export interface Person {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    type: PersonType;
    blocked: boolean;
    verified_email: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

function normalizePerson(dbPerson: any): Person {
    if (!dbPerson) return dbPerson;

    return {
        ...dbPerson,
        blocked: dbPerson.blocked === 1,
        verified_email: dbPerson.verified_email === 1,
    };
}

function normalizePersons(dbPersons: any[]): Person[] {
    if (!dbPersons) return [];
    return dbPersons.map((person) => normalizePerson(person));
}

export function getAll(): Person[] {
    const dados = db.prepare('SELECT * FROM persons ORDER BY id').all();
    return normalizePersons(dados);
}

export function getByName(name: string): Person[] {
    const dados = db.prepare('SELECT * FROM persons WHERE first_name LIKE ? OR last_name LIKE ? ORDER BY id').all(`%${name}%`, `%${name}%`);
    return normalizePersons(dados);
}

export function getByEmail(email: string): Person | undefined {
    const person = db.prepare('SELECT * FROM persons WHERE email = ?').get(email);
    return normalizePerson(person);
}

export function getById(id: number): Person | undefined {
    const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(id);
    return normalizePerson(person);
}

export function create(
    first_name: string,
    last_name: string,
    email: string,
    type: PersonType,
    hash_password: string
): number {
    const transaction = db.transaction(() => {
        const stmt = db.prepare(`
            INSERT INTO persons (first_name, last_name, email, type)
            VALUES (@first_name, @last_name, @email, @type)
        `);

        const result = stmt.run({
            first_name,
            last_name,
            email,
            type,
        });

        const personId = result.lastInsertRowid as number;

        const userStmt = db.prepare(`
            INSERT INTO users (person_id, hash_password)
            VALUES (@person_id, @hash_password)
        `);

        userStmt.run({
            person_id: personId,
            hash_password,
        });

        return personId;
    });

    return transaction();
}

export function updateLastLogin(personId: number): void {
    const stmt = db.prepare(`
        UPDATE persons
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    stmt.run(personId);
}

export function updateBlocked(personId: number, blocked: boolean): void {
    const stmt = db.prepare(
        'UPDATE persons SET blocked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(blocked ? 1 : 0, personId);
}

export function updateVerifiedEmail(personId: number, verified: boolean): void {
    const stmt = db.prepare(`
        UPDATE persons
        SET verified_email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    stmt.run(verified ? 1 : 0, personId);
}

export function getPersonForSession(id: number) {
    const person = getById(id);
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
