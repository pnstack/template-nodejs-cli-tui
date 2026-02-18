import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { ChatApp } from './ChatApp.js';

export { PtyManager } from '@acme/core';
export type { Session } from '@acme/core';

export function runTUI() {
  const { waitUntilExit } = render(<App />, {
    exitOnCtrlC: false, // We handle Ctrl+Q ourselves
  });
  return waitUntilExit();
}

export function runChatTUI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('\x1b[31m✖ OPENAI_API_KEY env var is required.\x1b[0m');
    console.error('  Run: export OPENAI_API_KEY="sk-..." then retry.');
    process.exit(1);
  }

  const { waitUntilExit } = render(<ChatApp />, {
    exitOnCtrlC: false,
  });
  return waitUntilExit();
}
