const fs = require('fs');

// 1. routes/auth.ts
let auth = fs.readFileSync('routes/auth.ts', 'utf8');
auth = auth.replace(/user: user \? user : undefined/g, 'user: user ?? undefined');
auth = auth.replace(/user: user/g, 'user: user ?? undefined');
auth = auth.replace(/user: user \?\? undefined \?\? undefined/g, 'user: user ?? undefined');
fs.writeFileSync('routes/auth.ts', auth);

// 2. server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/const mimeType = \(mimeTypes as Record<string, string>\)\[ext\]/g, 'const mimeType = mimeTypes[ext as keyof typeof mimeTypes]');
server = server.replace(/const mimeType = mimeTypes\[ext\]/g, 'const mimeType = mimeTypes[ext as keyof typeof mimeTypes]');
server = server.replace(/const url = req\.query\.url as string;/g, 'const url = (req.query.url as string) || "";');
fs.writeFileSync('server.ts', server);

// 3. src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/tab=\{tab\} tab=\{tab\}/g, 'tab={tab}');
fs.writeFileSync('src/App.tsx', app);

// 4. src/components/recovery/RecoveryDashboard.tsx
let dash = fs.readFileSync('src/components/recovery/RecoveryDashboard.tsx', 'utf8');
dash = dash.replace(/setDailyLogs\(\(prev\) =>/g, 'setDailyLogs((prev: any) =>');
dash = dash.replace(/setDailyLogs\(\(prev: any\) =>/g, 'setDailyLogs((prev: any) =>');
fs.writeFileSync('src/components/recovery/RecoveryDashboard.tsx', dash);

// 5. services/youtubeFeedService.ts
let yt = fs.readFileSync('services/youtubeFeedService.ts', 'utf8');
yt = yt.replace(/db\.getYoutubeSubscriptions\(\)\.filter\(\(sub\) =>/g, 'db.getYoutubeSubscriptions().filter((sub: any) =>');
yt = yt.replace(/filter\(\(sub\) =>/g, 'filter((sub: any) =>');
fs.writeFileSync('services/youtubeFeedService.ts', yt);

