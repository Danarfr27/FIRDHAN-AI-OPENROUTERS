import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, Globe, MoonStar, QrCode, ShoppingBag, KeyRound, LogOut, Trash2 } from 'lucide-react';
import TopBar from '../sections/TopBar';
import SystemInfo from '../sections/SystemInfo';
import MainConsole from '../sections/MainConsole';
import TokenManagement from '../sections/TokenManagement';
import SystemLogs from '../sections/SystemLogs';

const ACTIVE_SESSION_KEY = 'firdhan_active_chat_session';

export default function Home() {
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

  const createNewChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firdhan-new-chat-request'));
    }
  };

  const clearHistory = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('firdhan_chat_history_v1');
    window.dispatchEvent(new CustomEvent('firdhan-chat-history-updated'));
  };

  const hackerThemeLoginAlert = () => {
    if (typeof window === 'undefined') return;
    window.alert('Theme locked: hacker mode active. Please log in to continue.');
  };

  const openExternal = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const menuItems = [
    { label: 'New Chat', icon: Plus, action: createNewChat },
    { label: 'AI Check', icon: ShieldCheck, action: () => openExternal('https://apicheck-liart.vercel.app/') },
    { label: 'World Monitor', icon: Globe, action: () => openExternal('https://cacingbesaralaska.vercel.app/') },
    { label: 'Toggle Theme', icon: MoonStar, action: hackerThemeLoginAlert },
    { label: 'QR', icon: QrCode, action: () => openExternal('https://qr-firdhan.vercel.app/') },
    { label: 'Shop', icon: ShoppingBag, action: () => openExternal('https://fearhackshop.vercel.app') },
    { label: 'Temp.OTP', icon: KeyRound, action: () => openExternal('https://tempmail-orpin.vercel.app/login.html') },
    { label: 'Logout', icon: LogOut, action: () => {} },
    { label: 'Clear history', icon: Trash2, action: clearHistory },
  ];

  return (
    <div
      className="min-h-screen flex flex-col scanlines relative"
      style={{ background: 'var(--bg-base)' }}
    >
      <TopBar />

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

        <div
          className="hidden lg:flex absolute right-2.5 top-2.5 z-20 flex-col gap-2 rounded-md border border-white/10 bg-[#120d0d]/90 p-3 shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
          style={{ width: 210, height: 'fit-content' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-white/80">MENU</span>
            <button type="button" className="text-white/50 hover:text-white text-xs">×</button>
          </div>

          <div className="flex flex-col gap-1">
            {menuItems.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-mono transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-primary)' }}
              >
                <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2.5">
        <SystemLogs />
      </div>
    </div>
  );
}
