import fs from 'fs';
const file = 'src/components/recovery/RecoveryMeetingRoom.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { createPortal }")) {
  code = code.replace("import React, {", "import { createPortal } from 'react-dom';\nimport React, {");
}

code = code.replace(
  "  return (\n    <div className=\"fixed inset-0 z-50",
  "  return createPortal(\n    <div className=\"fixed inset-0 z-[100] bg-[#030612]"
);

code = code.replace(
  "      {/* Host Controls Panel */}\n      {isHostPanelOpen && isHost && (\n        <div className=\"fixed inset-0 z-50",
  "      {/* Host Controls Panel */}\n      {isHostPanelOpen && isHost && (\n        <div className=\"fixed inset-0 z-[110]"
);

code = code.replace(
  "      {/* Guidelines Modal */}\n      {isGuidelinesOpen && (\n        <div className=\"fixed inset-0 z-50",
  "      {/* Guidelines Modal */}\n      {isGuidelinesOpen && (\n        <div className=\"fixed inset-0 z-[110]"
);

// We need to make sure we close the createPortal call at the very end of the component!
// The component ends with:
//     </div>
//   );
// };
// Let's replace the last </div>\n  ); with </div>\n  ), document.body);

let lines = code.split('\n');
let modified = false;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i] === '  );' && lines[i-1] === '    </div>') {
    lines[i] = '  ), document.body);';
    modified = true;
    break;
  }
}

if (modified) {
  fs.writeFileSync(file, lines.join('\n'));
  console.log("Successfully patched RecoveryMeetingRoom.tsx");
} else {
  console.log("Failed to find the end of the component return statement");
}
