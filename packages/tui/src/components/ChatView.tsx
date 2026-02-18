import React from 'react';
import { Box, Text } from 'ink';
import type { ChatMessage } from '@acme/core';

interface ChatViewProps {
  messages: ChatMessage[];
  /** Partial streaming content for the current assistant turn */
  streamingContent: string;
  rows: number;
}

/**
 * Renders a scrollable chat message list.
 * Shows the last messages that fit within `rows`.
 */
export const ChatView: React.FC<ChatViewProps> = ({ messages, streamingContent, rows }) => {
  // Build display lines from messages
  const displayLines: { role: string; text: string }[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    const prefix = msg.role === 'user' ? '❯ You' : '⦿ AI';
    const color = msg.role === 'user' ? 'cyanBright' : 'greenBright';

    displayLines.push({ role: color, text: '' });
    displayLines.push({ role: color, text: `${prefix}:` });

    const contentLines = msg.content.split('\n');
    for (const line of contentLines) {
      displayLines.push({ role: msg.role === 'user' ? 'white' : 'white', text: `  ${line}` });
    }
  }

  // Append streaming content if present
  if (streamingContent) {
    displayLines.push({ role: 'greenBright', text: '' });
    displayLines.push({ role: 'greenBright', text: '⦿ AI:' });
    const streamLines = streamingContent.split('\n');
    for (const line of streamLines) {
      displayLines.push({ role: 'white', text: `  ${line}` });
    }
    displayLines.push({ role: 'yellow', text: '  ▍' });
  }

  // Take only lines that fit
  const maxLines = rows - 2;
  const visibleLines = displayLines.slice(-maxLines);

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="gray" paddingX={1}>
      {visibleLines.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text dimColor>Start a conversation — type a message below</Text>
        </Box>
      ) : (
        visibleLines.map((line, i) => (
          <Text key={i} color={line.role as any} wrap="truncate">
            {line.text}
          </Text>
        ))
      )}
    </Box>
  );
};
