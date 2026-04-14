import Database from 'better-sqlite3';

const db = new Database('ecommerce.db', {
    timeout: 10000,
});

db.exec(`
    CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        type TEXT CHECK(type IN ('admin', 'customer', 'seller')) DEFAULT 'customer',
        blocked BOOLEAN DEFAULT FALSE,
        verified_email BOOLEAN DEFAULT FALSE,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL UNIQUE,
        hash_password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE RESTRICT
    )
`);
db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(person_id) REFERENCES persons(id)
    )
`);
db.exec(`
    CREATE TABLE IF NOT EXISTS logs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        method TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        action_summary TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

export default db;
