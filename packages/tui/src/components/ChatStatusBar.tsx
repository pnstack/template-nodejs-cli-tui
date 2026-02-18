import React from 'react';
import { Box, Text } from 'ink';
import type { TokenUsage } from '@acme/core';

interface ChatStatusBarProps {
  sessionName: string;
  totalSessions: number;
  currentIndex: number;
  sessionUsage: TokenUsage;
  totalUsage: TokenUsage;
  model: string;
}

export const ChatStatusBar: React.FC<ChatStatusBarProps> = ({
  sessionName,
  totalSessions,
  currentIndex,
  sessionUsage,
  totalUsage,
  model,
}) => {
  return (
    <Box flexDirection="row" borderStyle="single" borderTop={false} paddingX={1}>
      <Text color="cyanBright" bold>
        {sessionName}
      </Text>
      <Text dimColor>
        {' '}
        | {currentIndex + 1}/{totalSessions}
      </Text>
      <Text dimColor>{' | '}</Text>
      <Text color="magentaBright">{model}</Text>
      <Text dimColor>{' | '}</Text>
      <Text color="yellowBright">
        ↑{sessionUsage.prompt} ↓{sessionUsage.completion}
      </Text>
      <Text dimColor>{' (session) '}</Text>
      <Text color="green">Σ {totalUsage.total}</Text>
      <Text dimColor>{' tokens'}</Text>
      <Box flexGrow={1} />
      <Text dimColor>^T:new ^W:close ^←/→:switch ^Q:quit</Text>
    </Box>
  );
};
