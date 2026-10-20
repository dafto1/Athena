CREATE TABLE "NemoConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "NemoConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NemoMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    CONSTRAINT "NemoMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NemoConversation_userId_updatedAt_idx" ON "NemoConversation"("userId", "updatedAt");
CREATE INDEX "NemoMessage_conversationId_createdAt_idx" ON "NemoMessage"("conversationId", "createdAt");

ALTER TABLE "NemoConversation" ADD CONSTRAINT "NemoConversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NemoMessage" ADD CONSTRAINT "NemoMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "NemoConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
