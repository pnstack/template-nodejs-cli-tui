import 'dotenv/config'; // load .env into process.env (overrides globals)
import { Command } from 'commander';
import { greet } from '@acme/core';

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
  .description('Launch the multi-tab terminal TUI')
  .action(async () => {
    const { runTUI } = await import('@acme/tui');
    await runTUI();
  });

program
  .command('chat')
  .description('Launch the OpenAI chat TUI (requires OPENAI_API_KEY)')
  .action(async () => {
    const { runChatTUI } = await import('@acme/tui');
    await runChatTUI();
  });

program.parseAsync(process.argv);
