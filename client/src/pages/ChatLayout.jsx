import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import NewGroupModal from '../components/sidebar/NewGroupModal';
import EmptyChat from '../components/chat/EmptyChat';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';

export default function ChatLayout() {
  const { activeRoom, setActiveRoom } = useChat();
  const [showGroup,   setShowGroup]   = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleRoomSelect = () => {
    setShowSidebar(false); // on mobile, hide sidebar when chat opens
  };

  const handleBack = () => {
    setShowSidebar(true);  // on mobile, go back to sidebar
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* Sidebar — full width on mobile when visible, fixed width on desktop */}
      <div className={`
        ${activeRoom && !showSidebar ? 'hidden' : 'flex'}
        md:flex flex-col
        w-full md:w-72
        shrink-0
      `}>
        <Sidebar
          onNewGroup={() => setShowGroup(true)}
          onRoomSelect={handleRoomSelect}
        />
      </div>

      {/* Chat area — full width on mobile when visible, flex-1 on desktop */}
      <div className={`
        ${!activeRoom || showSidebar ? 'hidden' : 'flex'}
        md:flex flex-col flex-1 min-w-0
      `}>
        {activeRoom
          ? <ChatWindow room={activeRoom} onBack={handleBack} />
          : <EmptyChat />
        }
      </div>

      {/* Desktop only — empty state when no room selected */}
      <div className="hidden md:flex flex-1 min-w-0">
        {!activeRoom && <EmptyChat />}
      </div>

      {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} />}
    </div>
  );
}
