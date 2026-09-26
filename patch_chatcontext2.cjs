const fs = require('fs');
const file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const [activeTypingUsers, setActiveTypingUsers] = useState<string[]>([]);`;
const replacement = `  const [activeTypingUsers, setActiveTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const handleOpenConv = (e: any) => {
      const convId = e.detail?.id;
      const fallbackGroup = e.detail?.fallbackGroup;
      if (convId) {
        if (fallbackGroup) {
          setConversations(prev => {
            if (!prev.some(c => c.id === convId)) {
              const newConvs = [fallbackGroup, ...prev];
              // offlineStorage.save(STORAGE_KEYS.CONVERSATIONS, newConvs); // Can't easily use this if offlineStorage is out of scope here
              return newConvs;
            }
            return prev;
          });
        }
        setActiveConversationId(convId);
      }
    };
    window.addEventListener('open_chat_conversation', handleOpenConv);
    return () => window.removeEventListener('open_chat_conversation', handleOpenConv);
  }, []);`;
content = content.replace(target, replacement);
fs.writeFileSync(file, content);
