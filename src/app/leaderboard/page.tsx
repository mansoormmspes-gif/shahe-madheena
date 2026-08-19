"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Award, Loader2, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ team: string; points: number }[]>([]);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to changes in the results table for real-time reactivity
    const channel = supabase
      .channel('results-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, (payload) => {
        console.log('Results changed!', payload);
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // First, get all distinct teams from the students table to ensure even teams with 0 points show up
      const { data: studentsData } = await supabase
        .from('students')
        .select('team');
        
      const teamPoints: Record<string, number> = {
        "ZAMAAN": 0,
        "ZAMEEN": 0
      };

      if (studentsData) {
        studentsData.forEach(s => {
          if (s.team && teamPoints[s.team] === undefined) {
            teamPoints[s.team] = 0;
          }
        });
      }

      // Fetch all results joined with the students table to get their team
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('points, students!inner(team)');

      if (resultsError) {
        console.error("Error fetching results join:", resultsError);
        throw resultsError;
      }

      if (resultsData) {
        // Aggregate points
        resultsData.forEach((r: any) => {
          const team = r.students?.team;
          if (team && teamPoints[team] !== undefined) {
            teamPoints[team] += (r.points || 0);
          }
        });
      }

      // Convert to sorted array
      const lb = Object.keys(teamPoints)
        .map(team => ({ team, points: teamPoints[team] }))
        .sort((a, b) => b.points - a.points);
      
      setLeaderboard(lb);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  const getTeamColor = (team: string) => {
    if (team === 'ZAMAAN') return 'from-indigo-500 to-blue-600 shadow-indigo-500/30';
    if (team === 'ZAMEEN') return 'from-emerald-500 to-teal-600 shadow-emerald-500/30';
    return 'from-slate-600 to-slate-800 shadow-slate-500/30';
  };

  const getTeamBadge = (team: string) => {
    if (team === 'ZAMAAN') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (team === 'ZAMEEN') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative flex flex-col font-sans relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-300/30 blur-[120px] animate-float" />
        <div className="absolute top-[60%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-300/20 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-4 md:mb-6 border border-slate-100">
            <Trophy className="h-10 w-10 text-amber-500 mr-3" />
            <h1 className="text-2xl md:text-5xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tighter">
              Live Leaderboard
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
            Real-time points standings for all competing teams. May the best team win!
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="grid gap-6 md:gap-8 max-w-4xl mx-auto"
        >
          {leaderboard.map((teamData, index) => {
            const isFirst = index === 0 && teamData.points > 0;
            return (
              <motion.div 
                key={teamData.team}
                variants={itemVariants}
                className={`relative bg-white rounded-[2rem] p-4 md:p-8 flex flex-col md:flex-row md:items-center text-center md:text-left gap-4 md:gap-0 shadow-lg border-2 ${isFirst ? 'border-amber-400' : 'border-white'} transition-all`}
              >
                {/* Rank Badge */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/30' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30' :
                  index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/30' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {index === 0 ? <Crown className="w-7 h-7" /> : 
                   index === 1 ? <Medal className="w-7 h-7" /> : 
                   index === 2 ? <Award className="w-7 h-7" /> : 
                   <span className="text-xl font-black">#{index + 1}</span>}
                </div>

                {/* Team Info */}
                <div className="ml-0 md:ml-6 flex-1">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-1">
                    Team {teamData.team}
                  </h2>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getTeamBadge(teamData.team)}`}>
                    {teamData.team}
                  </span>
                </div>

                {/* Points */}
                <div className={`ml-0 md:ml-4 px-6 py-4 rounded-2xl w-full md:w-auto bg-gradient-to-br ${getTeamColor(teamData.team)} shadow-lg text-white min-w-[120px] md:min-w-[160px] text-center transform hover:scale-105 transition-transform`}>
                  <div className="text-2xl md:text-5xl font-black tracking-tighter mb-1">
                    {teamData.points}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                    Points
                  </div>
                </div>

                {/* Decorative crown for winner */}
                {isFirst && (
                  <motion.div 
                    initial={{ opacity: 0, rotate: -20, scale: 0 }}
                    animate={{ opacity: 1, rotate: 15, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -top-6 -right-4"
                  >
                    <div className="bg-amber-400 p-2 rounded-full shadow-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No results recorded yet</h3>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
