const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// The issue is Lesson interface in CourseStudio.tsx has its own definition
const findLesson = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  scriptureRef?: string;
  quizJson?: string;
  mediaType?: 'youtube' | 'upload';
  mediaUrl?: string;
  notes?: string;
}`;

const replaceLesson = `interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  scriptureRef?: string;
  quizJson?: string;
  mediaType?: 'youtube' | 'upload' | 'pdf';
  mediaUrl?: string;
  notes?: string;
}`;

code = code.replace(findLesson, replaceLesson);
fs.writeFileSync(file, code);
console.log('Patched local Lesson interface in CourseStudio');
