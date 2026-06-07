import { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import NewGroupModal from '../components/sidebar/NewGroupModal';
import EmptyChat from '../components/chat/EmptyChat';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';

// Check if screen is mobile (< 768px)
const isMobile = () => window.innerWidth < 768;

export default function ChatLayout() {
  const { activeRoom } = useChat();
  const [showGroup,    setShowGroup]   = useState(false);
  const [mobileView,   setMobileView]  = useState('sidebar'); // 'sidebar' | 'chat'
  const [mobile,       setMobile]      = useState(isMobile());

  // Track screen size changes
  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const openChat     = () => { if (mobile) setMobileView('chat'); };
  const openSidebar  = () => setMobileView('sidebar');

  if (!mobile) {
    // ── Desktop layout — plain side by side, no animations ──
    return (
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
        <div style={{ width: '288px', flexShrink: 0, height: '100%', borderRight: '1px solid #f3f4f6' }}>
          <Sidebar onNewGroup={() => setShowGroup(true)} onRoomSelect={() => {}} />
        </div>
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeRoom ? <ChatWindow room={activeRoom} onBack={() => {}} /> : <EmptyChat />}
        </div>
        {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} />}
      </div>
    );
  }

  // ── Mobile layout — slide between sidebar and chat ───────
  return (
    <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>

      {/* Sidebar — slides in/out from left */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        transform: mobileView === 'chat' ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease-in-out',
        willChange: 'transform',
      }}>
        <Sidebar
          onNewGroup={() => setShowGroup(true)}
          onRoomSelect={openChat}
        />
      </div>

      {/* Chat window — always rendered behind, slides in from right */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        transform: mobileView === 'sidebar' ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease-in-out',
        willChange: 'transform',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
      }}>
        {activeRoom
          ? <ChatWindow room={activeRoom} onBack={openSidebar} />
          : <EmptyChat />
        }
      </div>

      {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} />}
    </div>
  );
}
