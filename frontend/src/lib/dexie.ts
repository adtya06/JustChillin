import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id?: number;
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export class ChatDatabase extends Dexie {
  messages!: Table<LocalMessage, number>;

  constructor() {
    super('JustChillinDB');
    this.version(1).stores({
      messages: '++id, messageId, conversationId, senderId, createdAt'
    });
  }
}

export const db = new ChatDatabase();
