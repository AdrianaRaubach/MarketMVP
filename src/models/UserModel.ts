import db from '../config/db';

export interface User {
    id: number;
    person_id: number;
    hash_password: string;
}

export function getAll(): User[] {
    const dados = db.prepare('SELECT * FROM users').all() as User[];
    return dados;
}

export function getByPersonId(person_id: number): User | undefined {
    const dado = db.prepare('SELECT * FROM users WHERE person_id = ?').get(person_id) as
        | User
        | undefined;
    return dado;
}

export function create(person_id: number, hash_password: string): void {
    const user = {
        person_id,
        hash_password,
    };

    const stmt = db.prepare(
        'INSERT INTO users (person_id, hash_password) VALUES (@person_id, @hash_password)'
    );
    stmt.run(user);
}
