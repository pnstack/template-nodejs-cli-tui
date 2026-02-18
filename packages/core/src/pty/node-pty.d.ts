declare module '@lydell/node-pty' {
  export interface IPtyForkOptions {
    name?: string;
    cols?: number;
    rows?: number;
    cwd?: string;
    env?: Record<string, string>;
    encoding?: string | null;
  }

  export interface IEvent<T> {
    (listener: (e: T) => void): { dispose: () => void };
  }

  export interface IPty {
    readonly pid: number;
    readonly cols: number;
    readonly rows: number;
    readonly process: string;
    onData: IEvent<string>;
    onExit: IEvent<{ exitCode: number; signal: number }>;
    write(data: string): void;
    resize(cols: number, rows: number): void;
    kill(signal?: string): void;
    pause(): void;
    resume(): void;
    clear(): void;
  }

  export function spawn(file: string, args: string[] | string, options: IPtyForkOptions): IPty;
}
