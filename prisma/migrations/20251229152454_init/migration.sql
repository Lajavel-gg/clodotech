-- CreateTable
CREATE TABLE "Livre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isbn" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "sousTitre" TEXT,
    "auteur" TEXT NOT NULL,
    "dateSortie" TEXT,
    "editeur" TEXT,
    "categorie" TEXT,
    "description" TEXT,
    "image" TEXT,
    "pages" INTEGER,
    "dateAjout" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Livre_isbn_key" ON "Livre"("isbn");
