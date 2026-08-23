
const fs = require("fs");

let content = fs.readFileSync("src/app/results/page.tsx", "utf-8");

// 1. Add templates array and selectedTemplate state
const stateOld = `  const [selectedStudent, setSelectedStudent] = useState("");

  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [generatedPosterMap, setGeneratedPosterMap] = useState<Record<string, string>>({});`;

const stateNew = `  const [selectedStudent, setSelectedStudent] = useState("");

  const templates = ["/poster-1.jpg", "/poster-2.jpg"];
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [generatedPosterMap, setGeneratedPosterMap] = useState<Record<string, string>>({});`;

content = content.replace(stateOld, stateNew);

// 2. Update generateCanvasPoster
const oldGenStart = `  const generateCanvasPoster = async (compId: string, specificResults: any[] = []) => {`;
const oldGenEnd = `    return null;
  };`;

const idxGenStart = content.indexOf(oldGenStart);
const idxGenEnd = content.indexOf(oldGenEnd) + oldGenEnd.length;

if (idxGenStart !== -1 && idxGenEnd !== -1) {
  const newGen = `  const generateCanvasPoster = async (compId: string, specificResults: any[] = [], template: string = selectedTemplate) => {
    const resToUse = specificResults.length > 0 ? specificResults : results.filter(r => r.event_id === compId).map(r => ({
      ...r,
      student: students.find(s => s.id === r.student_id)
    })).sort((a, b) => a.position - b.position);

    if (resToUse.length === 0) return null;

    const key = \`\${compId}-\${template}\`;
    setGeneratingPoster(key);
    try {
      const comp = competitions.find(c => c.id === compId);
      if (!comp) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const img = new Image();
      img.src = template;
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load " + template));
      });

      canvas.width = 1023;
      canvas.height = 1280;

      ctx.drawImage(img, 0, 0, 1023, 1280);
      ctx.textBaseline = "top";

      if (template.includes("poster-1")) {
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
      } else if (template.includes("poster-2")) {
        ctx.fillStyle = "#C8102E";
        ctx.font = \`600 22px Montserrat, sans-serif\`;
        ctx.fillText((comp.category || "GENERAL ZONE").toUpperCase(), 490, 460);

        ctx.fillStyle = "#332211";
        ctx.font = \`bold 34px Montserrat, sans-serif\`;
        ctx.fillText(comp.name.toUpperCase(), 490, 505);

        let winnerIndex = 0;
        
        [1, 2, 3].forEach(pos => {
          const winners = resToUse.filter(r => r.position === pos);
          if (winners.length === 0) return;
          const placePrefix = pos + ". ";
          
          winners.forEach(w => {
            const studentName = (w.student?.name || "Unknown").toUpperCase();
            const teamName = (w.student?.team || "Unknown").toUpperCase();

            const Y = 640 + (winnerIndex * 115);

            ctx.fillStyle = "#332211";
            ctx.font = \`bold 30px Montserrat, sans-serif\`;
            ctx.fillText(\`\${placePrefix}\${studentName}\`, 490, Y);

            ctx.fillStyle = "#C8102E";
            ctx.font = \`600 22px Montserrat, sans-serif\`;
            ctx.fillText(teamName, 540, Y + 35);

            winnerIndex++;
          });
        });
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setGeneratedPosterMap(prev => ({ ...prev, [key]: dataUrl }));
      return dataUrl;
    } catch (err: any) {
      console.error("Poster generation failed", err);
    } finally {
      setGeneratingPoster(null);
    }
    return null;
  };`;
  content = content.substring(0, idxGenStart) + newGen + content.substring(idxGenEnd);
}

// 3. Update useEffect for auto generation
const oldUseEffect = `  useEffect(() => {
    if (activeTab === "competition" && selectedCompetition && compResults.length > 0) {
      if (!generatedPosterMap[selectedCompetition]) {
        generateCanvasPoster(selectedCompetition, compResults);
      }
    }
  }, [selectedCompetition, compResults, activeTab]);`;

const newUseEffect = `  useEffect(() => {
    if (activeTab === "competition" && selectedCompetition && compResults.length > 0) {
      const key = \`\${selectedCompetition}-\${selectedTemplate}\`;
      if (!generatedPosterMap[key]) {
        generateCanvasPoster(selectedCompetition, compResults, selectedTemplate);
      }
    }
  }, [selectedCompetition, compResults, activeTab, selectedTemplate]);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Update the Competition Tab display logic
const compDisplayOld = `{/* Visual Poster Display */}
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
                      )}`;

const compDisplayNew = `{/* Visual Poster Display */}
                      {generatedPosterMap[\`\${selectedCompetition}-\${selectedTemplate}\`] && (
                        <div className="flex flex-col items-center bg-white/50 p-8 rounded-3xl border border-slate-100 shadow-sm mt-8">
                          <h3 className="text-xl font-black text-slate-800 mb-6">Official Result Poster</h3>

                          {/* Template Gallery */}
                          <div className="flex gap-4 mb-8">
                            {templates.map(tpl => (
                               <div 
                                 key={tpl} 
                                 onClick={() => setSelectedTemplate(tpl)}
                                 className={cn(
                                   "w-20 h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105",
                                   selectedTemplate === tpl ? "border-blue-600 shadow-md ring-2 ring-blue-300" : "border-transparent opacity-70"
                                 )}
                               >
                                 <img src={tpl} alt="Template" className="w-full h-full object-cover" />
                               </div>
                            ))}
                          </div>

                          <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-sm w-full">
                            <img 
                              src={generatedPosterMap[\`\${selectedCompetition}-\${selectedTemplate}\`]} 
                              alt="Result Poster" 
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = generatedPosterMap[\`\${selectedCompetition}-\${selectedTemplate}\`];
                              link.download = \`\${competitions.find(c => c.id === selectedCompetition)?.name}_Result.jpg\`;
                              link.click();
                            }}
                            className="mt-8 flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl text-lg w-full max-w-xs"
                          >
                            <Download className="w-6 h-6 mr-3" /> Download Poster
                          </button>
                        </div>
                      )}`;

content = content.replace(compDisplayOld, compDisplayNew);

// 5. Update Student tab download button
const studentBtnOld = `                              <button 
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

const studentBtnNew = `                              <button 
                                onClick={async () => {
                                  const key = \`\${res.event_id}-\${selectedTemplate}\`;
                                  let dataUrl = generatedPosterMap[key];
                                  if (!dataUrl) {
                                    dataUrl = await generateCanvasPoster(res.event_id, [], selectedTemplate) || "";
                                  }
                                  if (dataUrl) {
                                    const link = document.createElement("a");
                                    link.href = dataUrl;
                                    link.download = \`\${res.competition?.name}_Result.jpg\`;
                                    link.click();
                                  }
                                }}
                                disabled={generatingPoster === \`\${res.event_id}-\${selectedTemplate}\`}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Competition Poster"
                              >
                                {generatingPoster === \`\${res.event_id}-\${selectedTemplate}\` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>`;

content = content.replace(studentBtnOld, studentBtnNew);
content = content.replace(studentBtnOld, studentBtnNew); // just in case it appears multiple times, though there is only one map

fs.writeFileSync("src/app/results/page.tsx", content, "utf-8");
console.log("Success");

