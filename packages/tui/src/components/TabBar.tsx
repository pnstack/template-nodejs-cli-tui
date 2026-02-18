import React from 'react';
import { Box, Text } from 'ink';

export interface Tab {
  id: string;
  name: string;
  active: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId }) => {
  return (
    <Box flexDirection="row" borderStyle="single" borderBottom={false} paddingX={1}>
      <Text dimColor>Tabs: </Text>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        return (
          <Box key={tab.id} marginRight={1}>
            <Text bold={isActive} color={isActive ? 'greenBright' : 'gray'} inverse={isActive}>
              {' '}
              {index + 1}:{tab.name}{' '}
            </Text>
          </Box>
        );
      })}
      <Box flexGrow={1} />
      <Text dimColor>Ctrl+T:new | Ctrl+W:close | Ctrl+←/→:switch | Ctrl+Q:quit</Text>
    </Box>
  );
};
