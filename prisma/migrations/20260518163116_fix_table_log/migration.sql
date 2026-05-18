-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_logs" ("action_summary", "created_at", "endpoint", "id", "method", "user_id") SELECT "action_summary", "created_at", "endpoint", "id", "method", "user_id" FROM "logs";
DROP TABLE "logs";
ALTER TABLE "new_logs" RENAME TO "logs";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
