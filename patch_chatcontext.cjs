const fs = require('fs');
const file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject the event listener directly inside ChatProvider
const target = `  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (user && db) {`;

const replacement = `  useEffect(() => {
    const handleOpenConv = (e: any) => {
      const convId = e.detail?.id;
      const fallbackGroup = e.detail?.fallbackGroup;
      if (convId && fallbackGroup) {
        setConversations(prev => {
          if (!prev.some(c => c.id === convId)) {
            const newConvs = [fallbackGroup, ...prev];
            offlineStorage.save(STORAGE_KEYS.CONVERSATIONS, newConvs);
            return newConvs;
          }
          return prev;
        });
      }
    };
    window.addEventListener('open_chat_conversation', handleOpenConv);
    return () => window.removeEventListener('open_chat_conversation', handleOpenConv);
  }, []);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (user && db) {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
