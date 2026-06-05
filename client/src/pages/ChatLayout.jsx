import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import NewGroupModal from '../components/sidebar/NewGroupModal';
import EmptyChat from '../components/chat/EmptyChat';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';

export default function ChatLayout() {
  const { activeRoom } = useChat();
  const [showGroup,   setShowGroup]   = useState(false);
  const [mobileView,  setMobileView]  = useState('sidebar'); // 'sidebar' | 'chat'

  const openChat = () => setMobileView('chat');
  const openSidebar = () => setMobileView('sidebar');

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>

      {/* ── Sidebar ─────────────────────────────────────────
          Mobile: full screen, hidden when mobileView === 'chat'
          Desktop: fixed 288px wide, always visible               */}
      <div style={{
        width: '100%',
        maxWidth: '288px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        zIndex: 10,
        transform: mobileView === 'chat' ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
      }}
      className="md:static md:transform-none md:translate-x-0 md:z-auto"
      >
        <Sidebar
          onNewGroup={() => setShowGroup(true)}
          onRoomSelect={openChat}
        />
      </div>

      {/* ── Chat area ────────────────────────────────────────
          Mobile: full screen, shown when mobileView === 'chat'
          Desktop: fills remaining space                         */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        marginLeft: 0,
        overflow: 'hidden',
      }}
      className="md:ml-72"
      >
        {activeRoom
          ? <ChatWindow room={activeRoom} onBack={openSidebar} />
          : <EmptyChat />
        }
      </div>

      {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} />}
    </div>
  );
}
