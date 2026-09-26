const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('const url = req.query.url;', 'const url = req.query.url as string;');
fs.writeFileSync(file, code);
console.log('Fixed TS error');
