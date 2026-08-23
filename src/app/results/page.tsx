"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Loader2, Medal, Trophy, ArrowLeft, Award, Download, User } from "lucide-react";
import { cn, sortStudents } from "@/lib/utils";
import Link from "next/link";

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"competition" | "student">("competition");

  // Data
  const [students, setStudents] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Competition Tab State
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState("");

  // Student Tab State
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const templates = ["/poster-1.jpg", "/poster-2.jpg", "/poster-3.png"];
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [generatedPosterMap, setGeneratedPosterMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all required data
    const [studentsRes, compsRes, resultsRes, settingsRes] = await Promise.all([
      supabase.from("students").select("id, name, class, team, category"),
      supabase.from("competitions").select("id, name, category, type"),
      supabase.from("results").select("id, event_id, student_id, position, points"),
      supabase.from("settings").select("*").eq("id", 1).single()
    ]);

    if (studentsRes.data) setStudents(sortStudents(studentsRes.data));
    if (compsRes.data) setCompetitions(compsRes.data);
    if (resultsRes.data) setResults(resultsRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    
    setLoading(false);
  };

  const generateCanvasPoster = async (compId: string, specificResults: any[] = [], template: string = selectedTemplate) => {
    const resToUse = specificResults.length > 0 ? specificResults : results.filter(r => r.event_id === compId).map(r => ({
      ...r,
      student: students.find(s => s.id === r.student_id)
    })).sort((a, b) => a.position - b.position);

    if (resToUse.length === 0) return null;

    const key = `${compId}-${template}`;
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

      if (template.includes("poster-3")) {
        canvas.width = 1080;
        canvas.height = 1080;
        ctx.drawImage(img, 0, 0, 1080, 1080);
      } else {
        canvas.width = 1023;
        canvas.height = 1280;
        ctx.drawImage(img, 0, 0, 1023, 1280);
      }
      
      ctx.textBaseline = "top";

      if (template.includes("poster-1")) {
        ctx.fillStyle = "#FFD700"; 
        ctx.font = `600 28px Montserrat, sans-serif`;
        ctx.fillText(comp.name.toUpperCase(), 279, 430);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `18px Montserrat, sans-serif`;
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
      } else if (template.includes("poster-2")) {
        ctx.fillStyle = "#C8102E";
        ctx.font = `600 22px Montserrat, sans-serif`;
        ctx.fillText((comp.category || "GENERAL ZONE").toUpperCase(), 490, 480);

        ctx.fillStyle = "#332211";
        ctx.font = `bold 34px Montserrat, sans-serif`;
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
            ctx.font = `bold 30px Montserrat, sans-serif`;
            ctx.fillText(`${placePrefix}${studentName}`, 490, Y);

            ctx.fillStyle = "#C8102E";
            ctx.font = `600 22px Montserrat, sans-serif`;
            ctx.fillText(teamName, 540, Y + 35);

            winnerIndex++;
          });
        });
      } else if (template.includes("poster-3")) {
        ctx.fillStyle = "#FFD700";
        ctx.font = `600 24px Montserrat, sans-serif`;
        ctx.fillText((comp.category || "GENERAL ZONE").toUpperCase(), 180, 280);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold 48px Montserrat, sans-serif`;
        ctx.fillText(comp.name.toUpperCase(), 180, 310);

        let winnerIndex = 0;
        
        [1, 2, 3].forEach(pos => {
          const winners = resToUse.filter(r => r.position === pos);
          if (winners.length === 0) return;
          const placePrefix = pos + ". ";
          
          winners.forEach(w => {
            const studentName = (w.student?.name || "Unknown").toUpperCase();
            const teamName = (w.student?.team || "Unknown").toUpperCase();

            const Y = 440 + (winnerIndex * 120);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold 34px Montserrat, sans-serif`;
            ctx.fillText(`${placePrefix}${studentName}`, 180, Y);

            ctx.fillStyle = "#FFD700";
            ctx.font = `600 24px Montserrat, sans-serif`;
            ctx.fillText(teamName, 230, Y + 40);

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
  };

  // Helper arrays for dropdowns
  const categories = Array.from(new Set(competitions.map(c => c.category))).sort();
  const filteredComps = competitions.filter(c => !selectedCategory || c.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));
  
  const classes = Array.from(new Set(students.map(s => s.class)));
  const filteredStudents = students.filter(s => !selectedClass || s.class === selectedClass);

  // Compute Competition Results
  const compResults = results.filter(r => r.event_id === selectedCompetition).map(r => ({
    ...r,
    student: students.find(s => s.id === r.student_id)
  })).sort((a, b) => a.position - b.position);

  // Compute Student Report Card
  const studentResults = results.filter(r => r.student_id === selectedStudent).map(r => ({
    ...r,
    competition: competitions.find(c => c.id === r.event_id)
  })).sort((a, b) => a.position - b.position);
  
  const studentData = students.find(s => s.id === selectedStudent);
  const totalPoints = studentResults.reduce((acc, curr) => acc + curr.points, 0);

  useEffect(() => {
    if (activeTab === "competition" && selectedCompetition && compResults.length > 0) {
      const key = `${selectedCompetition}-${selectedTemplate}`;
      if (!generatedPosterMap[key]) {
        generateCanvasPoster(selectedCompetition, compResults, selectedTemplate);
      }
    }
  }, [selectedCompetition, compResults, activeTab, selectedTemplate]);

  const getPositionText = (pos: number) => {
    if (pos === 1) return "1st Position";
    if (pos === 2) return "2nd Position";
    if (pos === 3) return "3rd Position";
    return `${pos}th Position`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center text-sm font-bold text-slate-700 hover:text-slate-900 bg-white shadow-sm hover:shadow-md px-4 py-2 rounded-full transition-all border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </motion.button>
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Result Portal</h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
          View official competition results or check a comprehensive report card for any participant.
        </p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-white p-6 md:p-10">
        
        {/* Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl shadow-inner mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("competition")}
            className={cn(
              "flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === "competition" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Trophy className="w-4 h-4 mr-2" /> By Competition
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={cn(
              "flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === "student" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <User className="w-4 h-4 mr-2" /> By Student
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "competition" ? (
            <motion.div 
              key="competition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category (Optional)</label>
                  <select 
                    value={selectedCategory} 
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedCompetition(""); }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Competition</label>
                  <select 
                    value={selectedCompetition} 
                    onChange={e => setSelectedCompetition(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                  >
                    <option value="">Choose a competition...</option>
                    {filteredComps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {selectedCompetition && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  {compResults.length > 0 ? (
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
                      {generatedPosterMap[`${selectedCompetition}-${selectedTemplate}`] && (
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
                              src={generatedPosterMap[`${selectedCompetition}-${selectedTemplate}`]} 
                              alt="Result Poster" 
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = generatedPosterMap[`${selectedCompetition}-${selectedTemplate}`];
                              link.download = `${competitions.find(c => c.id === selectedCompetition)?.name}_Result.jpg`;
                              link.click();
                            }}
                            className="mt-8 flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl text-lg w-full max-w-xs"
                          >
                            <Download className="w-6 h-6 mr-3" /> Download Poster
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/50 rounded-3xl border border-slate-100">
                      <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No results published for this competition yet.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Class (Optional)</label>
                  <select 
                    value={selectedClass} 
                    onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(""); }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Student</label>
                  <select 
                    value={selectedStudent} 
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                  >
                    <option value="">Choose a student...</option>
                    {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.team})</option>)}
                  </select>
                </div>
              </div>

              {selectedStudent && studentData && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">{studentData.name}</h2>
                        <p className="text-slate-500 font-medium">Class {studentData.class} • {studentData.category} • Team {studentData.team}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 px-6 py-4 rounded-2xl border border-blue-200 text-center shadow-sm">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Points</p>
                        <p className="text-4xl font-black text-blue-700">{totalPoints}</p>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Medal className="w-5 h-5 mr-2 text-amber-500" />
                      Achievements
                    </h3>

                    {studentResults.length > 0 ? (
                      <div className="space-y-4">
                        {studentResults.map(res => (
                          <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-sm",
                                res.position === 1 ? "bg-amber-400" : res.position === 2 ? "bg-slate-400" : "bg-amber-600"
                              )}>
                                {res.position}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{res.competition?.name}</p>
                                <p className="text-xs font-medium text-slate-500">{res.competition?.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{res.points} pts</span>
                              <button 
                                onClick={async () => {
                                  const key = `${res.event_id}-${selectedTemplate}`;
                                  let dataUrl = generatedPosterMap[key];
                                  if (!dataUrl) {
                                    dataUrl = await generateCanvasPoster(res.event_id, [], selectedTemplate) || "";
                                  }
                                  if (dataUrl) {
                                    const link = document.createElement("a");
                                    link.href = dataUrl;
                                    link.download = `${res.competition?.name}_Result.jpg`;
                                    link.click();
                                  }
                                }}
                                disabled={generatingPoster === `${res.event_id}-${selectedTemplate}`}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Competition Poster"
                              >
                                {generatingPoster === `${res.event_id}-${selectedTemplate}` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500 font-medium">No winning results recorded yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
