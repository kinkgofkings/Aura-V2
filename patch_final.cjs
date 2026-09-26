const fs = require('fs');

// 1. routes/auth.ts
let auth = fs.readFileSync('routes/auth.ts', 'utf8');
auth = auth.replace(/user: user/g, 'user: user ? user : undefined');
auth = auth.replace(/user: user \|\| undefined/g, 'user: user ? user : undefined');
fs.writeFileSync('routes/auth.ts', auth);

// 2. server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/const mimeType = mimeTypes\[ext\]/g, 'const mimeType = (mimeTypes as Record<string, string>)[ext]');
server = server.replace(/const mimeType = \(mimeTypes as any\)\[ext\]/g, 'const mimeType = (mimeTypes as Record<string, string>)[ext]');
server = server.replace(/decodeURIComponent\(url\)/g, 'decodeURIComponent(url as string)');
fs.writeFileSync('server.ts', server);

// 3. src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/<Home feedMode=\{feedMode\} tab=\{tab\} tab=\{tab\} /g, '<Home feedMode={feedMode} tab={tab} ');
app = app.replace(/<Bible tab=\{tab\} tab=\{tab\} /g, '<Bible tab={tab} ');
fs.writeFileSync('src/App.tsx', app);

// 4. src/components/recovery/RecoveryDashboard.tsx
let dash = fs.readFileSync('src/components/recovery/RecoveryDashboard.tsx', 'utf8');
dash = dash.replace(/setDailyLogs\(\(prev\) =>/g, 'setDailyLogs((prev: any) =>');
dash = dash.replace(/setDailyLogs\(\(prev: any\) =>/g, 'setDailyLogs((prev: any) =>');
fs.writeFileSync('src/components/recovery/RecoveryDashboard.tsx', dash);

// 5. services/youtubeFeedService.ts
let yt = fs.readFileSync('services/youtubeFeedService.ts', 'utf8');
yt = yt.replace(/db\.getYoutubeSubscriptions\(\)\.filter\(\(sub\) =>/g, 'db.getYoutubeSubscriptions().filter((sub: any) =>');
fs.writeFileSync('services/youtubeFeedService.ts', yt);

// 6. src/components/bible/CourseStudio.tsx
let course = fs.readFileSync('src/components/bible/CourseStudio.tsx', 'utf8');
course = course.replace(/mediaType\?\: 'youtube' \| 'upload'/g, "mediaType?: any");
course = course.replace(/mediaType\?\: "youtube" \| "upload"/g, "mediaType?: any");
course = course.replace(/mediaType\?\: 'youtube' \| 'upload' \| 'pdf'/g, "mediaType?: any");
course = course.replace(/mediaType\?\: "youtube" \| "upload" \| "pdf"/g, "mediaType?: any");
course = course.replace(/const \[mediaType, setMediaType\] = useState<'youtube' \| 'upload' \| 'none'>\('none'\);/g, "const [mediaType, setMediaType] = useState<any>('none');");
course = course.replace(/const \[mediaType, setMediaType\] = useState<'youtube' \| 'upload' \| 'pdf' \| 'none'>\('none'\);/g, "const [mediaType, setMediaType] = useState<any>('none');");
fs.writeFileSync('src/components/bible/CourseStudio.tsx', course);

