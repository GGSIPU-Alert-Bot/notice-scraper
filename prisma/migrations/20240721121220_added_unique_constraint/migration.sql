/*
  Warnings:

  - A unique constraint covering the columns `[title,url]` on the table `Notice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Notice_title_url_key" ON "Notice"("title", "url");
