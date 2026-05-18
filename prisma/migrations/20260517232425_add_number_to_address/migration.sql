/*
  Warnings:

  - Added the required column `number` to the `address` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_address" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "complement" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "person_id" INTEGER NOT NULL,
    CONSTRAINT "address_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_address" ("city", "complement", "createdAt", "id", "person_id", "state", "street", "updatedAt", "zipCode") SELECT "city", "complement", "createdAt", "id", "person_id", "state", "street", "updatedAt", "zipCode" FROM "address";
DROP TABLE "address";
ALTER TABLE "new_address" RENAME TO "address";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
