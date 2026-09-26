const fs = require('fs');
const file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const loaded = offlineStorage.load<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    return (loaded || []).filter(
      (c) =>
        c &&
        !c.id.startsWith('conv_alex_') &&
        c.id !== 'conv_design_circle' &&
        !c.participantIds?.some((id) => ['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(id))
    );
  });`;

const replacement = `  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const loaded = offlineStorage.load<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    let filtered = (loaded || []).filter(
      (c) =>
        c &&
        !c.id.startsWith('conv_alex_') &&
        c.id !== 'conv_design_circle' &&
        !c.participantIds?.some((id) => ['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(id))
    );
    
    // Ensure default groups are present
    const defaultGroups = [
      {
        id: 'group_walking_in_faith',
        isGroup: true,
        name: 'Walking in Faith',
        avatar: 'https://images.unsplash.com/photo-1470115636492-6d2b56f91465?w=200&q=80',
        participantIds: [],
        participants: [],
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'group_mens_purity',
        isGroup: true,
        name: "Men's Purity",
        avatar: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&q=80',
        participantIds: [],
        participants: [],
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];
    
    defaultGroups.forEach(dg => {
      if (!filtered.some(c => c.id === dg.id)) {
        filtered.push(dg as any);
      }
    });
    
    return filtered;
  });`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
