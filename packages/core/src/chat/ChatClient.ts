import OpenAI from 'openai';
import { EventEmitter } from 'node:events';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  tokenUsage: TokenUsage;
}

export interface ChatClientEvents {
  /** Fired for every streamed token chunk */
  token: (sessionId: string, token: string) => void;
  /** Fired when the full assistant message is complete */
  'message-complete': (sessionId: string, content: string, usage: TokenUsage) => void;
  /** Fired on error */
  error: (sessionId: string, err: Error) => void;
}

/* ------------------------------------------------------------------ */
/*  ChatClient                                                         */
/* ------------------------------------------------------------------ */

let nextSessionId = 1;

export class ChatClient extends EventEmitter {
  private openai: OpenAI;
  private sessions = new Map<string, ChatSession>();
  private model: string;
  private totalUsage: TokenUsage = { prompt: 0, completion: 0, total: 0 };

  constructor(opts?: { apiKey?: string; baseURL?: string; model?: string }) {
    super();

    const apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    const baseURL = opts?.baseURL ?? process.env.OPENAI_BASE_URL ?? undefined;
    this.model = opts?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY env var or pass apiKey option.',
      );
    }

    console.log(`Using model: ${this.model} `);
    console.log({ apiKey, baseURL });

    this.openai = new OpenAI({ apiKey, baseURL });
  }

  /* ---- Session management ---------------------------------------- */

  createSession(name?: string, systemPrompt?: string): ChatSession {
    const id = `chat-${nextSessionId++}`;
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    const session: ChatSession = {
      id,
      name: name ?? `Chat ${nextSessionId - 1}`,
      messages,
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(id: string): void {
    this.sessions.delete(id);
  }

  get sessionCount(): number {
    return this.sessions.size;
  }

  getTotalUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  /* ---- Chat ------------------------------------------------------ */

  /**
   * Send a user message and stream the assistant response.
   * Emits `token` events for each chunk, then `message-complete` when done.
   */
  async sendMessage(sessionId: string, content: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push({ role: 'user', content });

    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullContent = '';

      for await (const chunk of stream) {
        // Collect usage from the final chunk
        if (chunk.usage) {
          const usage: TokenUsage = {
            prompt: chunk.usage.prompt_tokens ?? 0,
            completion: chunk.usage.completion_tokens ?? 0,
            total: chunk.usage.total_tokens ?? 0,
          };
          session.tokenUsage.prompt += usage.prompt;
          session.tokenUsage.completion += usage.completion;
          session.tokenUsage.total += usage.total;
          this.totalUsage.prompt += usage.prompt;
          this.totalUsage.completion += usage.completion;
          this.totalUsage.total += usage.total;
        }

        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          this.emit('token', sessionId, delta);
        }
      }

      session.messages.push({ role: 'assistant', content: fullContent });
      this.emit('message-complete', sessionId, fullContent, session.tokenUsage);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('error', sessionId, error);
    }
  }
}
