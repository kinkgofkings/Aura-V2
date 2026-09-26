const fs = require('fs');
const fileWall = 'src/components/recovery/GroupWall.tsx';
let wallContent = fs.readFileSync(fileWall, 'utf8');

const oldHandle = `  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }));
    
    // The group IDs match the ones defined in ChatContext
    const chatGroupId = group.name === 'Walking in Faith' ? 'group_walking_in_faith' : 'group_mens_purity';
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_chat_conversation', { detail: { id: chatGroupId } }));
    }, 50);
  };`;
  
const newHandle = `  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }));
    
    const chatGroupId = group.id.startsWith('g') ? 'group_' + group.id : group.id;
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_chat_conversation', { 
        detail: { 
          id: chatGroupId,
          fallbackGroup: {
            id: chatGroupId,
            isGroup: true,
            name: group.name,
            avatar: group.profileImage,
            participantIds: [],
            participants: [],
            unreadCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        } 
      }));
    }, 50);
  };`;
wallContent = wallContent.replace(oldHandle, newHandle);
fs.writeFileSync(fileWall, wallContent);

const fileChat = 'src/components/chat/ChatView.tsx';
let chatContent = fs.readFileSync(fileChat, 'utf8');

// The event handler in ChatView.tsx
const oldHandler = `    const handleOpenConv = (e: any) => {
      const convId = e.detail?.id;
      if (convId) {
        setActiveConversationId(convId);
        setMobileShowChatRoom(true);
      }
    };`;
    
const newHandler = `    const handleOpenConv = (e: any) => {
      const convId = e.detail?.id;
      const fallbackGroup = e.detail?.fallbackGroup;
      if (convId) {
        if (fallbackGroup) {
          // ensure it exists in conversations
          setConversations(prev => {
            if (!prev.some(c => c.id === convId)) {
              return [fallbackGroup, ...prev];
            }
            return prev;
          });
        }
        setActiveConversationId(convId);
        setMobileShowChatRoom(true);
      }
    };`;
chatContent = chatContent.replace(oldHandler, newHandler);
fs.writeFileSync(fileChat, chatContent);

