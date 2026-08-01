import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ShieldCheck, Globe, MoonStar, QrCode, ShoppingBag, KeyRound, LogOut, Trash2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TopBar from '../sections/TopBar';
import SystemInfo from '../sections/SystemInfo';
import MainConsole from '../sections/MainConsole';
import TokenManagement from '../sections/TokenManagement';
import SystemLogs from '../sections/SystemLogs';

const ACTIVE_SESSION_KEY = 'firdhan_active_chat_session';

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
    { label: 'Logout', icon: LogOut, action: () => { logout(); navigate('/login', { replace: true }); } },
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

        <div className="hidden lg:block absolute right-2.5 top-2.5 z-20">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="mb-2 ml-auto flex items-center gap-2 rounded-md border border-[#ff7a18]/20 bg-[#120d0d]/90 px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#f5d9c7] shadow-[0_0_20px_rgba(255,122,24,0.12)] transition hover:text-white"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            {menuOpen ? 'Hide' : 'Menu'}
          </button>

          <div
            className={`flex flex-col gap-2 rounded-md border border-[#ff7a18]/15 bg-[#120d0d]/95 p-3 shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 ${menuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[115%] opacity-0 pointer-events-none'}`}
            style={{ width: 210, height: 'fit-content' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ff7a18]/15">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#f5d9c7]">MENU</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="text-[#f5d9c7]/60 hover:text-white text-xs">×</button>
            </div>

            <div className="flex flex-col gap-1">
              {menuItems.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-mono transition-all duration-150 hover:bg-[#ff7a18]/10 hover:border hover:border-[#ff7a18]/20"
                  style={{ color: 'var(--text-primary)', border: '1px solid transparent' }}
                >
                  <Icon size={14} style={{ color: '#ffb07c' }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2.5">
        <SystemLogs />
      </div>
    </div>
  );
}
