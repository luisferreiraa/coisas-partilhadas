-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_username_itemId_key" ON "Favorite"("username", "itemId");
