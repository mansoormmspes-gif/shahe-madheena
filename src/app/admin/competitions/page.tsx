"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2, Loader2, Edit3, X, Save, ClipboardList, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRules, setEditRules] = useState("");

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

  const handleSaveRules = async (id: string) => {
    const { error } = await supabase
      .from("competitions")
      .update({ rules: editRules })
      .eq("id", id);
      
    if (!error) {
      setCompetitions(competitions.map(c => c.id === id ? { ...c, rules: editRules } : c));
      setEditingId(null);
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-2xl shadow-sm">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Competitions</h1>
          <p className="text-slate-500 font-medium">Manage events, categories, and competition rules.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden p-8 sm:p-10 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Batch Upload (CSV)</h2>
            <p className="text-sm text-slate-500 font-medium">
              Upload a CSV file with columns: 
              <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded ml-1 font-mono text-xs">zone, competition_name, rules (optional)</code>
            </p>
          </div>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#" 
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Template
          </motion.a>
        </div>

        <AnimatePresence mode="wait">
          {error && (
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
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-[2rem] cursor-pointer bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-fuchsia-400 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "group"}`}>
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
        <div className="px-8 py-6 border-b border-slate-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-900">Event Rules Editor</h2>
        </div>
        
        {fetching ? (
          <div className="p-12 flex justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Loader2 className="h-8 w-8 text-fuchsia-500" />
            </motion.div>
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No competitions found. Please upload a CSV first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">ID</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Name</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Type</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs min-w-[300px]">Rules</th>
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
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5 font-bold text-slate-900">{c.id}</td>
                    <td className="px-8 py-5 text-slate-700 font-medium">{c.name}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {editingId === c.id ? (
                        <textarea
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 outline-none transition-all resize-none text-slate-900"
                          rows={3}
                          value={editRules}
                          onChange={(e) => setEditRules(e.target.value)}
                          placeholder="Enter rules for this event..."
                        />
                      ) : (
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">{c.rules || <span className="text-slate-400 italic">No rules specified</span>}</p>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {editingId === c.id ? (
                        <div className="flex justify-end space-x-2">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingId(null)} 
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSaveRules(c.id)} 
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditingId(c.id); setEditRules(c.rules || ""); }}
                          className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
