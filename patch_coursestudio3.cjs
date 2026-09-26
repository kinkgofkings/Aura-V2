const fs = require('fs');
const file = 'src/components/bible/CourseStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add PDF option to the media select
const selectFind = `<option value="upload">Uploaded Audio / Video File</option>
            </select>`;
const selectReplace = `<option value="upload">Uploaded Audio / Video File</option>
              <option value="pdf">External PDF Document</option>
            </select>`;
code = code.replace(selectFind, selectReplace);

// 2. Add input field for PDF URL
const pdfUploadFind = `{mediaType === 'youtube' ? (
                <div className="space-y-3">`;
const pdfUploadReplace = `{mediaType === 'pdf' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Paste link to PDF file..."
                      className="flex-1 px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Provide a direct URL to a PDF file. If it is hosted externally, ensure it allows cross-origin reading or use the proxy.</p>
                </div>
              ) : mediaType === 'youtube' ? (
                <div className="space-y-3">`;
code = code.replace(pdfUploadFind, pdfUploadReplace);

fs.writeFileSync(file, code);
console.log('Successfully patched CourseStudio.tsx for PDF');
