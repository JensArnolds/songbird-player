CREATE UNIQUE INDEX "unique_first_admin"
  ON "hexmusic-stream_user" ("firstAdmin")
  WHERE "firstAdmin" = true;
