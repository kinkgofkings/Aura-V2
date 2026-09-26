const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state variables for confirmation
code = code.replace(
  `const [editingCourse, setEditingCourse] = useState<Course | null>(null);`,
  `const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<string | null>(null);
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);`
);

// 2. Remove window.confirm and fix lesson URL
code = code.replace(
  `  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {`,
  `  const handleDeleteCourse = async (courseId: string) => {
    try {`
);

code = code.replace(
  `  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(\`/api/bible/courses/\${courseId}/lessons/\${lessonId}\`, {`,
  `  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    try {
      const res = await fetch(\`/api/bible/lessons/\${lessonId}\`, {`
);

// 3. Update Course delete button UI
const courseBtnFind = `<button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>`;
const courseBtnReplace = `{confirmDeleteCourseId === course.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCourseId(null)}
                              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteCourse(course.id);
                                setConfirmDeleteCourseId(null);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCourseId(course.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}`;
code = code.replace(courseBtnFind, courseBtnReplace);

// 4. Update Lesson delete button UI
const lessonBtnFind = `<button
                                  type="button"
                                  onClick={() => handleDeleteLesson(lesson.id, course.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>`;
const lessonBtnReplace = `{confirmDeleteLessonId === lesson.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteLessonId(null)}
                                      className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[9px]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteLesson(lesson.id, course.id);
                                        setConfirmDeleteLessonId(null);
                                      }}
                                      className="px-1.5 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white text-[9px]"
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteLessonId(lesson.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}`;
code = code.replace(lessonBtnFind, lessonBtnReplace);

fs.writeFileSync(file, code);
console.log('Successfully patched CourseStudio.tsx');
