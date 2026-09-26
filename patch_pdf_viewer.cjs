const fs = require('fs');
let code = fs.readFileSync('src/components/bible/BibleStudy.tsx', 'utf8');

if (!code.includes('ExternalLink')) {
  code = code.replace('FileText,', 'FileText, ExternalLink,');
}

const findPdfRender = `{selectedLessonObj.mediaUrl && selectedLessonObj.mediaType === "pdf" && ( 
                  <div className="mt-3 mb-2 rounded-xl overflow-hidden border border-white/10 shadow-lg h-[600px] bg-white"> 
                    <iframe width="100%" height="100%" src={\`/api/proxy/pdf?url=\${encodeURIComponent(selectedLessonObj.mediaUrl)}\`} title="PDF Document" className="w-full h-full"></iframe> 
                  </div> 
                )}`;

const replacePdfRender = `{selectedLessonObj.mediaUrl && selectedLessonObj.mediaType === "pdf" && ( 
                  <div className="mt-3 mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                    {selectedCourseObj?.coverImage ? (
                      <div className="absolute inset-0">
                        <img src={selectedCourseObj.coverImage} alt="PDF Cover" className="w-full h-full object-cover opacity-30 group-hover:opacity-20 transition-opacity duration-500 blur-sm" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-950"></div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent text-center">
                       <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                         <FileText className="w-10 h-10 text-amber-400" />
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-md">{selectedLessonObj.title}</h3>
                       <p className="text-sm text-slate-300 mb-8 max-w-md">Access the complete interactive PDF study guide for this lesson. Optimized for your device.</p>
                       <a
                         href={\`/api/proxy/pdf?url=\${encodeURIComponent(selectedLessonObj.mediaUrl)}\`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                       >
                         <ExternalLink className="w-5 h-5" />
                         <span>Open PDF Reader</span>
                       </a>
                    </div>
                  </div>
                )}`;

// Handle potential formatting differences in the search string
code = code.replace(findPdfRender, replacePdfRender);

// Alternative replace using regex if strict string match fails due to whitespace
if (!code.includes('ExternalLink className="w-5 h-5"')) {
  // Regex approach
  const regex = /\{selectedLessonObj\.mediaUrl && selectedLessonObj\.mediaType === "pdf" && \(\s*<div className="mt-3 mb-2 rounded-xl overflow-hidden border border-white\/10 shadow-lg h-\[600px\] bg-white">\s*<iframe width="100%" height="100%" src=\{`\/api\/proxy\/pdf\?url=\$\{encodeURIComponent\(selectedLessonObj\.mediaUrl\)\}`\} title="PDF Document" className="w-full h-full"><\/iframe>\s*<\/div>\s*\)\}/;
  code = code.replace(regex, replacePdfRender);
}

fs.writeFileSync('src/components/bible/BibleStudy.tsx', code);
