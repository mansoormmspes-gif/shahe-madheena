import re

with open("src/app/results/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove html2canvas import
content = content.replace('import html2canvas from "html2canvas";\n', "")

# 2. Update state variables and remove posterRef
old_state = """  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [activePosterData, setActivePosterData] = useState<any | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);"""

new_state = """  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
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
  }, [selectedCompetition, compResults, activeTab]);"""
content = content.replace(old_state, new_state)

# 3. Replace old generatePoster with new generateCanvasPoster
old_generate_poster_start = 'const generatePoster = async (result: any, compName: string, studentData: any) => {'
old_generate_poster_end = '}, 500);\n  };'

idx_start = content.find(old_generate_poster_start)
idx_end = content.find(old_generate_poster_end) + len(old_generate_poster_end)

new_generate_poster = """const generateCanvasPoster = async (compId: string, specificResults: any[] = []) => {
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

      // 2. Competition Name
      ctx.fillStyle = "#FFD700"; 
      ctx.font = `600 28px Montserrat, sans-serif`;
      ctx.fillText(comp.name.toUpperCase(), 279, 430);

      // 3. Zone Name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `18px Montserrat, sans-serif`;
      ctx.fillText((comp.category || "GENERAL ZONE").toUpperCase(), 279, 470);

      // 4. Winners Loop
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
          ctx.font = `600 24px Montserrat, sans-serif`;
          ctx.fillText(placePrefix, 280, Y);

          ctx.font = `20px Montserrat, sans-serif`;
          ctx.fillText(studentName, 330, Y);

          ctx.font = `20px Montserrat, sans-serif`;
          const teamX = 330 + ctx.measureText(studentName).width + 12;
          ctx.fillText(`( ${teamName} )`, teamX, Y);

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
  };"""

content = content[:idx_start] + new_generate_poster + content[idx_end:]

# 4. Modify Competition Tab Grid & add Visual Poster Display
old_comp_grid = """{compResults.map(res => (
                        <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className={cn(
                            "absolute top-0 left-0 w-full h-1", 
                            res.position === 1 ? "bg-amber-400" : res.position === 2 ? "bg-slate-300" : "bg-amber-700"
                          )} />
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-2">
                              <Medal className={cn("w-6 h-6", res.position === 1 ? 'text-amber-400' : res.position === 2 ? 'text-slate-400' : 'text-amber-700')} />
                              <span className="font-black text-slate-900 text-sm">{getPositionText(res.position)}</span>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{res.points} PTS</span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{res.student?.name}</h3>
                          <p className="text-sm font-medium text-slate-500">Class {res.student?.class} • {res.student?.team}</p>
                          
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => generatePoster(res, competitions.find(c => c.id === selectedCompetition)?.name || "", res.student)}
                            disabled={generatingPoster === res.student?.id + selectedCompetition}
                            className="mt-6 w-full flex items-center justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                          >
                            {generatingPoster === res.student?.id + selectedCompetition ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                              <><Download className="w-4 h-4 mr-2" /> Poster</>
                            )}
                          </motion.button>
                        </div>
                      ))}"""

new_comp_grid = """{compResults.map(res => (
                        <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className={cn(
                            "absolute top-0 left-0 w-full h-1", 
                            res.position === 1 ? "bg-amber-400" : res.position === 2 ? "bg-slate-300" : "bg-amber-700"
                          )} />
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-2">
                              <Medal className={cn("w-6 h-6", res.position === 1 ? 'text-amber-400' : res.position === 2 ? 'text-slate-400' : 'text-amber-700')} />
                              <span className="font-black text-slate-900 text-sm">{getPositionText(res.position)}</span>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{res.points} PTS</span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{res.student?.name}</h3>
                          <p className="text-sm font-medium text-slate-500">Class {res.student?.class} • {res.student?.team}</p>
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
                            link.download = `${competitions.find(c => c.id === selectedCompetition)?.name}_Result.jpg`;
                            link.click();
                          }}
                          className="mt-8 flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl text-lg w-full max-w-xs"
                        >
                          <Download className="w-6 h-6 mr-3" /> Download Poster
                        </button>
                      </div>
                    )}"""

if old_comp_grid in content:
    content = content.replace(old_comp_grid, new_comp_grid)
    
old_replace_target = """                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
""" + old_comp_grid + """
                      </div>
                    ) : ("""

new_replace_target = """                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
""" + new_comp_grid + """
                      </div>
                    ) : ("""

if old_replace_target in content:
    content = content.replace(old_replace_target, new_replace_target)

# 5. Modify Student Tab Generate Button
old_student_btn = """                              <button 
                                onClick={() => generatePoster(res, res.competition?.name, studentData)}
                                disabled={generatingPoster === studentData.id + res.competition?.name}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Poster"
                              >
                                {generatingPoster === studentData.id + res.competition?.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>"""

new_student_btn = """                              <button 
                                onClick={async () => {
                                  let dataUrl = generatedPosterMap[res.event_id];
                                  if (!dataUrl) {
                                    dataUrl = await generateCanvasPoster(res.event_id) || "";
                                  }
                                  if (dataUrl) {
                                    const link = document.createElement("a");
                                    link.href = dataUrl;
                                    link.download = `${res.competition?.name}_Result.jpg`;
                                    link.click();
                                  }
                                }}
                                disabled={generatingPoster === res.event_id}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Competition Poster"
                              >
                                {generatingPoster === res.event_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>"""

content = content.replace(old_student_btn, new_student_btn)

# 6. Remove the huge hidden poster template at the end
start_hidden = "      {/* Hidden Poster Template */}"
content = content.split(start_hidden)[0]

# Add closing tags for the component
content += """    </div>
  );
}
"""

with open("src/app/results/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patching complete.")
