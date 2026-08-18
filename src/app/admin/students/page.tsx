"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2, Loader2, Users, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          const requiredKeys = ["id", "name", "class", "team", "category"];
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
            return {
              id: cleanRow.id,
              name: cleanRow.name,
              class: cleanRow.class,
              team: cleanRow.team,
              category: cleanRow.category,
            };
          });

          const { error: insertError } = await supabase
            .from("students")
            .upsert(cleanData, { onConflict: "id" });

          if (insertError) throw insertError;

          setSuccess(`Successfully uploaded ${cleanData.length} students.`);
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
          <p className="text-slate-500 font-medium">Bulk import your student participant database via CSV.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden p-8 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Batch Upload</h2>
            <p className="text-sm text-slate-500 font-medium">
              Upload a CSV file with the following exact columns: 
              <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded ml-1 font-mono text-xs">id, name, class, team, category</code>
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
          <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[2rem] cursor-pointer bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-blue-400 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "group"}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
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
    </motion.div>
  );
}
