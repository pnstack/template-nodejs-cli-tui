import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, useApp, useInput, useStdout } from 'ink';
import { TabBar, type Tab } from './components/TabBar.js';
import { TerminalView } from './components/TerminalView.js';
import { StatusBar } from './components/StatusBar.js';
import { PtyManager, type Session } from '@acme/core';

export const App: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

  // Persistent pty manager
  const ptyManager = useMemo(() => new PtyManager(), []);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [outputs, setOutputs] = useState<Record<string, string>>({});

  // Create a new tab
  const createTab = useCallback(
    (name?: string) => {
      const session = ptyManager.createSession(name, cols, rows - 4);
      setSessions(ptyManager.getAllSessions());
      setActiveTabId(session.id);
      setOutputs((prev) => ({ ...prev, [session.id]: '' }));
      return session;
    },
    [ptyManager, cols, rows],
  );

  // Close a tab
  const closeTab = useCallback(
    (id: string) => {
      ptyManager.killSession(id);
      const remaining = ptyManager.getAllSessions();
      setSessions(remaining);
      setOutputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      if (remaining.length === 0) {
        ptyManager.killAll();
        exit();
        return;
      }
      if (activeTabId === id) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
    },
    [ptyManager, activeTabId, exit],
  );

  // Switch tabs
  const switchTab = useCallback(
    (direction: 'next' | 'prev') => {
      const all = ptyManager.getAllSessions();
      if (all.length <= 1) return;
      const idx = all.findIndex((s) => s.id === activeTabId);
      if (direction === 'next') {
        setActiveTabId(all[(idx + 1) % all.length].id);
      } else {
        setActiveTabId(all[(idx - 1 + all.length) % all.length].id);
      }
    },
    [ptyManager, activeTabId],
  );

  // Listen to PTY data
  useEffect(() => {
    const onData = (sessionId: string, data: string) => {
      setOutputs((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] ?? '') + data,
      }));
    };

    const onExit = (sessionId: string, _exitCode: number) => {
      setOutputs((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] ?? '') + `\r\n[Process exited with code ${_exitCode}]`,
      }));
    };

    ptyManager.on('data', onData);
    ptyManager.on('exit', onExit);

    return () => {
      ptyManager.off('data', onData);
      ptyManager.off('exit', onExit);
    };
  }, [ptyManager]);

  // Create first tab on mount
  useEffect(() => {
    if (ptyManager.sessionCount === 0) {
      createTab('Shell 1');
    }
  }, [createTab, ptyManager]);

  // Resize active PTY when terminal dimensions change
  useEffect(() => {
    if (activeTabId) {
      ptyManager.resize(activeTabId, cols, rows - 4);
    }
  }, [cols, rows, activeTabId, ptyManager]);

  // Handle keyboard input
  useInput(
    (input, key) => {
      // Ctrl+Q → quit
      if (input === 'q' && key.ctrl) {
        ptyManager.killAll();
        exit();
        return;
      }

      // Ctrl+T → new tab
      if (input === 't' && key.ctrl) {
        const count = ptyManager.sessionCount + 1;
        createTab(`Shell ${count}`);
        return;
      }

      // Ctrl+W → close current tab
      if (input === 'w' && key.ctrl) {
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Ctrl+Right → next tab
      if (key.rightArrow && key.ctrl) {
        switchTab('next');
        return;
      }

      // Ctrl+Left → prev tab
      if (key.leftArrow && key.ctrl) {
        switchTab('prev');
        return;
      }

      // Forward all other input to the active PTY
      if (activeTabId) {
        if (key.return) {
          ptyManager.write(activeTabId, '\r');
        } else if (key.backspace || key.delete) {
          ptyManager.write(activeTabId, '\x7f');
        } else if (key.escape) {
          ptyManager.write(activeTabId, '\x1b');
        } else if (key.upArrow) {
          ptyManager.write(activeTabId, '\x1b[A');
        } else if (key.downArrow) {
          ptyManager.write(activeTabId, '\x1b[B');
        } else if (key.rightArrow && !key.ctrl) {
          ptyManager.write(activeTabId, '\x1b[C');
        } else if (key.leftArrow && !key.ctrl) {
          ptyManager.write(activeTabId, '\x1b[D');
        } else if (input && key.ctrl) {
          const code = input.charCodeAt(0) - 96;
          if (code > 0 && code < 27) {
            ptyManager.write(activeTabId, String.fromCharCode(code));
          }
        } else if (input) {
          ptyManager.write(activeTabId, input);
        }
      }
    },
    { isActive: true },
  );

  // Build tab list for TabBar
  const tabs: Tab[] = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    active: s.id === activeTabId,
  }));

  const activeIndex = sessions.findIndex((s) => s.id === activeTabId);
  const activeSession = sessions.find((s) => s.id === activeTabId);

  return (
    <Box flexDirection="column" height={rows}>
      <TabBar tabs={tabs} activeTabId={activeTabId} />
      <TerminalView output={outputs[activeTabId] ?? ''} rows={rows - 4} isFocused={true} />
      {activeSession && (
        <StatusBar
          sessionName={activeSession.name}
          sessionId={activeSession.id}
          totalSessions={sessions.length}
          currentIndex={activeIndex}
          cols={cols}
          rows={rows}
        />
      )}
    </Box>
  );
};
