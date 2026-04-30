import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: serial('conversation_id').references(() => conversations.id),
  role: text('role').notNull(), // 'user', 'assistant', 'system', 'tool'
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  toolResult: text('tool_result'),
  createdAt: timestamp('created_at').defaultNow(),
});
