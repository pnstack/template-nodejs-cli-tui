import { Command } from 'commander';
import { greet } from '@acme/core';
import { runTUI } from '@acme/tui';

const VERSION = '0.1.0';

const program = new Command();

program.name('acme').description('CLI for demoing core utilities and a TUI').version(VERSION);

program
  .command('hello')
  .argument('[name]', 'Your name', 'World')
  .description('Print a greeting from @acme/core')
  .action((name: string) => {
    console.log(greet(name));
  });

program
  .command('ui')
  .argument('[name]', 'Your name', 'World')
  .description('Launch the Ink TUI')
  .action(async (name: string) => {
    await runTUI(name);
  });

program.parseAsync(process.argv);
