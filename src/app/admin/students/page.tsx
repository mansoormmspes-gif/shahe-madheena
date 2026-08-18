"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2, Loader2, Users, Download, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getZoneForClass } from "@/lib/zones";

export default function StudentsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [zoneConfig, setZoneConfig] = useState<any>(null);

  // Manual Add State
  const [manualStudent, setManualStudent] = useState({ id: "", name: "", class: "", team: "" });
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("zone_config").eq("id", 1).single();
      if (data) {
        setZoneConfig(data.zone_config);
      }
    };
    fetchSettings();
  }, []);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setError("");
    setSuccess("");

    if (!manualStudent.id || !manualStudent.name || !manualStudent.class || !manualStudent.team) {
      setError("Please fill in all fields.");
      setManualLoading(false);
      return;
    }

    try {
      const category = getZoneForClass(manualStudent.class, zoneConfig);
      
      const { error: insertError } = await supabase
        .from("students")
        .upsert([{
          id: manualStudent.id,
          name: manualStudent.name,
          class: manualStudent.class,
          team: manualStudent.team,
          category: category
        }], { onConflict: "id" });

      if (insertError) throw insertError;

      setSuccess(`Successfully added ${manualStudent.name} to ${category}.`);
      setManualStudent({ id: "", name: "", class: "", team: "" });
    } catch (err: any) {
      setError(err.message || "Failed to add student.");
    } finally {
      setManualLoading(false);
    }
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
          const requiredKeys = ["id", "name", "class", "team"];
          const keys = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
          const missingKeys = requiredKeys.filter(k => !keys.includes(k));
          
          if (missingKeys.length > 0) {
            throw new Error(`Missing required columns: ${missingKeys.join(", ")}. Note: 'category' is now automatically calculated from 'class'.`);
          }

          const cleanData = rows.map(row => {
            const cleanRow: any = {};
            for (const key in row) {
              cleanRow[key.toLowerCase().trim()] = row[key];
            }
            
            // Automatically calculate the zone category
            const category = getZoneForClass(cleanRow.class, zoneConfig);

            return {
              id: cleanRow.id,
              name: cleanRow.name,
              class: cleanRow.class,
              team: cleanRow.team,
              category: category,
            };
          });

          const { error: insertError } = await supabase
            .from("students")
            .upsert(cleanData, { onConflict: "id" });

          if (insertError) throw insertError;

          setSuccess(`Successfully uploaded ${cleanData.length} students. Zones were auto-assigned.`);
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
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-slate-500 font-medium">Add students manually or import via CSV. Zones are auto-assigned based on Class.</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm"
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
            className="flex items-center bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 shadow-sm"
          >
            <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-semibold">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual Add Form */}
        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden p-8 sm:p-10">
          <div className="flex items-center mb-8 pb-6 border-b border-slate-100">
            <UserPlus className="w-6 h-6 text-indigo-500 mr-3" />
            <h2 className="text-xl font-bold text-slate-900">Manual Entry</h2>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Admission No (ID)</label>
                <input
                  type="text"
                  required
                  value={manualStudent.id}
                  onChange={(e) => setManualStudent({...manualStudent, id: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  placeholder="e.g. 101"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name</label>
                <input
                  type="text"
                  required
                  value={manualStudent.name}
                  onChange={(e) => setManualStudent({...manualStudent, name: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class (For Auto Zone)</label>
                <input
                  type="text"
                  required
                  value={manualStudent.class}
                  onChange={(e) => setManualStudent({...manualStudent, class: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Team</label>
                <select
                  required
                  value={manualStudent.team}
                  onChange={(e) => setManualStudent({...manualStudent, team: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                >
                  <option value="" disabled>Select Team</option>
                  <option value="ZAMAAN">ZAMAAN</option>
                  <option value="ZAMEEN">ZAMEEN</option>
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={manualLoading}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm shadow-indigo-600/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all mt-4"
            >
              {manualLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <UserPlus className="h-5 w-5 mr-2" />}
              Add Student
            </motion.button>
          </form>
        </motion.div>

        {/* CSV Upload */}
        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Batch Upload</h2>
              <p className="text-sm text-slate-500 font-medium">
                Columns: <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs">id, name, class, team</code> (category is auto-assigned)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <label className={`flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed rounded-[2rem] cursor-pointer bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-blue-400 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "group"}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 className="w-12 h-12 mb-4 text-blue-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:shadow-md transition-shadow"
                  >
                    <Upload className="w-8 h-8 text-blue-500" />
                  </motion.div>
                )}
                <p className="mb-2 text-lg font-bold text-slate-700">
                  {loading ? "Processing CSV..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm font-medium text-slate-400">CSV file containing student records</p>
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
      </div>
    </motion.div>
  );
}
