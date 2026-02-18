import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

type Props = { name: string };

export const App: React.FC<Props> = ({ name }) => {
  const { exit } = useApp();

  useEffect(() => {
    const id = setTimeout(() => exit(), 1500);
    return () => clearTimeout(id);
  }, [exit]);

  return (
    <Box flexDirection="column">
      <Text color="greenBright">Welcome to the TUI</Text>
      <Text>👋 Hello, {name || 'World'}!</Text>
      <Text dimColor>(This will auto-exit in ~1.5s)</Text>
    </Box>
  );
};
