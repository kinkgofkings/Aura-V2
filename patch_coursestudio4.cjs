const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

const lessonDisplayFind = `{lesson.mediaType === 'youtube' && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                                      <Play className="w-3 h-3 fill-current" /> Video Lesson
                                    </span>
                                  )}`;
                                  
const lessonDisplayReplace = `{lesson.mediaType === 'youtube' && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                                      <Play className="w-3 h-3 fill-current" /> Video Lesson
                                    </span>
                                  )}
                                  {lesson.mediaType === 'pdf' && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-400">
                                      <FileText className="w-3 h-3 fill-current" /> PDF Document
                                    </span>
                                  )}`;

code = code.replace(lessonDisplayFind, lessonDisplayReplace);
fs.writeFileSync(file, code);
