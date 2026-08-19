"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Loader2, Medal, Trophy, ArrowLeft, Award, Download, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import html2canvas from "html2canvas";

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

  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [activePosterData, setActivePosterData] = useState<any | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

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

    if (studentsRes.data) setStudents(studentsRes.data);
    if (compsRes.data) setCompetitions(compsRes.data);
    if (resultsRes.data) setResults(resultsRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    
    setLoading(false);
  };

  const generatePoster = async (result: any, compName: string, studentData: any) => {
    setGeneratingPoster(studentData.id + compName);
    setActivePosterData({ ...result, student: studentData, competitions: { name: compName, category: studentData.category } });
    
    setTimeout(async () => {
      if (posterRef.current) {
        try {
          const canvas = await html2canvas(posterRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
          });
          
          const image = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = image;
          link.download = `Meelad_Fest_${studentData.name.replace(/\s+/g, '_')}_Result.png`;
          link.click();
        } catch (error) {
          console.error("Failed to generate poster:", error);
          alert("Failed to generate the poster image.");
        }
      }
      setGeneratingPoster(null);
      setActivePosterData(null);
    }, 500);
  };

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

  // Helper arrays for dropdowns
  const categories = Array.from(new Set(competitions.map(c => c.category))).sort();
  const filteredComps = competitions.filter(c => !selectedCategory || c.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));
  
  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const filteredStudents = students.filter(s => !selectedClass || s.class === selectedClass).sort((a, b) => a.name.localeCompare(b.name));

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      ))}
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
                                onClick={() => generatePoster(res, res.competition?.name, studentData)}
                                disabled={generatingPoster === studentData.id + res.competition?.name}
                                className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Download Poster"
                              >
                                {generatingPoster === studentData.id + res.competition?.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
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

      {/* Hidden Poster Template */}
      {activePosterData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={posterRef} 
            className="relative w-[1080px] h-[1080px] bg-slate-900 overflow-hidden"
            style={{
              backgroundImage: settings?.poster_template_url ? `url(${settings.poster_template_url})` : 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* If no background URL provided, show beautiful placeholder graphics */}
            {!settings?.poster_template_url && (
              <div className="absolute inset-0 opacity-20 mix-blend-screen">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-500 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-500 rounded-full blur-[150px]"></div>
              </div>
            )}
            
            {/* Elegant Glass Border Frame */}
            <div className="absolute inset-10 border-2 border-white/20 rounded-[3rem] z-10 pointer-events-none backdrop-blur-[2px] shadow-[inset_0_0_100px_rgba(255,255,255,0.1)]"></div>
            <div className="absolute inset-12 border border-white/10 rounded-[2.5rem] z-10 pointer-events-none"></div>

            {/* Top Logo & Title */}
            <div className="absolute top-24 w-full text-center z-20">
              <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto mb-8 flex items-center justify-center p-4">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" crossOrigin="anonymous" />
              </div>
              <h2 className="text-white text-3xl md:text-5xl font-black tracking-[0.2em] uppercase drop-shadow-2xl">
                Meelad Fest 2k26
              </h2>
              <p className="text-blue-200/80 text-xl md:text-2xl font-bold tracking-[0.3em] uppercase mt-4">Irshadu swibiyan madrasa</p>
            </div>

            {/* Center Content: Result Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pt-48">
              <div className="bg-slate-900/10 backdrop-blur-2xl rounded-[4rem] border border-white/20 p-16 w-11/12 md:w-4/5 text-center shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
                {/* Shine effect across the card */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                <div className="mb-10 inline-flex items-center justify-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-10 py-3 rounded-full text-2xl font-black uppercase tracking-widest shadow-xl border border-amber-300/50">
                  <Trophy className="w-8 h-8 mr-4" />
                  {getPositionText(activePosterData.position)}
                </div>
                
                <h1 className="text-[5.5rem] font-black text-white leading-[1.1] mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  {activePosterData.student.name}
                </h1>
                
                <p className="text-2xl text-blue-100 font-bold mb-14 uppercase tracking-[0.2em] bg-black/20 inline-block px-8 py-3 rounded-full border border-white/10">
                  Class {activePosterData.student.class} <span className="mx-4 text-white/30">|</span> Team {activePosterData.student.team}
                </p>
                
                <div className="inline-block relative w-full max-w-2xl">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full"></div>
                  <h3 className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 drop-shadow-sm mb-4 leading-tight">
                    {activePosterData.competitions.name}
                  </h3>
                  <p className="relative text-xl text-blue-200 uppercase tracking-[0.3em] font-bold">
                    {activePosterData.competitions.category}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="absolute bottom-24 w-full text-center z-20">
              <p className="text-white/40 text-xl font-bold tracking-[0.3em] uppercase">
                Congratulations on your outstanding performance
              </p>
              <div className="w-24 h-1 bg-slate-900/20 mx-auto mt-6 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
