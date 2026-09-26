const fs = require('fs');
const file = 'server/bible/models.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `mediaType?: "youtube" | "upload";`,
  `mediaType?: "youtube" | "upload" | "pdf";`
);

// If it's single quotes
code = code.replace(
  `mediaType?: 'youtube' | 'upload';`,
  `mediaType?: 'youtube' | 'upload' | 'pdf';`
);

fs.writeFileSync(file, code);
