-- CreateTable
CREATE TABLE "Address" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "person_id" INTEGER NOT NULL,
    CONSTRAINT "Address_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
