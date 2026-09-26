const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

const findLesson = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  mediaType?: 'youtube' | 'upload';
  mediaUrl?: string;
}`;

const replaceLesson = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  mediaType?: 'youtube' | 'upload' | 'pdf';
  mediaUrl?: string;
}`;

code = code.replace(findLesson, replaceLesson);

// fallback for double quotes
const findLesson2 = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  mediaType?: "youtube" | "upload";
  mediaUrl?: string;
}`;

const replaceLesson2 = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  mediaType?: "youtube" | "upload" | "pdf";
  mediaUrl?: string;
}`;

code = code.replace(findLesson2, replaceLesson2);

// Another fallback if it's slightly different:
code = code.replace(/mediaType\?\: 'youtube' \| 'upload';/g, "mediaType?: 'youtube' | 'upload' | 'pdf';");
code = code.replace(/mediaType\?\: "youtube" \| "upload";/g, 'mediaType?: "youtube" | "upload" | "pdf";');


fs.writeFileSync(file, code);
