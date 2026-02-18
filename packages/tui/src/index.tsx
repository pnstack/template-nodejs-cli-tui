import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export function runTUI(name: string) {
  const { waitUntilExit } = render(<App name={name} />);
  return waitUntilExit();
}
