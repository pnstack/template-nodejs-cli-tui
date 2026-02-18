import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { TabBar, type Tab } from './components/TabBar.js';
import { ChatView } from './components/ChatView.js';
import { ChatInput } from './components/ChatInput.js';
import { ChatStatusBar } from './components/ChatStatusBar.js';
import { ChatClient, type ChatSession, type TokenUsage, type ChatMessage } from '@acme/core';

interface SessionState {
  session: ChatSession;
  messages: ChatMessage[];
  streamingContent: string;
  isLoading: boolean;
}

export const ChatApp: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

  // ChatClient instance
  const chatClient = useMemo(() => {
    try {
      return new ChatClient();
    } catch (err) {
      return null;
    }
  }, []);

  const [initError, setInitError] = useState<string | null>(null);
  const [sessionStates, setSessionStates] = useState<Map<string, SessionState>>(new Map());
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [totalUsage, setTotalUsage] = useState<TokenUsage>({ prompt: 0, completion: 0, total: 0 });

  // Track if exit has already been requested
  const exitingRef = useRef(false);

  // Check for init error
  useEffect(() => {
    if (!chatClient) {
      setInitError('OPENAI_API_KEY env var is required. Set it and restart.');
    }
  }, [chatClient]);

  // Create a new chat session
  const createSession = useCallback(
    (name?: string) => {
      if (!chatClient) return;
      const session = chatClient.createSession(name, 'You are a helpful assistant. Be concise.');
      setSessionStates((prev) => {
        const next = new Map(prev);
        next.set(session.id, {
          session,
          messages: [...session.messages],
          streamingContent: '',
          isLoading: false,
        });
        return next;
      });
      setActiveTabId(session.id);
    },
    [chatClient],
  );

  // Close a chat session
  const closeSession = useCallback(
    (id: string) => {
      if (!chatClient) return;
      chatClient.deleteSession(id);
      setSessionStates((prev) => {
        const next = new Map(prev);
        next.delete(id);
        if (next.size === 0 && !exitingRef.current) {
          exitingRef.current = true;
          exit();
          return next;
        }
        if (activeTabId === id) {
          const remaining = Array.from(next.keys());
          setActiveTabId(remaining[remaining.length - 1] ?? '');
        }
        return next;
      });
    },
    [chatClient, activeTabId, exit],
  );

  // Switch tabs
  const switchTab = useCallback(
    (direction: 'next' | 'prev') => {
      if (!chatClient) return;
      const all = chatClient.getAllSessions();
      if (all.length <= 1) return;
      const idx = all.findIndex((s) => s.id === activeTabId);
      if (direction === 'next') {
        setActiveTabId(all[(idx + 1) % all.length].id);
      } else {
        setActiveTabId(all[(idx - 1 + all.length) % all.length].id);
      }
    },
    [chatClient, activeTabId],
  );

  // Listen to ChatClient events
  useEffect(() => {
    if (!chatClient) return;

    const onToken = (sessionId: string, token: string) => {
      setSessionStates((prev) => {
        const state = prev.get(sessionId);
        if (!state) return prev;
        const next = new Map(prev);
        next.set(sessionId, {
          ...state,
          streamingContent: state.streamingContent + token,
        });
        return next;
      });
    };

    const onComplete = (sessionId: string, _content: string, usage: TokenUsage) => {
      setSessionStates((prev) => {
        const state = prev.get(sessionId);
        if (!state) return prev;
        const session = chatClient.getSession(sessionId);
        if (!session) return prev;
        const next = new Map(prev);
        next.set(sessionId, {
          ...state,
          session: { ...session },
          messages: [...session.messages],
          streamingContent: '',
          isLoading: false,
        });
        return next;
      });
      setTotalUsage(chatClient.getTotalUsage());
    };

    const onError = (sessionId: string, err: Error) => {
      setSessionStates((prev) => {
        const state = prev.get(sessionId);
        if (!state) return prev;
        const next = new Map(prev);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠ Error: ${err.message}`,
        };
        next.set(sessionId, {
          ...state,
          messages: [...state.messages, errorMsg],
          streamingContent: '',
          isLoading: false,
        });
        return next;
      });
    };

    chatClient.on('token', onToken);
    chatClient.on('message-complete', onComplete);
    chatClient.on('error', onError);

    return () => {
      chatClient.off('token', onToken);
      chatClient.off('message-complete', onComplete);
      chatClient.off('error', onError);
    };
  }, [chatClient]);

  // Create first session on mount
  useEffect(() => {
    if (chatClient && chatClient.sessionCount === 0) {
      createSession('Chat 1');
    }
  }, [chatClient, createSession]);

  // Handle sending a message
  const handleSend = useCallback(
    async (text: string) => {
      if (!chatClient || !activeTabId) return;

      // Mark loading and add user message immediately
      setSessionStates((prev) => {
        const state = prev.get(activeTabId);
        if (!state) return prev;
        const next = new Map(prev);
        next.set(activeTabId, {
          ...state,
          messages: [...state.messages, { role: 'user', content: text }],
          streamingContent: '',
          isLoading: true,
        });
        return next;
      });

      // Fire off the streaming request (events will update state)
      await chatClient.sendMessage(activeTabId, text);
    },
    [chatClient, activeTabId],
  );

  // Keyboard shortcuts (for tab management only — text input is handled by ChatInput)
  useInput(
    (input, key) => {
      // Ctrl+Q or Ctrl+C → quit
      if ((input === 'q' || input === 'c') && key.ctrl) {
        if (!exitingRef.current) {
          exitingRef.current = true;
          exit();
        }
        return;
      }
      if (input === 't' && key.ctrl) {
        const count = (chatClient?.sessionCount ?? 0) + 1;
        createSession(`Chat ${count}`);
        return;
      }
      if (input === 'w' && key.ctrl) {
        if (activeTabId) closeSession(activeTabId);
        return;
      }
      if (key.rightArrow && key.ctrl) {
        switchTab('next');
        return;
      }
      if (key.leftArrow && key.ctrl) {
        switchTab('prev');
        return;
      }
    },
    { isActive: true },
  );

  // Error state
  if (initError) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
          <Text color="redBright" bold>
            ✖ {initError}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Run: export OPENAI_API_KEY="sk-..." then retry.</Text>
        </Box>
      </Box>
    );
  }

  // Build tabs
  const allSessions = chatClient?.getAllSessions() ?? [];
  const tabs: Tab[] = allSessions.map((s) => ({
    id: s.id,
    name: s.name,
    active: s.id === activeTabId,
  }));

  const activeState = sessionStates.get(activeTabId);
  const activeIndex = allSessions.findIndex((s) => s.id === activeTabId);
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return (
    <Box flexDirection="column" height={rows}>
      <TabBar tabs={tabs} activeTabId={activeTabId} />

      <ChatView
        messages={activeState?.messages.filter((m) => m.role !== 'system') ?? []}
        streamingContent={activeState?.streamingContent ?? ''}
        rows={rows - 5}
      />

      <ChatInput onSubmit={handleSend} isLoading={activeState?.isLoading ?? false} />

      {activeState && (
        <ChatStatusBar
          sessionName={activeState.session.name}
          totalSessions={allSessions.length}
          currentIndex={activeIndex}
          sessionUsage={activeState.session.tokenUsage}
          totalUsage={totalUsage}
          model={model}
        />
      )}
    </Box>
  );
};
