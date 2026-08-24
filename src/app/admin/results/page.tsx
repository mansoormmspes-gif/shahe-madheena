"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(false);
  
  const [results, setResults] = useState<{ [position: number]: { student_ids: string[], points: number } }>({
    1: { student_ids: [], points: 0 },
    2: { student_ids: [], points: 0 },
    3: { student_ids: [], points: 0 },
  });
  const [originalResults, setOriginalResults] = useState<{ student_id: string, position: number }[]>([]);

  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("name");
      if (data) setCompetitions(data);
      setLoading(false);
    };
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      handleEventChange(selectedEventId);
    }
  }, [selectedEventId]);

  const handleEventChange = async (eventId: string) => {
    setLoadingEvent(true);
    setResults({
      1: { student_ids: [], points: 0 },
      2: { student_ids: [], points: 0 },
      3: { student_ids: [], points: 0 },
    });
    setOriginalResults([]);
    setMessage({ text: "", type: "" });
    if (!eventId) {
      setLoadingEvent(false);
      return;
    }

    const { data: regs } = await supabase
      .from("registrations")
      .select(`
        student_id,
        team,
        group_slot,
        students ( name, team )
      `)
      .eq("event_id", eventId);
    
    if (regs) {
      setRegistrations(regs);
    }

    const { data: existingResults } = await supabase
      .from("results")
      .select("*")
      .eq("event_id", eventId);

    const newResults = {
      1: { student_ids: [] as string[], points: 0 },
      2: { student_ids: [] as string[], points: 0 },
      3: { student_ids: [] as string[], points: 0 },
    };
    
    const originals: { student_id: string, position: number }[] = [];

    if (existingResults) {
      existingResults.forEach(r => {
        if (r.position >= 1 && r.position <= 3) {
          newResults[r.position as 1|2|3].student_ids.push(r.student_id);
          newResults[r.position as 1|2|3].points = r.points;
          originals.push({ student_id: r.student_id, position: r.position });
        }
      });
    }

    setResults(newResults);
    setOriginalResults(originals);
    setLoadingEvent(false);
  };

  const handleDeleteRow = async (pos: 1|2|3) => {
    if (!window.confirm(`Are you sure you want to clear all winners for ${pos === 1 ? '1st' : pos === 2 ? '2nd' : '3rd'} Place?`)) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from("results").delete().eq("event_id", selectedEventId).eq("position", pos);
      if (error) throw error;
      
      setResults({ ...results, [pos]: { student_ids: [], points: 0 } });
      setOriginalResults(originalResults.filter(o => o.position !== pos));
      setMessage({ text: "Results cleared successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setMessage({ text: "Error clearing results: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [generatingPoster, setGeneratingPoster] = useState(false);

  
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const generatePosterCanvasDataUrl = async (comp: any, compResults: any[], template: string, overrideZone: string | null = null): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const isGroup = comp.type === "Group" || comp.type === "group";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        const img = new Image();
        img.src = template;
        img.crossOrigin = "anonymous";
        
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error("Failed to load " + template));
        });

        if (template.includes("poster-3") || template.includes("poster-4")) {
          canvas.width = 1080;
          canvas.height = 1080;
          ctx.drawImage(img, 0, 0, 1080, 1080);
        } else {
          canvas.width = 1023;
          canvas.height = 1280;
          ctx.drawImage(img, 0, 0, 1023, 1280);
        }
        
        ctx.textBaseline = "top";
        const zoneStr = (overrideZone || comp.category || "GENERAL ZONE").toUpperCase();

        if (template.includes("poster-1")) {
          ctx.fillStyle = "#FFD700"; 
          ctx.font = `600 28px Montserrat, sans-serif`;
          ctx.fillText(comp.name.toUpperCase(), 279, 430);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = `18px Montserrat, sans-serif`;
          ctx.fillText(zoneStr, 279, 470);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter((r: any) => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ".";
            
            winners.forEach((w: any) => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? `${baseName} & TEAM` : baseName;
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
          ctx.fillText(zoneStr, 490, 480);

          ctx.fillStyle = "#332211";
          ctx.font = `bold 34px Montserrat, sans-serif`;
          ctx.fillText(comp.name.toUpperCase(), 490, 505);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter((r: any) => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach((w: any) => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? `${baseName} & TEAM` : baseName;
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
          ctx.fillText(zoneStr, 180, 280);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold 48px Montserrat, sans-serif`;
          ctx.fillText(comp.name.toUpperCase(), 180, 310);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter((r: any) => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach((w: any) => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? `${baseName} & TEAM` : baseName;
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
        } else if (template.includes("poster-4")) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `600 24px Montserrat, sans-serif`;
          ctx.fillText(zoneStr, 260, 370);

          ctx.fillStyle = "#FFD700";
          ctx.font = `bold 42px Montserrat, sans-serif`;
          ctx.fillText(comp.name.toUpperCase(), 260, 410);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter((r: any) => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach((w: any) => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? `${baseName} & TEAM` : baseName;
              const placeAndStudentText = `${placePrefix}${studentName}`;
              const teamName = (w.student?.team || "Unknown").toUpperCase();

              const Y = 510 + (winnerIndex * 110);

              ctx.fillStyle = "#FFFFFF";
              ctx.font = `bold 32px Montserrat, sans-serif`;
              ctx.fillText(placeAndStudentText, 260, Y);

              const indent = ctx.measureText(placePrefix).width;

              ctx.fillStyle = "#FFD700";
              ctx.font = `22px Montserrat, sans-serif`;
              ctx.fillText(teamName, 260 + indent, Y + 35);

              winnerIndex++;
            });
          });
        }

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err: any) {
        reject(err);
      }
    });
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const { data: allRes } = await supabase.from("results").select("*, students(name, team)");
      const { data: comps } = await supabase.from("competitions").select("*");
      if (!allRes || !comps) throw new Error("Failed to fetch data");

      const zip = new JSZip();
      const templates = ["/poster-1.jpg", "/poster-2.jpg", "/poster-3.png", "/poster-4.jpg"];

      const compsWithResults = Array.from(new Set(allRes.map((r: any) => r.event_id)));

      for (const compId of compsWithResults) {
        const comp = comps.find(c => c.id === compId);
        if (!comp) continue;
        
        const compResults = allRes.filter((r: any) => r.event_id === compId).map(r => ({
           position: r.position,
           student: r.students
        })).sort((a,b) => a.position - b.position);

        const template = templates[Math.floor(Math.random() * templates.length)];
        const dataUrl = await generatePosterCanvasDataUrl(comp, compResults, template, comp.category);
        
        if (dataUrl) {
           const base64Data = dataUrl.split(",")[1];
           zip.file(`${comp.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Poster.jpg`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Results_Posters.zip");
    } catch (err: any) {
      console.error(err);
      alert("Bulk download failed.");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleGeneratePoster = async () => {
    const comp = competitions.find(c => c.id === selectedEventId);
    if (!comp) return;

    setGeneratingPoster(true);
    try {
      const compResults: any[] = [];
      [1, 2, 3].forEach(pos => {
         results[pos].student_ids.forEach(sid => {
            const r = registrations.find(reg => reg.student_id === sid);
            compResults.push({
               position: pos,
               student: { name: r?.students?.name || "Unknown", team: r?.students?.team || "Unknown" }
            });
         });
      });
      
      const templates = ["/poster-1.jpg", "/poster-2.jpg", "/poster-3.png", "/poster-4.jpg"];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const dataUrl = await generatePosterCanvasDataUrl(comp, compResults, template, selectedZone);
      if (dataUrl) {
         const a = document.createElement("a");
         a.href = dataUrl;
         a.download = `${comp.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Poster.jpg`;
         a.click();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate poster.");
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const currentSidsByPos: Record<number, string[]> = {
        1: results[1].student_ids,
        2: results[2].student_ids,
        3: results[3].student_ids,
      };

      const toDelete = originalResults.filter(o => !currentSidsByPos[o.position].includes(o.student_id));
      
      if (toDelete.length > 0) {
         for (const del of toDelete) {
            await supabase.from("results").delete().eq("event_id", selectedEventId).eq("position", del.position).eq("student_id", del.student_id);
         }
      }

      const toUpsert = [];
      for (const pos of [1, 2, 3]) {
        const r = results[pos as 1|2|3];
        for (const sid of r.student_ids) {
          toUpsert.push({
            event_id: selectedEventId,
            student_id: sid,
            position: pos,
            points: r.points
          });
        }
      }

      if (toUpsert.length > 0) {
        const { error } = await supabase.from("results").upsert(toUpsert, { onConflict: 'event_id,student_id' });
        if (error) throw error;
      }

      setOriginalResults(toUpsert.map(u => ({ student_id: u.student_id, position: u.position as number })));
      setMessage({ text: "Results saved successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setMessage({ text: "Error saving results: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const zones = Array.from(new Set(competitions.map(c => c.category))).sort();
  const filteredCompetitions = selectedZone ? competitions.filter(c => c.category === selectedZone) : [];

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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Results Management</h1>
              <p className="text-slate-500 font-medium">Assign winners and points for each competition.</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all"
          >
            {bulkDownloading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Archive className="h-5 w-5 mr-2" />}
            Bulk Download All Posters
          </motion.button>
        </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-lg shadow-teal-900/5 border border-white/60 backdrop-blur-xl bg-white/60 p-3 sm:p-6 md:p-8">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Select Zone
            </label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  setSelectedEventId("");
                }}
                className="block w-full pl-4 pr-10 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-base font-medium text-slate-900 transition-all appearance-none cursor-pointer outline-none shadow-sm"
              >
                <option value="">-- Choose a Zone --</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Select Competition
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={!selectedZone}
                className="block w-full pl-4 pr-10 py-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-base font-medium text-slate-900 transition-all appearance-none cursor-pointer outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedZone ? "-- Choose an event --" : "-- Select a Zone first --"}</option>
                {filteredCompetitions.map(c => (
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
                      
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Winners</label>
                        <div className="flex flex-wrap gap-2 mb-1">
                          {results[pos as 1|2|3].student_ids.map(sid => {
                            const r = registrations.find(reg => reg.student_id === sid);
                            const name = r?.students?.name || sid;
                            const team = r?.students?.team || '';
                            return (
                              <div key={sid} className="flex items-center gap-1 bg-white border border-amber-200 text-amber-900 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                <span>{name} {team ? `(${team})` : ''}</span>
                                <button type="button" onClick={() => {
                                  setResults({
                                    ...results,
                                    [pos]: { ...results[pos as 1|2|3], student_ids: results[pos as 1|2|3].student_ids.filter(id => id !== sid) }
                                  });
                                }} className="text-amber-500 hover:text-red-500 ml-1">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !results[pos as 1|2|3].student_ids.includes(val)) {
                              setResults({
                                ...results,
                                [pos]: { ...results[pos as 1|2|3], student_ids: [...results[pos as 1|2|3].student_ids, val] }
                              });
                            }
                          }}
                          className="block w-full px-4 py-3 bg-white/80 border border-white/50 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 sm:text-sm text-slate-900 font-medium transition-all shadow-sm outline-none"
                        >
                          <option value="">-- Add winner --</option>
                          {registrations.filter(r => !results[pos as 1|2|3].student_ids.includes(r.student_id)).map(r => (
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
                      {results[pos as 1|2|3].student_ids.length > 0 && (
                        <div className="flex items-end flex-shrink-0 mt-4 md:mt-0">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(pos as 1|2|3)}
                            className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
                            title="Clear all winners"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleGeneratePoster}
                    disabled={generatingPoster || saving || (results[1].student_ids.length === 0 && results[2].student_ids.length === 0 && results[3].student_ids.length === 0)}
                    className="inline-flex justify-center items-center px-8 py-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50 transition-all"
                  >
                    {generatingPoster ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2 text-slate-500" />}
                    Generate & Download Poster
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/20 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:opacity-50 transition-all"
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
