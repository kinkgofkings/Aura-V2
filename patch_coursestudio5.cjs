const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update mediaType state type
code = code.replace(
  `const [mediaType, setMediaType] = useState<'youtube' | 'upload' | 'none'>('none');`,
  `const [mediaType, setMediaType] = useState<'youtube' | 'upload' | 'pdf' | 'none'>('none');`
);

// 2. Update Lesson interface if it exists in the file (or check if it's imported)
code = code.replace(
  `mediaType?: 'youtube' | 'upload';`,
  `mediaType?: 'youtube' | 'upload' | 'pdf';`
);
code = code.replace(
  `mediaType?: "youtube" | "upload";`,
  `mediaType?: "youtube" | "upload" | "pdf";`
);

fs.writeFileSync(file, code);
console.log('Successfully patched CourseStudio.tsx for TS error');
