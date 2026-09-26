const fs = require('fs');
let code = fs.readFileSync('src/components/bible/BibleStudy.tsx', 'utf8');

if (!code.includes('ChevronRight')) {
  code = code.replace('ChevronDown,', 'ChevronDown, ChevronRight,');
}

// 1. Update states
code = code.replace(
  'const [courseViewSubTab, setCourseViewSubTab] = useState<"courses" | "lessons">("courses");',
  'const [courseViewLevel, setCourseViewLevel] = useState<"catalog" | "course" | "lesson">("catalog");\n  const [selectedCourseObj, setSelectedCourseObj] = useState<Course | null>(null);\n  const [selectedLessonObj, setSelectedLessonObj] = useState<Lesson | null>(null);'
);

// 2. Replace TAB 4 block
const tab4Start = '{/* TAB 4: COURSES & LESSONS */}';
const tab5Start = '{/* TAB 5: PRAYER WALL */}';

const startIndex = code.indexOf(tab4Start);
const endIndex = code.indexOf(tab5Start);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      {/* TAB 4: COURSES & LESSONS */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
            {/* BREADCRUMBS */}
            <div className="flex items-center gap-2 text-sm font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => { setCourseViewLevel("catalog"); setSelectedCourseObj(null); setSelectedLessonObj(null); }}
                className={\`flex items-center gap-1.5 transition-colors \${courseViewLevel === 'catalog' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}\`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Courses</span>
              </button>
              
              {selectedCourseObj && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <button
                    onClick={() => { setCourseViewLevel("course"); setSelectedLessonObj(null); }}
                    className={\`flex items-center gap-1.5 transition-colors \${courseViewLevel === 'course' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}\`}
                  >
                    <span>{selectedCourseObj.title}</span>
                  </button>
                </>
              )}
              
              {selectedLessonObj && courseViewLevel === 'lesson' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-amber-400">{selectedLessonObj.title}</span>
                </>
              )}
            </div>
            
            {courseViewLevel === 'catalog' && (
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setCourseDisplayMode("grid")}
                  className={"p-2 rounded-lg transition-all " + (courseDisplayMode === "grid" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCourseDisplayMode("list")}
                  className={"p-2 rounded-lg transition-all " + (courseDisplayMode === "list" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : courseViewLevel === "catalog" ? (
            <div className={courseDisplayMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
              {courses.map(course => (
                <div key={course.id} className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer group" onClick={() => { setSelectedCourseObj(course); setCourseViewLevel("course"); fetchLessons(course.id); }}>
                  {course.coverImage && (
                    <div className="relative w-full h-44 bg-slate-950 overflow-hidden">
                      <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base truncate group-hover:text-amber-400 transition-colors">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{course.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : courseViewLevel === "course" && selectedCourseObj ? (
            <div className="space-y-6">
              {/* Course Hero */}
              {selectedCourseObj.coverImage && (
                <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={selectedCourseObj.coverImage} alt={selectedCourseObj.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-end p-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{selectedCourseObj.title}</h2>
                    <p className="text-sm text-slate-300 mt-2 max-w-2xl">{selectedCourseObj.description}</p>
                  </div>
                </div>
              )}
              
              {/* Lessons List */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white mb-2">Lessons</h3>
                {(courseLessons[selectedCourseObj.id] || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No lessons available for this course.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courseLessons[selectedCourseObj.id].map(lesson => (
                      <button 
                        key={lesson.id} 
                        onClick={() => { setSelectedLessonObj(lesson); setCourseViewLevel("lesson"); }}
                        className="flex flex-col text-left bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all group"
                      >
                        <div className="relative w-full h-32 bg-slate-950 overflow-hidden border-b border-white/5">
                          {selectedCourseObj.coverImage ? (
                            <img src={selectedCourseObj.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500 group-hover:opacity-70" />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center backdrop-blur-md border border-amber-500/30">
                              {lesson.mediaType === 'youtube' ? <Play className="w-4 h-4 fill-current" /> : lesson.mediaType === 'pdf' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                              {lesson.mediaType === 'youtube' ? 'Video' : lesson.mediaType === 'pdf' ? 'PDF Study' : 'Lesson'}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 flex-1">
                          <p className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-2">{lesson.title}</p>
                          {lesson.scriptureRef && <p className="text-xs text-slate-400 mt-1">{lesson.scriptureRef}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : courseViewLevel === "lesson" && selectedLessonObj ? (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedLessonObj.title}</h2>
                  {selectedLessonObj.scriptureRef && <p className="text-sm text-amber-400 mt-1">{selectedLessonObj.scriptureRef}</p>}
                </div>
                
                {selectedLessonObj.mediaUrl && selectedLessonObj.mediaType === "youtube" && ( 
                  <div className="mt-3 mb-2 rounded-xl overflow-hidden aspect-video border border-white/10 shadow-lg bg-black"> 
                    <iframe width="100%" height="100%" src={selectedLessonObj.mediaUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")} title="Lesson Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe> 
                  </div> 
                )}
                {selectedLessonObj.mediaUrl && selectedLessonObj.mediaType === "pdf" && ( 
                  <div className="mt-3 mb-2 rounded-xl overflow-hidden border border-white/10 shadow-lg h-[600px] bg-white"> 
                    <iframe width="100%" height="100%" src={\`/api/proxy/pdf?url=\${encodeURIComponent(selectedLessonObj.mediaUrl)}\`} title="PDF Document" className="w-full h-full"></iframe> 
                  </div> 
                )} 
                
                {selectedLessonObj.notes && (
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
                    <ScriptureLinker text={selectedLessonObj.notes} onOpenStudy={(ref) => {
                      const spaceIdx = ref.lastIndexOf(" ");
                      if (spaceIdx !== -1) {
                        const b = ref.slice(0, spaceIdx);
                        const [c, v] = ref.slice(spaceIdx + 1).split(":");
                        fetchStudyBreakdown(b, c, v);
                        setActiveTab("study");
                      }
                    }} />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      `;
      
  code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
  fs.writeFileSync('src/components/bible/BibleStudy.tsx', code);
} else {
  console.log("Could not find start or end index");
}
