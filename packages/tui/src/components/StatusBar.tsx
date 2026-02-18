import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  sessionName: string;
  sessionId: string;
  totalSessions: number;
  currentIndex: number;
  cols: number;
  rows: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  sessionName,
  totalSessions,
  currentIndex,
  cols,
  rows,
}) => {
  return (
    <Box flexDirection="row" borderStyle="single" borderTop={false} paddingX={1}>
      <Text color="cyanBright" bold>
        {sessionName}
      </Text>
      <Text dimColor>
        {' '}
        | Session {currentIndex + 1}/{totalSessions} | {cols}×{rows}
      </Text>
      <Box flexGrow={1} />
      <Text dimColor>Type to interact with the terminal</Text>
    </Box>
  );
};
