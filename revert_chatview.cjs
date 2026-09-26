const fs = require('fs');
const file = 'src/components/chat/ChatView.tsx';
let content = fs.readFileSync(file, 'utf8');

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

const oldHandler = `    const handleOpenConv = (e: any) => {
      const convId = e.detail?.id;
      if (convId) {
        setActiveConversationId(convId);
        setMobileShowChatRoom(true);
      }
    };`;
content = content.replace(newHandler, oldHandler);
fs.writeFileSync(file, content);
