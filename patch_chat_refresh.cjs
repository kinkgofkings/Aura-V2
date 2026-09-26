const fs = require('fs');
const file = 'src/context/ChatContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        const cleanConvs = serverConvs.filter(
          (c) =>
            c &&
            !c.id.startsWith('conv_alex_') &&
            c.id !== 'conv_design_circle' &&
            !c.participantIds?.some((id) => ['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(id))
        );
        setConversations(cleanConvs);
        offlineStorage.save(STORAGE_KEYS.CONVERSATIONS, cleanConvs);`;

const replacement = `        const cleanConvs = serverConvs.filter(
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
          if (!cleanConvs.some(c => c.id === dg.id)) {
            cleanConvs.push(dg as any);
          }
        });

        setConversations(cleanConvs);
        offlineStorage.save(STORAGE_KEYS.CONVERSATIONS, cleanConvs);`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
