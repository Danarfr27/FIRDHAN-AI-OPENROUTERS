import { useEffect, useState } from 'react';
import TopBar from '../sections/TopBar';
import SystemInfo from '../sections/SystemInfo';
import MainConsole from '../sections/MainConsole';
import TokenManagement from '../sections/TokenManagement';
import SystemLogs from '../sections/SystemLogs';

const ACTIVE_SESSION_KEY = 'firdhan_active_chat_session';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [activeSession, setActiveSession] = useState<string>(() => {
    if (typeof window === 'undefined') return '#0427';
    return window.localStorage.getItem(ACTIVE_SESSION_KEY) || '#0427';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncSession = (event?: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string }> | undefined)?.detail;
      const nextSession = detail?.sessionId || window.localStorage.getItem(ACTIVE_SESSION_KEY) || '#0427';
      setActiveSession(nextSession);
    };

    window.addEventListener('storage', syncSession);
    window.addEventListener('firdhan-chat-session-change', syncSession as EventListener);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('firdhan-chat-session-change', syncSession as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, activeSession);
    }
  }, [activeSession]);

  return (
    <div
      className="min-h-screen flex flex-col scanlines relative"
      style={{ background: 'var(--bg-base)' }}
    >
      <TopBar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div
        className="flex-1 flex flex-col lg:flex-row gap-2.5 p-2.5 overflow-hidden relative"
        style={{ minHeight: 0, height: 'calc(100vh - 118px)' }}
      >
        <div className="w-full lg:w-1/2 h-full min-h-0 overflow-hidden order-1 lg:order-2">
          <MainConsole activeSession={activeSession} />
        </div>

        <div className="w-full lg:w-1/4 h-full min-h-0 overflow-hidden order-2 lg:order-1">
          <SystemInfo />
        </div>

        <div className="w-full lg:w-1/4 h-full min-h-0 overflow-hidden order-3 lg:order-3">
          <TokenManagement />
        </div>

      </div>

      <div className="px-2.5 pb-2.5">
        <SystemLogs />
      </div>
    </div>
  );
}
