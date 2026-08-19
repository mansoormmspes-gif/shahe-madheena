"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Download, Trophy, Users, Star, Activity, Medal, Award, ArrowRight } from "lucide-react";
import html2canvas from "html2canvas";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PublicPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teams: 2,
    categories: 4,
    participants: 0,
    competitions: 0,
  });
  const [settings, setSettings] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<{ team: string; points: number }[]>([]);
  
  // Result Checker state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Poster Generation state
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [activePosterData, setActivePosterData] = useState<any>(null);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
    setSettings(settingsData);

    const { count: studentsCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: compsCount } = await supabase.from("competitions").select("*", { count: "exact", head: true });
    
    setStats({
      teams: 2,
      categories: 4,
      participants: studentsCount || 0,
      competitions: compsCount || 0,
    });

    if (settingsData?.show_leaderboard) {
      const { data: resultsData } = await supabase
        .from("results")
        .select(`
          points,
          students!inner (
            team
          )
        `);
      
      const teamPoints: Record<string, number> = { "ZAMAAN": 0, "ZAMEEN": 0 };
      
      if (resultsData) {
        resultsData.forEach((r: any) => {
          const team = r.students.team;
          if (teamPoints[team] !== undefined) {
            teamPoints[team] += r.points;
          }
        });
      }
      
      setLeaderboard([
        { team: "ZAMAAN", points: teamPoints["ZAMAAN"] },
        { team: "ZAMEEN", points: teamPoints["ZAMEEN"] }
      ].sort((a, b) => b.points - a.points));
    }

    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearched(true);
    
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .or(`name.ilike.%${searchQuery}%,class.ilike.%${searchQuery}%`);
      
    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id);
      
      const { data: results } = await supabase
        .from("results")
        .select(`
          position,
          points,
          student_id,
          competitions (
            name, category
          )
        `)
        .in("student_id", studentIds);
        
      const combinedResults = results?.map(r => {
        const student = students.find(s => s.id === r.student_id);
        return {
          ...r,
          student,
        };
      }) || [];
      
      setSearchResults(combinedResults);
    } else {
      setSearchResults([]);
    }
    
    setSearching(false);
  };

  const generatePoster = async (result: any) => {
    setGeneratingPoster(result.student.id + result.competitions.name);
    setActivePosterData(result);
    
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
          link.download = `Shahe_Madeena_${result.student.name.replace(/\s+/g, '_')}_Result.png`;
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-slate-600" />
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-slate-200 relative overflow-hidden">
      {/* Dynamic Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px] animate-float" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/40 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative w-32 h-12 flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl md:text-2xl tracking-tighter text-white leading-tight">Meelad Fest 2k26</span>
                <span className="font-bold text-[10px] md:text-xs tracking-widest uppercase text-slate-400">Irshadu swibiyan madrasa</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link href="/leaderboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:flex items-center text-sm font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-5 py-2.5 rounded-full transition-all border border-amber-100 group"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Live Leaderboard
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center text-sm font-bold text-slate-700 hover:text-slate-900 bg-white shadow-sm hover:shadow-md px-6 py-2.5 rounded-full transition-all border border-slate-100 group"
                >
                  Portal Login
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-24 mt-4"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" as const, stiffness: 200, damping: 20 }}
            className="relative w-64 h-32 md:w-96 md:h-48 mx-auto mb-10"
          >
            <div className="absolute inset-0 p-4 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Meelad Fest 2k26 Logo" 
                fill
                priority
                className="object-contain drop-shadow-xl"
              />
            </div>
          </motion.div>
          
          <h2 className="text-xl md:text-3xl font-bold text-slate-400 tracking-widest uppercase mb-4">
            Irshadu swibiyan madrasa
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 tracking-tighter mb-6 leading-tight pb-2">
            Meelad Fest 2k26
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Celebrating creativity, culture, and spectacular talent at the grand Meelad Fest 2k26.
          </p>
        </motion.div>

        {/* Live Stats */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-32"
        >
          {[
            { label: "Teams", value: stats.teams, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Zones", value: stats.categories, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Participants", value: stats.participants, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Events", value: stats.competitions, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants} 
              whileHover={{ y: -5 }}
              className="glass-card p-6 md:p-8 rounded-[2rem] text-center"
            >
              <div className={`mx-auto w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5 shadow-inner`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</p>
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic Leaderboard */}
        {settings?.show_leaderboard && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-32"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Live Leaderboard</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-6 rounded-full" />
            </div>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 opacity-20 pointer-events-none hidden md:block">
                <Trophy className="w-64 h-64" />
              </div>
              
              {leaderboard.map((team, index) => (
                <motion.div 
                  key={team.team} 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" as const, stiffness: 200, damping: 20 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden shadow-lg",
                    index === 0 
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white border border-amber-300" 
                      : "glass-panel border-white/50"
                  )}
                >
                  <div className="relative z-10">
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-2", index === 0 ? "text-amber-100" : "text-slate-400")}>
                      Rank 0{index + 1}
                    </p>
                    <h3 className={cn("text-4xl font-black tracking-tight", index === 0 ? "text-white" : "text-white")}>
                      Team {team.team}
                    </h3>
                  </div>
                  <div className="text-right relative z-10">
                    <p className={cn("text-6xl font-black tracking-tighter", index === 0 ? "text-white" : "text-white")}>
                      {team.points}
                    </p>
                    <p className={cn("text-sm font-bold uppercase tracking-widest mt-1", index === 0 ? "text-amber-100" : "text-slate-400")}>
                      Points
                    </p>
                  </div>
                  {/* Decorative shape */}
                  {index === 0 && (
                    <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none mix-blend-overlay">
                      <Medal className="w-48 h-48" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Result Checker */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border border-slate-800">
            {/* Background glowing effects inside the dark card */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="p-8 md:p-16 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Check Your Results</h2>
                <p className="text-slate-500 text-lg font-medium">
                  Search for a participant by name or class to view their winning positions and download a custom celebratory poster.
                </p>
              </div>
              
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Enter student name or class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-16 py-6 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all text-xl font-medium shadow-inner"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={searching}
                  className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg"
                >
                  {searching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </motion.button>
              </form>
            </div>

            <AnimatePresence mode="wait">
              {searched && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white p-8 md:p-12 relative z-10"
                >
                  {searchResults.length > 0 ? (
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      {searchResults.map((result, idx) => (
                        <motion.div 
                          variants={itemVariants}
                          key={idx} 
                          className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-between hover:shadow-lg hover:border-blue-200 transition-all group"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                                <Medal className={cn("w-6 h-6", result.position === 1 ? 'text-amber-400' : result.position === 2 ? 'text-slate-400' : 'text-amber-700')} />
                                <span className="font-black text-slate-900 text-sm tracking-widest uppercase">{getPositionText(result.position)}</span>
                              </div>
                              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm">
                                {result.points} PTS
                              </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{result.student.name}</h3>
                            <p className="text-sm font-bold text-slate-400 mb-6 tracking-wide">CLASS {result.student.class} &bull; TEAM {result.student.team}</p>
                            
                            <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Event Details</p>
                              <p className="text-lg font-bold text-slate-900 leading-tight mb-1">{result.competitions.name}</p>
                              <p className="text-sm font-medium text-slate-400">{result.competitions.category}</p>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => generatePoster(result)}
                            disabled={generatingPoster === result.student.id + result.competitions.name}
                            className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-md group-hover:shadow-lg disabled:opacity-50"
                          >
                            {generatingPoster === result.student.id + result.competitions.name ? (
                              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Generating Poster...</>
                            ) : (
                              <><Download className="w-5 h-5 mr-3" /> Download Result Poster</>
                            )}
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Award className="w-12 h-12 text-slate-300" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">No Results Found</h3>
                      <p className="text-slate-400 font-medium">Double check the name or class and try searching again.</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Hidden Poster Template for html2canvas */}
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
              <div className="relative w-64 h-32 md:w-80 md:h-40 mx-auto mb-8 flex items-center justify-center p-4">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" crossOrigin="anonymous" />
              </div>
              <h2 className="text-white text-4xl md:text-5xl font-black tracking-[0.2em] uppercase drop-shadow-2xl">
                Meelad Fest 2k26
              </h2>
              <p className="text-blue-200/80 text-xl md:text-2xl font-bold tracking-[0.3em] uppercase mt-4">Irshadu swibiyan madrasa</p>
            </div>

            {/* Center Content: Result Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pt-48">
              <div className="bg-slate-900/10 backdrop-blur-2xl rounded-[4rem] border border-white/20 p-16 w-4/5 text-center shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
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
