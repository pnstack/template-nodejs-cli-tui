import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

/**
 * Chat text-input component. Displays a prompt and handles submission.
 */
export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <Box borderStyle="round" borderColor={isLoading ? 'yellow' : 'cyan'} paddingX={1}>
      {isLoading ? (
        <Text color="yellow">⏳ Generating...</Text>
      ) : (
        <>
          <Text color="cyanBright" bold>
            {'❯ '}
          </Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="Type a message..."
          />
        </>
      )}
    </Box>
  );
};
