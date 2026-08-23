
const fs = require("fs");

let content = fs.readFileSync("src/app/results/page.tsx", "utf-8");

// 1. Remove html2canvas import
content = content.replace(`import html2canvas from "html2canvas";\n`, "");

// 2. Update state variables and remove posterRef
const oldState = `  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [activePosterData, setActivePosterData] = useState<any | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);`;

const newState = `  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [generatedPosterMap, setGeneratedPosterMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "competition" && selectedCompetition && compResults.length > 0) {
      if (!generatedPosterMap[selectedCompetition]) {
        generateCanvasPoster(selectedCompetition, compResults);
      }
    }
  }, [selectedCompetition, compResults, activeTab]);`;

content = content.replace(oldState, newState);

// 3. Replace old generatePoster with new generateCanvasPoster
const oldGeneratePosterStart = `const generatePoster = async (result: any, compName: string, studentData: any) => {`;
const oldGeneratePosterEnd = `}, 500);\n  };`;

const idxStart = content.indexOf(oldGeneratePosterStart);
const idxEnd = content.indexOf(oldGeneratePosterEnd) + oldGeneratePosterEnd.length;

if (idxStart !== -1 && idxEnd !== -1) {
  const newGeneratePoster = `const generateCanvasPoster = async (compId: string, specificResults: any[] = []) => {
    const resToUse = specificResults.length > 0 ? specificResults : results.filter(r => r.event_id === compId).map(r => ({
      ...r,
      student: students.find(s => s.id === r.student_id)
    })).sort((a, b) => a.position - b.position);

    if (resToUse.length === 0) return null;

    setGeneratingPoster(compId);
    try {
      const comp = competitions.find(c => c.id === compId);
      if (!comp) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const img = new Image();
      img.src = "/poster-1.jpg";
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load poster-1.jpg template. Make sure it exists in the public directory."));
      });

      canvas.width = 1023;
      canvas.height = 1280;

      ctx.drawImage(img, 0, 0, 1023, 1280);
      ctx.textBaseline = "top";

      ctx.fillStyle = "#FFD700"; 
      ctx.font = \`600 28px Montserrat, sans-serif\`;
      ctx.fillText(comp.name.toUpperCase(), 279, 430);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = \`18px Montserrat, sans-serif\`;
      ctx.fillText((comp.category || "GENERAL ZONE").toUpperCase(), 279, 470);

      let winnerIndex = 0;
      
      [1, 2, 3].forEach(pos => {
        const winners = resToUse.filter(r => r.position === pos);
        if (winners.length === 0) return;
        const placePrefix = pos + ".";
        
        winners.forEach(w => {
          const studentName = (w.student?.name || "Unknown").toUpperCase();
          const teamName = (w.student?.team || "Unknown").toUpperCase();

          const Y = 590 + (winnerIndex * 65);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = \`600 24px Montserrat, sans-serif\`;
          ctx.fillText(placePrefix, 280, Y);

          ctx.font = \`20px Montserrat, sans-serif\`;
          ctx.fillText(studentName, 330, Y);

          ctx.font = \`20px Montserrat, sans-serif\`;
          const teamX = 330 + ctx.measureText(studentName).width + 12;
          ctx.fillText(\`( \${teamName} )\`, teamX, Y);

          winnerIndex++;
        });
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setGeneratedPosterMap(prev => ({ ...prev, [compId]: dataUrl }));
      return dataUrl;
    } catch (err: any) {
      console.error("Poster generation failed", err);
    } finally {
      setGeneratingPoster(null);
    }
    return null;
  };`;

  content = content.substring(0, idxStart) + newGeneratePoster + content.substring(idxEnd);
}

// 4. Modify Competition Tab Grid & add Visual Poster Display
// Replace everything between {compResults.length > 0 ? ( and ) : (
const compGridStart = `{compResults.length > 0 ? (`;
const compGridEnd = `) : (
                    <div className="text-center py-12 bg-white/50 rounded-3xl border border-slate-100">`;

const idxGridStart = content.indexOf(compGridStart);
const idxGridEnd = content.indexOf(compGridEnd);

if (idxGridStart !== -1 && idxGridEnd !== -1) {
  const oldGridBlock = content.substring(idxGridStart, idxGridEnd);
  
  const newGridBlock = `{compResults.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                          {compResults.map(res => (
                            <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                              <div className={cn(
                                "absolute top-0 left-0 w-full h-1", 
                                res.position === 1 ? "bg-amber-400" : res.position === 2 ? "bg-slate-300" : "bg-amber-700"
                              )} />
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-2">
                                  <Medal className={cn("w-6 h-6", res.position === 1 ? "text-amber-400" : res.position === 2 ? "text-slate-400" : "text-amber-700")} />
                                  <span className="font-black text-slate-900 text-sm">{getPositionText(res.position)}</span>
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{res.points} PTS</span>
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-1">{res.student?.name}</h3>
                              <p className="text-sm font-medium text-slate-500">Class {res.student?.class} \u2022 {res.student?.team}</p>
                            </div>
                          ))}
                        </div>

                        {/* Visual Poster Display */}
                        {generatedPosterMap[selectedCompetition] && (
                          <div className="flex flex-col items-center bg-white/50 p-8 rounded-3xl border border-slate-100 shadow-sm mt-8">
                            <h3 className="text-xl font-black text-slate-800 mb-6">Official Result Poster</h3>
                            <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-sm w-full">
                              <img 
                                src={generatedPosterMap[selectedCompetition]} 
                                alt="Result Poster" 
                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = generatedPosterMap[selectedCompetition];
                                link.download = \`\${competitions.find(c => c.id === selectedCompetition)?.name}_Result.jpg\`;
                                link.click();
                              }}
                              className="mt-8 flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl text-lg w-full max-w-xs"
                            >
                              <Download className="w-6 h-6 mr-3" /> Download Poster
                            </button>
                          </div>
                        )}
                      </div>
                    `;
  content = content.replace(oldGridBlock, newGridBlock);
}

// 5. Modify Student Tab Generate Button
const studentBtnPattern = `<button 
                                onClick={() => generatePoster(res, res.competition?.name, studentData)}
                                disabled={generatingPoster === studentData.id + res.competition?.name}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Poster"
                              >
                                {generatingPoster === studentData.id + res.competition?.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>`;

const newStudentBtn = `<button 
                                onClick={async () => {
                                  let dataUrl = generatedPosterMap[res.event_id];
                                  if (!dataUrl) {
                                    dataUrl = await generateCanvasPoster(res.event_id) || "";
                                  }
                                  if (dataUrl) {
                                    const link = document.createElement("a");
                                    link.href = dataUrl;
                                    link.download = \`\${res.competition?.name}_Result.jpg\`;
                                    link.click();
                                  }
                                }}
                                disabled={generatingPoster === res.event_id}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Competition Poster"
                              >
                                {generatingPoster === res.event_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>`;
content = content.replace(studentBtnPattern, newStudentBtn);

// 6. Remove the huge hidden poster template at the end
const startHidden = `      {/* Hidden Poster Template */}`;
const hiddenIdx = content.indexOf(startHidden);
if (hiddenIdx !== -1) {
  content = content.substring(0, hiddenIdx) + `    </div>\n  );\n}\n`;
}

fs.writeFileSync("src/app/results/page.tsx", content, "utf-8");
console.log("Patched successfully.");

