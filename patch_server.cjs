const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/const imageBytes = response\.generatedImages\[0\]\.image\.imageBytes;/g, 'const imageBytes = response.generatedImages[0].image?.imageBytes;');
fs.writeFileSync('server.ts', server);
