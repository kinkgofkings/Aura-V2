const fs = require('fs');
const file = 'src/components/chat/ChatView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  // Immediate instant scroll to bottom on mount`;

const replacement = `  useEffect(() => {
    const handleOpenConv = (e: any) => {
      if (e.detail?.id) {
        setActiveConversationId(e.detail.id);
        if (window.innerWidth < 768) {
          setMobileShowChatRoom(true);
        }
      }
    };
    window.addEventListener('open_chat_conversation', handleOpenConv);
    return () => window.removeEventListener('open_chat_conversation', handleOpenConv);
  }, [setActiveConversationId]);

  // Immediate instant scroll to bottom on mount`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
