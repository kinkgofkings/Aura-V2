const fs = require('fs');

// 1. routes/auth.ts
let auth = fs.readFileSync('routes/auth.ts', 'utf8');
auth = auth.replace(/user: user \?\? undefined/g, 'user: user || undefined');
fs.writeFileSync('routes/auth.ts', auth);

// 2. server.ts
let server = fs.readFileSync('server.ts', 'utf8');
// For line 64: mimeType
server = server.replace(/const mimeType = mimeTypes\[ext as keyof typeof mimeTypes\]/g, 'const mimeType = (mimeTypes as any)[ext]');
// For line 915: Object is possibly undefined. This is likely req.user
server = server.replace(/res\.json\(\{ user: req\.user \|\| null \}\)/g, 'res.json({ user: req.user || null })'); // wait, let's see what is on 915
fs.writeFileSync('server.ts', server);

// 3. src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/tab=\{tab\} tab=\{tab\}/g, 'tab={tab}');
fs.writeFileSync('src/App.tsx', app);

// 4. src/components/recovery/RecoveryDashboard.tsx
let dash = fs.readFileSync('src/components/recovery/RecoveryDashboard.tsx', 'utf8');
dash = dash.replace(/setDailyLogs\(\(prev\) =>/g, 'setDailyLogs((prev: any) =>');
fs.writeFileSync('src/components/recovery/RecoveryDashboard.tsx', dash);

// 5. services/youtubeFeedService.ts
let yt = fs.readFileSync('services/youtubeFeedService.ts', 'utf8');
yt = yt.replace(/filter\(\(sub\) =>/g, 'filter((sub: any) =>');
fs.writeFileSync('services/youtubeFeedService.ts', yt);
