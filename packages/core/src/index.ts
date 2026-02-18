export function greet(name: string): string {
  const trimmed = name?.trim();
  return `Hello, ${trimmed && trimmed.length > 0 ? trimmed : 'World'} 👋`;
}

export { PtyManager } from './pty/index.js';
export type { Session, PtyManagerEvents } from './pty/index.js';

export { ChatClient } from './chat/index.js';
export type { ChatMessage, ChatSession, TokenUsage, ChatClientEvents } from './chat/index.js';
