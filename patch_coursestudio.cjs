const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace confirm() in handleDeleteCourse
code = code.replace(
  `const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;`,
  `const [confirmDeleteCourse, setConfirmDeleteCourse] = useState<string | null>(null);
  
  const handleDeleteCourse = async (courseId: string) => {`
);

// Replace confirm() and URL in handleDeleteLesson
code = code.replace(
  `const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(\`/api/bible/courses/\${courseId}/lessons/\${lessonId}\`, {`,
  `const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<string | null>(null);

  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    try {
      const res = await fetch(\`/api/bible/lessons/\${lessonId}\`, {`
);

// We need to actually check state. Wait, this simple replace above doesn't add the UI for it.
// I will write a better patch to add the UI for the confirm, or use a custom confirm dialog.

