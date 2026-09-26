const fs = require('fs');
const file = 'src/components/recovery/GroupWall.tsx';
let content = fs.readFileSync(file, 'utf8');

const badPart = `        )}
      </div>
    </div>
      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};`;

const goodPart = `        )}
      </div>
      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};`;

content = content.replace(badPart, goodPart);
fs.writeFileSync(file, content);
