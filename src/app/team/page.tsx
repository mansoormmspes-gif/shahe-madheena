"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Download, AlertCircle, Users, ClipboardList, Plus, Trash2, Check, Lock, Unlock, Search, X, Info } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TeamDashboard() {
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [viewMode, setViewMode] = useState<"participant" | "event">("participant");
  
  const [settings, setSettings] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  
  const [error, setError] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  
  const [modalStudent, setModalStudent] = useState<any | null>(null);
  const [ruleModal, setRuleModal] = useState<{name: string, rules: string} | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalType, setGlobalType] = useState("All");
  const [globalZone, setGlobalZone] = useState("All");

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!settings?.registration_start_time || !settings?.registration_end_time) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(settings.registration_start_time).getTime();
      const endTime = new Date(settings.registration_end_time).getTime();
      
      let targetTime = endTime;
      if (now < startTime) {
        targetTime = startTime; // Count down to opening
      }

      const distance = targetTime - now;

      if (now > endTime) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.registration_start_time, settings?.registration_end_time]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data: profile } = await supabase.from("profiles").select("team_name").eq("id", session.user.id).single();
    if (!profile) return;
    
    setTeamName(profile.team_name);

    const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
    setSettings(settingsData);

    const { data: studentsData, error: studentsError } = await supabase.from("students").select("*").ilike("team", profile.team_name);
    console.log("Fetched students:", studentsData, "Error:", studentsError);
    if (studentsData) setStudents(studentsData);

    const { data: compsData } = await supabase.from("competitions").select("*").order("name");
    if (compsData) setCompetitions(compsData);

    const { data: regsData, error: regsError } = await supabase.from("registrations").select("*").ilike("team", profile.team_name);
    console.log("Fetched registrations:", regsData, "Error:", regsError);
    if (regsData) setRegistrations(regsData);

    setLoading(false);
  };

  const getRegistrationStatus = () => {
    if (!settings?.registration_start_time || !settings?.registration_end_time) return "CLOSED";
    const now = new Date();
    const start = new Date(settings.registration_start_time);
    const end = new Date(settings.registration_end_time);
    if (now < start) return "UPCOMING";
    if (now > end) return "CLOSED";
    return "OPEN";
  };

  const isRegistrationOpen = () => getRegistrationStatus() === "OPEN";

  const getStudentIndividualEventCount = (studentId: string) => {
    return registrations.filter(r => {
      if (r.student_id !== studentId) return false;
      const comp = competitions.find(c => c.id === r.event_id);
      return comp?.type === "Individual" && comp?.category?.toLowerCase().trim() !== "general zone";
    }).length;
  };

  const handleRegister = async (studentId: string, eventId: string, groupSlot: number = 1) => {
    setError("");
    
    if (!isRegistrationOpen()) {
      setError("Registration is currently closed.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const comp = competitions.find(c => c.id === eventId);
    if (!comp) return;

    if (comp.type === "Individual" && comp.category?.toLowerCase().trim() !== "general zone") {
      const count = getStudentIndividualEventCount(studentId);
      if (count >= (settings?.max_individual_items || 4)) {
        setError(`This student has already reached the maximum limit of ${settings?.max_individual_items || 4} individual competitions.`);
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    if (comp.type === "Group") {
      const teamGroupCount = registrations.filter(r => r.event_id === eventId && r.team === teamName && r.group_slot === groupSlot).length;
      if (teamGroupCount >= (comp.max_participants || 2)) {
        setError(`Group ${groupSlot} for this event has reached the maximum limit of ${comp.max_participants || 2} participants.`);
        setTimeout(() => setError(""), 3000);
        return;
      }
      
      const alreadyInEvent = registrations.some(r => r.event_id === eventId && r.student_id === studentId);
      if (alreadyInEvent) {
        setError("This student is already registered for this event.");
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    setAdding(`${studentId}-${eventId}-${groupSlot}`);
    
    const { error: insertError } = await supabase
      .from("registrations")
      .insert({ student_id: studentId, event_id: eventId, team: teamName, group_slot: groupSlot });

    if (insertError) {
      console.error("Registration Insert Error Details:", insertError);
      setError(`DB Error: ${insertError.message} (Code: ${insertError.code})`);
      alert(`Registration failed!\n\nMessage: ${insertError.message}\nDetails: ${insertError.details}\nHint: ${insertError.hint}`);
      setTimeout(() => setError(""), 5000);
    } else {
      setRegistrations([...registrations, { student_id: studentId, event_id: eventId, team: teamName, group_slot: groupSlot }]);
    }
    
    setAdding(null);
  };

  const handleRemove = async (studentId: string, eventId: string) => {
    setError("");
    
    if (!isRegistrationOpen()) {
      setError("Registration is currently closed.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setAdding(`remove-${studentId}-${eventId}`);
    
    const { error: deleteError } = await supabase
      .from("registrations")
      .delete()
      .match({ student_id: studentId, event_id: eventId });

    if (deleteError) {
      console.error("Registration Delete Error Details:", deleteError);
      setError(`DB Error: ${deleteError.message}`);
      alert(`Removal failed!\n\nMessage: ${deleteError.message}`);
      setTimeout(() => setError(""), 5000);
    } else {
      setRegistrations(registrations.filter(r => !(r.student_id === studentId && r.event_id === eventId)));
    }
    
    setAdding(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text(`Team ${teamName} - Registrations`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let startY = 40;

    if (viewMode === "event") {
      // --- SECTION 1: Event-wise Summary (Grouped by Competition Category) ---
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Event-wise Summary", 14, startY);
      startY += 10;

      const compCategories = Array.from(new Set(competitions.map(c => c.category)));
      
      compCategories.forEach(category => {
        const catComps = competitions.filter(c => c.category === category);
        const tableData: any[] = [];
        
        catComps.forEach(comp => {
          const compRegs = registrations.filter(r => r.event_id === comp.id && r.team === teamName);
          if (compRegs.length === 0) return;
          
          if (comp.type === "Group") {
            const slots = Array.from(new Set(compRegs.map(r => r.group_slot || 1)));
            slots.sort((a, b) => a - b).forEach(slot => {
              const slotRegs = compRegs.filter(r => (r.group_slot || 1) === slot);
              const studentNames = slotRegs.map(r => {
                const student = students.find(s => s.id === r.student_id);
                return student ? `${student.name} (${student.class})` : r.student_id;
              }).join(", ");
              tableData.push([comp.name, `Group ${slot}`, studentNames]);
            });
          } else {
            const studentNames = compRegs.map(r => {
              const student = students.find(s => s.id === r.student_id);
              return student ? `${student.name} (${student.class})` : r.student_id;
            }).join(", ");
            tableData.push([comp.name, "Individual", studentNames]);
          }
        });

        if (tableData.length > 0) {
          if (startY > 250) { doc.addPage(); startY = 20; }
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(`${category}`, 14, startY);
          startY += 6;

          autoTable(doc, {
            startY: startY,
            head: [['Event Name', 'Type', 'Registered Students']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 9 }
          });
          startY = (doc as any).lastAutoTable.finalY + 15;
        }
      });
    } else {
      // --- SECTION 2: Student-wise Summary ---
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Participant-wise Summary", 14, startY);
      startY += 10;

      const studentCategories = Array.from(new Set(students.map(s => s.category)));

      studentCategories.forEach(category => {
        const catStudents = students.filter(s => s.category === category);
        
        const tableData: any[] = [];
        catStudents.forEach(student => {
          const studentRegs = registrations.filter(r => r.student_id === student.id);
          
          const zoneEvents = studentRegs.filter(r => {
            const c = competitions.find(comp => comp.id === r.event_id);
            return c && c.category !== "General Zone";
          }).map(r => {
            const c = competitions.find(comp => comp.id === r.event_id);
            const n = c ? c.name : r.event_id;
            return c?.type === "Group" ? `${n} (G${r.group_slot || 1})` : n;
          }).join(", ");

          const generalEvents = studentRegs.filter(r => {
            const c = competitions.find(comp => comp.id === r.event_id);
            return c && c.category === "General Zone";
          }).map(r => {
            const c = competitions.find(comp => comp.id === r.event_id);
            const n = c ? c.name : r.event_id;
            return c?.type === "Group" ? `${n} (G${r.group_slot || 1})` : n;
          }).join(", ");
          
          tableData.push([
            student.id,
            student.name,
            student.class,
            zoneEvents || "-",
            generalEvents || "-"
          ]);
        });

        if (tableData.length > 0) {
          if (startY > 250) { doc.addPage(); startY = 20; }
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(`${category} Students`, 14, startY);
          startY += 6;

          autoTable(doc, {
            startY: startY,
            head: [['ID', 'Name', 'Class', 'Zone Events', 'General Zone Events']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 }
          });
          startY = (doc as any).lastAutoTable.finalY + 15;
        }
      });
    }

    doc.save(`Team_${teamName}_${viewMode === "event" ? "Event" : "Participant"}_Registrations.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-10 w-10 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  const studentCategories = Array.from(new Set(students.map(s => s.category)));
  const compCategories = Array.from(new Set(competitions.map(c => c.category)));
  const isOpen = isRegistrationOpen();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/50 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Event Registrations</h1>
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mr-3">Status</span>
              {getRegistrationStatus() === "OPEN" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Unlock className="w-3 h-3 mr-1.5" /> OPEN
                </span>
              )}
              {getRegistrationStatus() === "UPCOMING" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  <Lock className="w-3 h-3 mr-1.5" /> UPCOMING
                </span>
              )}
              {getRegistrationStatus() === "CLOSED" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  <Lock className="w-3 h-3 mr-1.5" /> CLOSED
                </span>
              )}
            </div>
            
            {(getRegistrationStatus() === "OPEN" || getRegistrationStatus() === "UPCOMING") && (
              <div className="flex items-center gap-2 text-slate-900 border-l border-slate-200 pl-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mr-1">
                  {getRegistrationStatus() === "OPEN" ? "Closes in:" : "Opens in:"}
                </span>
                <div className="flex items-center gap-1">
                  <div className="bg-white px-2 py-1 rounded-md min-w-[2.5rem] text-center border border-slate-200">
                    <span className="font-black">{timeLeft.days}</span><span className="text-[10px] text-slate-400 ml-0.5">d</span>
                  </div>
                  <span className="font-black text-slate-600">:</span>
                  <div className="bg-white px-2 py-1 rounded-md min-w-[2.5rem] text-center border border-slate-200">
                    <span className="font-black">{timeLeft.hours}</span><span className="text-[10px] text-slate-400 ml-0.5">h</span>
                  </div>
                  <span className="font-black text-slate-600">:</span>
                  <div className="bg-white px-2 py-1 rounded-md min-w-[2.5rem] text-center border border-slate-200">
                    <span className="font-black">{timeLeft.minutes}</span><span className="text-[10px] text-slate-400 ml-0.5">m</span>
                  </div>
                  <span className="font-black text-slate-600">:</span>
                  <div className="bg-white px-2 py-1 rounded-md min-w-[2.5rem] text-center border border-slate-200">
                    <span className="font-black">{timeLeft.seconds}</span><span className="text-[10px] text-slate-400 ml-0.5">s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex shadow-inner">
            <button
              onClick={() => setViewMode("participant")}
              className={cn(
                "flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                viewMode === "participant" 
                  ? "bg-white text-blue-600 shadow-sm border border-blue-200" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Participant
            </button>
            <button
              onClick={() => setViewMode("event")}
              className={cn(
                "flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                viewMode === "event" 
                  ? "bg-white text-blue-600 shadow-sm border border-blue-200" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Event
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePDF}
            className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 bg-white/60 backdrop-blur-xl p-4 sm:p-5 rounded-[1.5rem] border border-white/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by name..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-medium text-slate-700 text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full sm:w-auto">
          <select
            value={globalType}
            onChange={(e) => setGlobalType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-medium text-slate-700 text-sm cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
          </select>
          <select
            value={globalZone}
            onChange={(e) => setGlobalZone(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-medium text-slate-700 text-sm cursor-pointer"
          >
            <option value="All">All Zones</option>
            {settings?.zone_config && Object.keys(settings.zone_config).map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
            <option value="General Zone">General Zone</option>
          </select>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="flex items-center bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === "participant" ? (
        <div className="space-y-8">
          {studentCategories.map(category => {
            const catStudents = students.filter(s => s.category === category);
            const catCompetitions = competitions.filter(c => 
              (c.category?.toLowerCase().trim() === (category as string)?.toLowerCase().trim() || 
              c.category?.toLowerCase().trim() === "general zone") &&
              c.name.toLowerCase().includes(globalSearch.toLowerCase()) &&
              (globalType === "All" || c.type === globalType) &&
              (globalZone === "All" || c.category === globalZone)
            );
            
            const isFilterActive = globalSearch !== "" || globalType !== "All" || globalZone !== "All";
            const validStudents = catStudents.filter(student => {
              if (isFilterActive && catCompetitions.length === 0) return false;
              return true;
            });

            if (validStudents.length === 0) return null;

            return (
              <motion.div variants={itemVariants} key={category as string} className="glass-card rounded-[2rem] overflow-hidden">
                <div className="px-8 py-5 border-b border-white/50 bg-white/40">
                  <h2 className="text-xl font-black text-slate-900">{category as string}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {validStudents.map(student => {
                    const studentRegs = registrations.filter(r => r.student_id === student.id);
                    const indCount = getStudentIndividualEventCount(student.id);
                    const isMaxedOut = indCount >= (settings?.max_individual_items || 4);
                    
                    const matchingRegisteredComps = catCompetitions.filter(comp => studentRegs.some(r => r.event_id === comp.id));
                    
                    return (
                      <div key={student.id} className="p-8 hover:bg-white/40 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-1">
                              <span className="bg-slate-100 px-2 py-0.5 rounded mr-2">ID: {student.id}</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded">Class {student.class}</span>
                            </p>
                          </div>
                          <div className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-3">Individual Events</span>
                            <span className={cn(
                              "font-black text-lg",
                              isMaxedOut ? "text-red-500" : "text-blue-600"
                            )}>{indCount}/{settings?.max_individual_items || 4}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {matchingRegisteredComps.map(comp => {
                            const studentReg = studentRegs.find(r => r.event_id === comp.id)!;
                            const isGrp = comp.type === "Group";
                            const isLoadingAny = adding === `remove-${student.id}-${comp.id}`;
                            
                            return (
                              <div key={comp.id} className="relative flex items-center justify-between p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 shadow-sm transition-all">
                                <div className="pr-2 flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate mb-1 text-emerald-900" title={comp.name}>{comp.name}</p>
                                  <span className={cn(
                                    "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    isGrp ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                                  )}>
                                    {isGrp ? `Group ${studentReg.group_slot || 1}` : "Individual"}
                                  </span>
                                </div>
                                
                                <button
                                  onClick={() => handleRemove(student.id, comp.id)}
                                  disabled={!isOpen || isLoadingAny}
                                  className="flex-shrink-0 p-2 text-emerald-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 group"
                                  title="Remove registration"
                                >
                                  {isLoadingAny ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                      <Check className="h-5 w-5 block group-hover:hidden" />
                                      <Trash2 className="h-5 w-5 hidden group-hover:block" />
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}

                          <button
                            onClick={() => {
                              setModalStudent(student);
                              setEventSearchQuery("");
                              setEventTypeFilter("All");
                            }}
                            className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all text-slate-400 hover:text-fuchsia-600 font-bold text-sm min-h-[76px]"
                          >
                            <Plus className="w-5 h-5 mr-2" /> Add Event
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
           {compCategories.map(category => {
            const catCompetitions = competitions.filter(c => 
              c.category === category &&
              c.name.toLowerCase().includes(globalSearch.toLowerCase()) &&
              (globalType === "All" || c.type === globalType) &&
              (globalZone === "All" || c.category === globalZone)
            );
            
            if (catCompetitions.length === 0) return null;

            const catStudents = students.filter(s => 
              s.category?.toLowerCase().trim() === (category as string)?.toLowerCase().trim() || 
              (category as string)?.toLowerCase().trim() === "general zone"
            );
            
            return (
              <motion.div variants={itemVariants} key={category as string} className="glass-card rounded-[2rem] overflow-hidden">
                <div className="px-8 py-5 border-b border-white/50 bg-white/40">
                  <h2 className="text-xl font-black text-slate-900">{category as string}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {catCompetitions.map(comp => {
                    const isGrp = comp.type === "Group";
                    const registeredRegs = registrations.filter(r => r.event_id === comp.id);
                    
                    return (
                      <div key={comp.id} className="p-8 hover:bg-white/40 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{comp.name}</h3>
                            <span className={cn(
                              "inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                              isGrp ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {comp.type}
                            </span>
                          </div>
                          
                          {isGrp ? (
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                              {Array.from({ length: comp.max_groups_per_team || 1 }, (_, i) => i + 1).map(slot => {
                                const count = registeredRegs.filter(r => r.team === teamName && r.group_slot === slot).length;
                                return (
                                  <div key={slot} className="flex flex-col items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Group {slot}</span>
                                    <span className={cn("font-black text-sm", count >= (comp.max_participants || 2) ? "text-purple-600" : "text-slate-700")}>
                                      {count}/{comp.max_participants || 2}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-100">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-3">Registered</span>
                              <span className="font-black text-lg text-blue-600">{registeredRegs.length}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {catStudents.map(student => {
                            const studentReg = registeredRegs.find(r => r.student_id === student.id);
                            const isRegistered = !!studentReg;
                            const isLoadingAny = adding?.startsWith(`${student.id}-${comp.id}`) || adding === `remove-${student.id}-${comp.id}`;
                            const indCount = getStudentIndividualEventCount(student.id);
                            const isMaxedOut = indCount >= (settings?.max_individual_items || 4);
                            
                            return (
                              <div key={student.id} className={cn(
                                "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                isRegistered 
                                  ? "border-emerald-200 bg-emerald-50/50 shadow-sm" 
                                  : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                              )}>
                                <div className="pr-3 flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm font-bold truncate mb-1",
                                    isRegistered ? "text-emerald-900" : "text-slate-800"
                                  )} title={student.name}>{student.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Class {student.class}
                                  </p>
                                </div>
                                
                                {isGrp ? (
                                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                                    {Array.from({ length: comp.max_groups_per_team || 1 }, (_, i) => i + 1).map(slot => {
                                      const isRegThisSlot = isRegistered && studentReg.group_slot === slot;
                                      const isRegOtherSlot = isRegistered && studentReg.group_slot !== slot;
                                      const slotCount = registeredRegs.filter(r => r.team === teamName && r.group_slot === slot).length;
                                      const isFull = slotCount >= (comp.max_participants || 2);
                                      const isAddingSlot = adding === `${student.id}-${comp.id}-${slot}`;
                                      const isRemoving = adding === `remove-${student.id}-${comp.id}` && isRegThisSlot;

                                      if (isRegThisSlot) {
                                        return (
                                          <button
                                            key={slot}
                                            onClick={() => handleRemove(student.id, comp.id)}
                                            disabled={!isOpen || isLoadingAny}
                                            className="flex items-center justify-center px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-700 rounded transition-colors disabled:opacity-50"
                                            title="Remove from group"
                                          >
                                            {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : `Group ${slot} (✓)`}
                                          </button>
                                        );
                                      }

                                      return (
                                        <button
                                          key={slot}
                                          onClick={() => handleRegister(student.id, comp.id, slot)}
                                          disabled={!isOpen || isLoadingAny || isRegOtherSlot || isFull}
                                          className="flex items-center justify-center px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors disabled:opacity-50"
                                          title={isFull ? `Group ${slot} is full` : isRegOtherSlot ? "Already in another group" : `Add to Group ${slot}`}
                                        >
                                          {isAddingSlot ? <Loader2 className="w-3 h-3 animate-spin" /> : `+ G${slot}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <>
                                    {isRegistered ? (
                                      <button
                                        onClick={() => handleRemove(student.id, comp.id)}
                                        disabled={!isOpen || isLoadingAny}
                                        className="flex-shrink-0 p-2 text-emerald-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 group"
                                      >
                                        {isLoadingAny ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                          <>
                                            <Check className="h-5 w-5 block group-hover:hidden" />
                                            <Trash2 className="h-5 w-5 hidden group-hover:block" />
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRegister(student.id, comp.id, 1)}
                                        disabled={!isOpen || isLoadingAny || (comp.category?.toLowerCase().trim() !== "general zone" && isMaxedOut)}
                                        className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {isLoadingAny ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {modalStudent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-[95%] max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Assign Events</h3>
                  <p className="text-sm font-semibold text-slate-400 mt-1">
                    Student: <span className="text-slate-700">{modalStudent.name}</span> • ID: {modalStudent.id}
                  </p>
                </div>
                <button onClick={() => setModalStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search events by name..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:bg-slate-50 transition-all font-medium text-slate-700"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      <option value="Individual">Individual</option>
                      <option value="Group">Group</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div>
                  {(() => {
                    const studentRegs = registrations.filter(r => r.student_id === modalStudent.id);
                    const indCount = getStudentIndividualEventCount(modalStudent.id);
                    const isMaxedOut = indCount >= (settings?.max_individual_items || 4);
                    
                    const filteredComps = competitions.filter(c => 
                      c.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) &&
                      (eventTypeFilter === "All" || c.type === eventTypeFilter)
                    );

                    const zoneComps = filteredComps.filter(c => 
                      c.category?.toLowerCase().trim() === modalStudent.category?.toLowerCase().trim() &&
                      c.category?.toLowerCase().trim() !== "general zone"
                    );

                    const generalComps = filteredComps.filter(c => 
                      c.category?.toLowerCase().trim() === "general zone"
                    );

                    if (zoneComps.length === 0 && generalComps.length === 0) {
                      return <div className="py-8 text-center text-slate-400 font-medium w-full">No events found.</div>;
                    }

                    const renderCompCard = (comp: any) => {
                      const studentReg = studentRegs.find(r => r.event_id === comp.id);
                      const isRegistered = !!studentReg;
                      const isGrp = comp.type === "Group";
                      const isLoadingAny = adding?.startsWith(`${modalStudent.id}-${comp.id}`) || adding === `remove-${modalStudent.id}-${comp.id}`;
                      
                      return (
                        <div key={comp.id} className={cn(
                          "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all bg-white",
                          isRegistered ? "border-emerald-200 shadow-sm" : "border-slate-100 hover:border-blue-200 hover:shadow-sm"
                        )}>
                          <div className="pr-2 flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold truncate mb-1",
                              isRegistered ? "text-emerald-900" : "text-slate-800"
                            )} title={comp.name}>{comp.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                isGrp ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-400"
                              )}>
                                {isGrp ? "Group" : "Individual"}
                              </span>
                              {comp.rules && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setRuleModal({ name: comp.name, rules: comp.rules }); }} 
                                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-full transition-colors flex items-center justify-center" 
                                  title="View Rules"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isGrp ? (
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              {Array.from({ length: comp.max_groups_per_team || 1 }, (_, i) => i + 1).map(slot => {
                                const isRegThisSlot = isRegistered && studentReg.group_slot === slot;
                                const isRegOtherSlot = isRegistered && studentReg.group_slot !== slot;
                                const slotCount = registrations.filter(r => r.event_id === comp.id && r.team === teamName && r.group_slot === slot).length;
                                const isFull = slotCount >= (comp.max_participants || 2);
                                const isAddingSlot = adding === `${modalStudent.id}-${comp.id}-${slot}`;
                                const isRemoving = adding === `remove-${modalStudent.id}-${comp.id}` && isRegThisSlot;

                                if (isRegThisSlot) {
                                  return (
                                    <button
                                      key={slot}
                                      onClick={() => handleRemove(modalStudent.id, comp.id)}
                                      disabled={!isOpen || isLoadingAny}
                                      className="flex items-center justify-center px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-700 rounded transition-colors disabled:opacity-50"
                                      title="Remove from group"
                                    >
                                      {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : `Group ${slot} (✓)`}
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={slot}
                                    onClick={() => handleRegister(modalStudent.id, comp.id, slot)}
                                    disabled={!isOpen || isLoadingAny || isRegOtherSlot || isFull}
                                    className="flex items-center justify-center px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors disabled:opacity-50"
                                    title={isFull ? `Group ${slot} is full` : isRegOtherSlot ? "Already in another group" : `Add to Group ${slot}`}
                                  >
                                    {isAddingSlot ? <Loader2 className="w-3 h-3 animate-spin" /> : `+ G${slot} (${slotCount}/${comp.max_participants || 2})`}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <>
                              {isRegistered ? (
                                <button
                                  onClick={() => handleRemove(modalStudent.id, comp.id)}
                                  disabled={!isOpen || isLoadingAny}
                                  className="flex-shrink-0 p-2 text-emerald-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 group"
                                  title="Remove registration"
                                >
                                  {isLoadingAny ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                      <Check className="h-5 w-5 block group-hover:hidden" />
                                      <Trash2 className="h-5 w-5 hidden group-hover:block" />
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRegister(modalStudent.id, comp.id, 1)}
                                  disabled={!isOpen || isLoadingAny || (comp.category?.toLowerCase().trim() !== "general zone" && isMaxedOut)}
                                  className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                  title={comp.category?.toLowerCase().trim() !== "general zone" && isMaxedOut ? "Max individual events reached" : "Add registration"}
                                >
                                  {isLoadingAny ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div className="w-full flex flex-col space-y-8">
                        {zoneComps.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                              Events for {modalStudent.category || "Unassigned"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {zoneComps.map(renderCompCard)}
                            </div>
                          </div>
                        )}
                        
                        {generalComps.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 pt-4 border-t border-slate-200">
                              General Zone Events
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {generalComps.map(renderCompCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ruleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setRuleModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-[95%] max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-500" />
                  {ruleModal.name} - Rules
                </h3>
                <button onClick={() => setRuleModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {ruleModal.rules}
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setRuleModal(null)}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
