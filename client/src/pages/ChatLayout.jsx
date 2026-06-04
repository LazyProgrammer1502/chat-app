import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import NewGroupModal from '../components/sidebar/NewGroupModal';
import EmptyChat from '../components/chat/EmptyChat';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';

export default function ChatLayout() {
  const { activeRoom } = useChat();
  const [showGroup, setShowGroup] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar onNewGroup={() => setShowGroup(true)} />

      {activeRoom ? <ChatWindow room={activeRoom} /> : <EmptyChat />}

      {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} />}
    </div>
  );
}
