"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Trophy, Users, Star, Activity, Medal, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent relative">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-violet-500" />
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
    <div className="min-h-screen bg-transparent relative font-sans selection:bg-violet-500/30 overflow-hidden">
      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-40 border-b-0 rounded-none shadow-none border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg md:text-2xl tracking-tight text-white leading-tight">Meelad Fest 2k26</span>
                <span className="font-bold text-[9px] md:text-xs tracking-widest uppercase text-slate-400">Irshadu swibiyan madrasa</span>
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
                  className="hidden md:flex items-center text-sm font-extrabold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-5 py-2.5 rounded-full transition-all border border-amber-400/20 group"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Live Leaderboard
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center text-xs md:text-sm font-extrabold text-white bg-white/5 hover:bg-white/10 px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all border border-white/10 group"
                >
                  <span className="hidden sm:inline">Portal Login</span>
                  <span className="sm:hidden">Login</span>
                  <ArrowRight className="w-4 h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
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
            className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-10"
          >
            <div className="absolute inset-0 p-4 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Meelad Fest 2k26 Logo" 
                fill
                priority
                className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              />
            </div>
          </motion.div>
          
          <div className="inline-block bg-yellow-400 text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            Now Featuring
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-6 leading-tight pb-2">
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
            { label: "Teams", value: stats.teams, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Zones", value: stats.categories, icon: Activity, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
            { label: "Participants", value: stats.participants, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Events", value: stats.competitions, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants} 
              className="glass-card p-6 md:p-8 text-center"
            >
              <div className={`mx-auto w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5 border border-white/5`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">{stat.value}</p>
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
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Live Leaderboard</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 mx-auto mt-6 rounded-full" />
            </div>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 pointer-events-none hidden md:block">
                <Trophy className="w-64 h-64" />
              </div>
              
              {leaderboard.map((team, index) => (
                <motion.div 
                  key={team.team} 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" as const, stiffness: 200, damping: 20 }}
                  className={cn(
                    "rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden",
                    index === 0 
                      ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_10px_30px_rgba(251,191,36,0.3)] border border-amber-300/50" 
                      : "glass-panel"
                  )}
                >
                  <div className="relative z-10">
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-2", index === 0 ? "text-amber-100" : "text-slate-500")}>
                      Rank 0{index + 1}
                    </p>
                    <h3 className={cn("text-4xl font-extrabold tracking-tight", index === 0 ? "text-white" : index === 1 ? "bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm" : "text-white")}>
                      Team {team.team}
                    </h3>
                  </div>
                  <div className="text-right relative z-10">
                    <p className={cn("text-6xl font-black tracking-tight", index === 0 ? "text-white" : index === 1 ? "bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm" : "text-white")}>
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
          <div className="glass-panel overflow-hidden relative border border-white/[0.08]">
            {/* Background glowing effects inside the card */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="p-6 md:p-16 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Check Your Results</h2>
                <p className="text-slate-400 text-lg font-medium">
                  Search for a participant by name or class to view their winning positions and download a custom celebratory poster.
                </p>
              </div>
              <div className="flex justify-center mt-4">
                <Link href="/results">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center text-lg md:text-xl font-extrabold text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] px-10 py-5 rounded-full transition-all border border-white/10 group"
                  >
                    Get Result
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
