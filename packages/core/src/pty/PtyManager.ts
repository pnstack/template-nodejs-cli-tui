import { spawn, type IPty } from '@lydell/node-pty';
import os from 'node:os';
import { EventEmitter } from 'node:events';

export interface Session {
  id: string;
  name: string;
  pty: IPty;
  scrollback: string[];
  /** Visible buffer: last `rows` lines of output */
  buffer: string;
}

export interface PtyManagerEvents {
  data: (sessionId: string, data: string) => void;
  exit: (sessionId: string, exitCode: number, signal: number) => void;
}

let nextId = 1;

export class PtyManager extends EventEmitter {
  private sessions = new Map<string, Session>();

  getDefaultShell(): string {
    if (process.env.SHELL) return process.env.SHELL;
    return os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';
  }

  createSession(name?: string, cols = 80, rows = 24, shell?: string, cwd?: string): Session {
    const id = `tab-${nextId++}`;
    const shellPath = shell ?? this.getDefaultShell();

    const pty = spawn(shellPath, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: cwd ?? process.cwd(),
      env: process.env as Record<string, string>,
    });

    const session: Session = {
      id,
      name: name ?? `Tab ${nextId - 1}`,
      pty,
      scrollback: [],
      buffer: '',
    };

    pty.onData((data: string) => {
      session.buffer += data;
      // Keep buffer at a reasonable size (last ~50KB)
      if (session.buffer.length > 50_000) {
        session.buffer = session.buffer.slice(-40_000);
      }
      this.emit('data', id, data);
    });

    pty.onExit(({ exitCode, signal }) => {
      this.emit('exit', id, exitCode, signal);
    });

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      this.sessions.delete(sessionId);
    }
  }

  killAll(): void {
    for (const session of this.sessions.values()) {
      session.pty.kill();
    }
    this.sessions.clear();
  }

  get sessionCount(): number {
    return this.sessions.size;
  }
}
