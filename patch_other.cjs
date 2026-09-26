const fs = require('fs');

// 1. routes/auth.ts
let auth = fs.readFileSync('routes/auth.ts', 'utf8');
auth = auth.replace(/user: user/g, 'user: user || undefined');
fs.writeFileSync('routes/auth.ts', auth);

// 2. server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/mimeType = mimeTypes\[ext\]/g, 'mimeType = (mimeTypes as any)[ext]');
server = server.replace(/res\.json\(\{ user: req\.user \}\)/g, 'res.json({ user: req.user || null })');
fs.writeFileSync('server.ts', server);

// 3. services/youtubeFeedService.ts
let yt = fs.readFileSync('services/youtubeFeedService.ts', 'utf8');
yt = yt.replace(/const subscriptions = db.getYoutubeSubscriptions\(\).filter\(\(sub\) =>/g, 'const subscriptions = db.getYoutubeSubscriptions().filter((sub: any) =>');
fs.writeFileSync('services/youtubeFeedService.ts', yt);

// 4. src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/tab=\{tab\} tab=\{tab\}/g, 'tab={tab}');
fs.writeFileSync('src/App.tsx', app);

// 5. src/components/recovery/RecoveryDashboard.tsx
let dash = fs.readFileSync('src/components/recovery/RecoveryDashboard.tsx', 'utf8');
dash = dash.replace(/setDailyLogs\(\(prev\) =>/g, 'setDailyLogs((prev: any) =>');
fs.writeFileSync('src/components/recovery/RecoveryDashboard.tsx', dash);
