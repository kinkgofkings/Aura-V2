const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/<Home feedMode=\{feedMode\} tab=\{tab\} tab=\{tab\}/g, '<Home feedMode={feedMode} tab={tab}');
app = app.replace(/<Bible tab=\{tab\} tab=\{tab\}/g, '<Bible tab={tab}');
app = app.replace(/<Recovery tab=\{tab\} tab=\{tab\}/g, '<Recovery tab={tab}');
fs.writeFileSync('src/App.tsx', app);
