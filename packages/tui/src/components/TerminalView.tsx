import React from 'react';
import { Box, Text } from 'ink';

interface TerminalViewProps {
  /** Raw terminal output buffer */
  output: string;
  /** Number of visible rows */
  rows: number;
  /** Whether this terminal is the active/focused one */
  isFocused: boolean;
}

/**
 * Renders the terminal output for a single PTY session.
 * Shows the last N lines of output that fit in available rows.
 */
export const TerminalView: React.FC<TerminalViewProps> = ({ output, rows, isFocused }) => {
  // Split output into lines and take the last `rows` lines
  const lines = output.split('\n');
  const visibleLines = lines.slice(-(rows - 2)); // leave room for tab bar + status

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle={isFocused ? 'bold' : 'single'}
      borderColor={isFocused ? 'green' : 'gray'}
    >
      {visibleLines.map((line, i) => (
        <Text key={i} wrap="truncate">
          {line}
        </Text>
      ))}
    </Box>
  );
};
