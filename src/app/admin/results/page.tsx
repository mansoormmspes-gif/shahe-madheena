"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Trophy, Medal, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(false);
  
  const [results, setResults] = useState<{ [position: number]: { student_id: string, points: number } }>({
    1: { student_id: "", points: 0 },
    2: { student_id: "", points: 0 },
    3: { student_id: "", points: 0 },
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    const { data } = await supabase.from("competitions").select("id, name, type").order("name");
    if (data) setCompetitions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchEventData(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEventData = async (eventId: string) => {
    setLoadingEvent(true);
    setMessage({ text: "", type: "" });
    
    const { data: regs } = await supabase
      .from("registrations")
      .select("student_id, group_slot, students(name, team)")
      .eq("event_id", eventId);
      
    if (regs) {
      setRegistrations(regs);
    }

    const { data: existingResults } = await supabase
      .from("results")
      .select("*")
      .eq("event_id", eventId);

    const newResults = {
      1: { student_id: "", points: 0 },
      2: { student_id: "", points: 0 },
      3: { student_id: "", points: 0 },
    };

    if (existingResults) {
      existingResults.forEach(r => {
        newResults[r.position as 1|2|3] = { student_id: r.student_id, points: r.points };
      });
    }

    setResults(newResults);
    setLoadingEvent(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      await supabase.from("results").delete().eq("event_id", selectedEventId);

      const toInsert = [];
      for (const pos of [1, 2, 3]) {
        const r = results[pos as 1|2|3];
        if (r.student_id) {
          toInsert.push({
            event_id: selectedEventId,
            student_id: r.student_id,
            position: pos,
            points: r.points
          });
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("results").insert(toInsert);
        if (error) throw error;
      }

      setMessage({ text: "Results saved successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setMessage({ text: "Error saving results: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-10 w-10 text-amber-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Results Management</h1>
          <p className="text-slate-500 font-medium">Assign winners and points for each competition.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-lg shadow-teal-900/5 border border-white/60 backdrop-blur-xl bg-white/60 p-3 sm:p-6 md:p-8">
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Competition
          </label>
          <div className="relative max-w-xl">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="block w-full pl-4 pr-10 py-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-base font-medium text-slate-900 transition-all appearance-none cursor-pointer outline-none shadow-sm"
            >
              <option value="">-- Choose an event --</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedEventId && (
            loadingEvent ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Loader2 className="h-8 w-8 text-amber-400" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSave}
              >
                <AnimatePresence>
                  {message.text && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className={`p-4 rounded-xl text-sm font-bold border ${message.type === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6">
                  {[
                    { pos: 1, label: "1st Place", color: "text-amber-500", bg: "bg-gradient-to-r from-amber-50 to-amber-100/30", border: "border-amber-200", icon: Trophy },
                    { pos: 2, label: "2nd Place", color: "text-slate-500", bg: "bg-gradient-to-r from-slate-50 to-slate-100/30", border: "border-slate-200", icon: Medal },
                    { pos: 3, label: "3rd Place", color: "text-orange-700", bg: "bg-gradient-to-r from-orange-50 to-orange-100/30", border: "border-orange-200", icon: Award }
                  ].map(({ pos, label, color, bg, border, icon: Icon }) => (
                    <motion.div 
                      key={pos} 
                      whileHover={{ scale: 1.01 }}
                      className={`p-6 rounded-2xl border ${border} flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${bg} shadow-sm transition-all`}
                    >
                      <div className="flex items-center w-40 flex-shrink-0">
                        <div className={`p-2 rounded-xl bg-white/60 shadow-sm mr-4 ${color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className={`font-black text-lg ${color}`}>{label}</span>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Select Student</label>
                        <select
                          value={results[pos as 1|2|3].student_id}
                          onChange={(e) => setResults({...results, [pos]: { ...results[pos as 1|2|3], student_id: e.target.value }})}
                          className="block w-full px-4 py-3 bg-white/80 border border-white/50 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-sm text-slate-900 font-medium transition-all shadow-sm outline-none"
                        >
                          <option value="">-- None --</option>
                          {registrations.map(r => (
                            <option key={r.student_id} value={r.student_id}>
                              {r.students.name} — Team {r.students.team} {r.group_slot ? `(Group ${r.group_slot})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-32 flex-shrink-0">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Points</label>
                        <input
                          type="number"
                          min="0"
                          value={results[pos as 1|2|3].points}
                          onChange={(e) => setResults({...results, [pos]: { ...results[pos as 1|2|3], points: parseInt(e.target.value) || 0 }})}
                          className="block w-full px-4 py-3 bg-white/80 border border-white/50 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-sm text-slate-900 font-bold transition-all shadow-sm text-center outline-none"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/20 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Save Results
                  </motion.button>
                </div>
              </motion.form>
            )
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
