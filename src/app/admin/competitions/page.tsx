"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Upload, AlertCircle, CheckCircle2, Loader2, Edit3, X, Save, ClipboardList, Download, Users, Trash2, Plus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [competitions, setCompetitions] = useState<any[]>([]);
  
  const [editingComp, setEditingComp] = useState<any | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newComp, setNewComp] = useState({
    name: "",
    category: "Minor Zone",
    type: "Individual",
    max_participants: 2,
    max_groups_per_team: 1,
    rules: ""
  });

  const [savingComp, setSavingComp] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const zones = ["Minor Zone", "Mid Zone", "Premier Zone", "General Zone"];

  const exportParticipantsPDF = async () => {
    setIsExporting(true);
    setError("");

    try {
      const { data: regsData, error: regsError } = await supabase
        .from("registrations")
        .select(`
          event_id,
          group_slot,
          team,
          students ( name, class )
        `);
      
      if (regsError) throw regsError;

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Fest Participants by Competition", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      let startY = 40;
      const allZones = [...new Set(competitions.map(c => c.category))].sort();

      for (const zone of allZones) {
        const zoneComps = competitions.filter(c => c.category === zone);
        
        for (const comp of zoneComps) {
          const compRegs = regsData.filter(r => r.event_id === comp.id);
          
          if (compRegs.length === 0) continue;

          compRegs.sort((a, b) => a.team.localeCompare(b.team) || (a.group_slot || 1) - (b.group_slot || 1));

          if (startY > 250) {
            doc.addPage();
            startY = 20;
          }

          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(`${comp.name} - ${zone} (${comp.type})`, 14, startY);
          startY += 6;

          const tableData = compRegs.map(r => {
            const student: any = (Array.isArray(r.students) ? r.students[0] : r.students) || { name: 'Unknown', class: 'Unknown' };
            return [
              student.name,
              r.team,
              student.class,
              comp.type === 'Group' ? `Group ${r.group_slot || 1}` : 'N/A'
            ];
          });

          autoTable(doc, {
            startY: startY,
            head: [['Student Name', 'Team', 'Class', 'Group']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [192, 38, 211] },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 }
          });

          startY = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      doc.save("Fest_Participants_List.pdf");
    } catch (err: any) {
      setError("Failed to export PDF: " + err.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this competition?")) return;
    setDeletingId(id);
    const { error: deleteError } = await supabase.from("competitions").delete().eq("id", id);
    if (deleteError) {
      setError("Failed to delete competition: " + deleteError.message);
      setTimeout(() => setError(""), 3000);
    } else {
      setCompetitions(competitions.filter((c) => c.id !== id));
      setSuccess("Competition deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    }
    setDeletingId(null);
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    
    if (data) setCompetitions(data);
    setFetching(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          
          if (rows.length === 0) throw new Error("CSV file is empty");
          const requiredKeys = ["zone", "competition_name"];
          const keys = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
          const missingKeys = requiredKeys.filter(k => !keys.includes(k));
          
          if (missingKeys.length > 0) {
            throw new Error(`Missing required columns: ${missingKeys.join(", ")}`);
          }

          const cleanData = rows.map(row => {
            const cleanRow: any = {};
            for (const key in row) {
              cleanRow[key.toLowerCase().trim()] = row[key];
            }
            
            const name = cleanRow.competition_name;
            const category = cleanRow.zone;
            const generatedId = `${category}-${name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            return {
              id: generatedId,
              name: name,
              category: category,
              type: "Individual", // Default type since it's not in CSV
              max_participants: 1, // Default to 1 for Individual
              max_groups_per_team: 1,
              rules: cleanRow.rules || null,
            };
          });

          const { error: insertError } = await supabase
            .from("competitions")
            .upsert(cleanData, { onConflict: "id" });

          if (insertError) throw insertError;

          setSuccess(`Successfully uploaded ${cleanData.length} competitions.`);
          fetchCompetitions();
        } catch (err: any) {
          setError(err.message || "Failed to process CSV file.");
        } finally {
          setLoading(false);
          e.target.value = '';
        }
      },
      error: (err) => {
        setError("Failed to parse CSV: " + err.message);
        setLoading(false);
        e.target.value = '';
      }
    });
  };

  const handleSaveEdit = async () => {
    setSavingComp(true);
    const finalMax = editingComp.type === "Individual" ? 1 : Math.max(2, editingComp.max_participants);
    const finalMaxGroups = editingComp.type === "Individual" ? 1 : Math.max(1, editingComp.max_groups_per_team || 1);
    
    const { error: updateError } = await supabase
      .from("competitions")
      .update({ 
        name: editingComp.name,
        category: editingComp.category,
        type: editingComp.type,
        max_participants: finalMax,
        max_groups_per_team: finalMaxGroups,
        rules: editingComp.rules
      })
      .eq("id", editingComp.id);
      
    if (!updateError) {
      setCompetitions(competitions.map(c => c.id === editingComp.id ? { 
        ...c, 
        name: editingComp.name,
        category: editingComp.category,
        type: editingComp.type, 
        max_participants: finalMax, 
        max_groups_per_team: finalMaxGroups,
        rules: editingComp.rules 
      } : c));
      setEditingComp(null);
    } else {
      setError("Failed to update competition: " + updateError.message);
    }
    setTimeout(() => setError(""), 3000);
    setSavingComp(false);
  };

  const handleSaveNew = async () => {
    if (!newComp.name.trim()) {
      setError("Competition name is required.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSavingComp(true);
    
    const generatedId = `${newComp.category}-${newComp.name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const finalMax = newComp.type === "Individual" ? 1 : Math.max(2, newComp.max_participants);
    const finalMaxGroups = newComp.type === "Individual" ? 1 : Math.max(1, newComp.max_groups_per_team || 1);
    
    const newRecord = {
      id: generatedId,
      name: newComp.name,
      category: newComp.category,
      type: newComp.type,
      max_participants: finalMax,
      max_groups_per_team: finalMaxGroups,
      rules: newComp.rules
    };

    const { error: insertError } = await supabase
      .from("competitions")
      .insert(newRecord);
      
    if (!insertError) {
      setCompetitions([...competitions, newRecord].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setIsAddingNew(false);
      setNewComp({
        name: "",
        category: "Minor Zone",
        type: "Individual",
        max_participants: 2,
        max_groups_per_team: 1,
        rules: ""
      });
      setSuccess("Competition added successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError("Failed to add competition: " + insertError.message);
      setTimeout(() => setError(""), 3000);
    }
    setSavingComp(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 relative">
      <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-2xl shadow-sm">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Competitions</h1>
          <p className="text-slate-500 font-medium">Manage events, categories, and competition rules.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden p-4 md:p-8 sm:p-10 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Add Competitions</h2>
            <p className="text-sm text-slate-500 font-medium">
              Upload a CSV file or add a competition manually.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportParticipantsPDF}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Export PDF
            </motion.button>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#" 
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Template
            </motion.a>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center px-4 py-2 bg-fuchsia-600 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Manual Add
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && !editingComp && !isAddingNew && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-center bg-red-50 text-red-600 p-4 rounded-xl border border-red-100"
            >
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-center bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100"
            >
              <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm font-semibold">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center w-full">
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-[2rem] cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-50 hover:border-fuchsia-400 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "group"}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Loader2 className="w-10 h-10 mb-3 text-fuchsia-500" />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ y: -5 }}
                  className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:shadow-md transition-shadow"
                >
                  <Upload className="w-6 h-6 text-fuchsia-500" />
                </motion.div>
              )}
              <p className="text-sm font-bold text-slate-700">
                {loading ? "Processing CSV..." : "Click to upload CSV"}
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Event Registry</h2>
        </div>
        
        {fetching ? (
          <div className="p-12 flex justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Loader2 className="h-8 w-8 text-fuchsia-500" />
            </motion.div>
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No competitions found. Please upload a CSV or manually add one first.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Name</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Type & Max</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Rules</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {competitions.map((c, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={c.id} 
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-8 py-5 text-slate-900 font-bold">{c.name}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-start space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${c.type === 'Group' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {c.type === 'Group' ? <Users className="w-3 h-3 mr-1" /> : null}
                          {c.type}
                        </span>
                        <span className="text-xs font-medium text-slate-500 ml-1">
                          Max size: {c.max_participants || 1}
                        </span>
                        {c.type === 'Group' && (
                          <span className="text-xs font-medium text-slate-500 ml-1">
                            Max groups: {c.max_groups_per_team || 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed text-xs max-w-xs">{c.rules || <span className="text-slate-400 italic">No rules specified</span>}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingComp({...c})}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Competition"
                        >
                          <Edit3 className="h-4 w-4" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Competition"
                        >
                          {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4" />}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingComp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingComp(null)}
              className="fixed inset-0 bg-white/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Edit Competition</h3>
                <button onClick={() => setEditingComp(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={editingComp.name}
                    onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Zone / Category</label>
                    <select
                      value={editingComp.category}
                      onChange={(e) => setEditingComp({ ...editingComp, category: e.target.value })}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                    >
                      {zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select
                      value={editingComp.type}
                      onChange={(e) => setEditingComp({ ...editingComp, type: e.target.value })}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Group">Group</option>
                    </select>
                  </div>
                  {editingComp.type === "Group" && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Max Participants (Per Group)</label>
                        <input
                          type="number"
                          min="2"
                          value={editingComp.max_participants || 2}
                          onChange={(e) => setEditingComp({ ...editingComp, max_participants: parseInt(e.target.value) })}
                          className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Max Groups (Per Team)</label>
                        <input
                          type="number"
                          min="1"
                          value={editingComp.max_groups_per_team || 1}
                          onChange={(e) => setEditingComp({ ...editingComp, max_groups_per_team: parseInt(e.target.value) })}
                          className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rules (Optional)</label>
                  <textarea
                    rows={4}
                    value={editingComp.rules || ""}
                    onChange={(e) => setEditingComp({ ...editingComp, rules: e.target.value })}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none resize-none"
                    placeholder="Enter competition rules here..."
                  />
                </div>

                {error && (
                  <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  disabled={savingComp}
                  className="flex items-center px-6 py-2.5 bg-fuchsia-600 text-white font-bold rounded-xl shadow-sm hover:bg-fuchsia-700 focus:ring-4 focus:ring-fuchsia-100 disabled:opacity-50 transition-all"
                >
                  {savingComp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add New Modal */}
      <AnimatePresence>
        {isAddingNew && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingNew(false)}
              className="fixed inset-0 bg-white/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Add New Competition</h3>
                <button onClick={() => setIsAddingNew(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={newComp.name}
                    onChange={(e) => setNewComp({...newComp, name: e.target.value})}
                    placeholder="e.g. Essay Writing"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Zone / Category</label>
                    <select
                      value={newComp.category}
                      onChange={(e) => setNewComp({ ...newComp, category: e.target.value })}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                    >
                      {zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select
                      value={newComp.type}
                      onChange={(e) => setNewComp({ ...newComp, type: e.target.value })}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Group">Group</option>
                    </select>
                  </div>

                  {newComp.type === "Group" && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Max Participants (Per Group)</label>
                        <input
                          type="number"
                          min="2"
                          value={newComp.max_participants || 2}
                          onChange={(e) => setNewComp({ ...newComp, max_participants: parseInt(e.target.value) })}
                          className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Max Groups (Per Team)</label>
                        <input
                          type="number"
                          min="1"
                          value={newComp.max_groups_per_team || 1}
                          onChange={(e) => setNewComp({ ...newComp, max_groups_per_team: parseInt(e.target.value) })}
                          className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rules (Optional)</label>
                  <textarea
                    rows={4}
                    value={newComp.rules || ""}
                    onChange={(e) => setNewComp({ ...newComp, rules: e.target.value })}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 sm:text-sm transition-all text-slate-900 outline-none resize-none"
                    placeholder="Enter competition rules here..."
                  />
                </div>

                {error && (
                  <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveNew}
                  disabled={savingComp}
                  className="flex items-center px-6 py-2.5 bg-fuchsia-600 text-white font-bold rounded-xl shadow-sm hover:bg-fuchsia-700 focus:ring-4 focus:ring-fuchsia-100 disabled:opacity-50 transition-all"
                >
                  {savingComp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Competition
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
