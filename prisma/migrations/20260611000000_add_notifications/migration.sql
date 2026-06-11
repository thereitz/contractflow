CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "link" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Notification_userId_idx" ON "Notification" ("userId");
CREATE INDEX "Notification_read_idx" ON "Notification" ("read");
