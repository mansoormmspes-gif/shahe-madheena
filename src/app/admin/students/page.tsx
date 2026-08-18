"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { 
  AlertCircle, CheckCircle2, Loader2, Users, Search, 
  Trash2, Plus, X, Upload, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualStudent, setManualStudent] = useState({ id: "", name: "", class: "", team: "", zone: "" });
  const [manualLoading, setManualLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("id", { ascending: true });
    
    if (error) {
      setError(error.message);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      setError("Failed to delete student: " + error.message);
    } else {
      setSuccess("Student deleted successfully.");
      setStudents(students.filter(s => s.id !== id));
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setError("");
    setSuccess("");

    if (!manualStudent.id || !manualStudent.name || !manualStudent.class || !manualStudent.team || !manualStudent.zone) {
      setError("Please fill in all fields.");
      setManualLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from("students")
        .upsert([{
          id: manualStudent.id,
          name: manualStudent.name,
          class: manualStudent.class,
          team: manualStudent.team,
          category: manualStudent.zone
        }], { onConflict: "id" });

      if (insertError) throw insertError;

      setSuccess(`Successfully added ${manualStudent.name}.`);
      setManualStudent({ id: "", name: "", class: "", team: "", zone: "" });
      setIsModalOpen(false);
      fetchStudents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add student.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    setError("");
    setSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          if (rows.length === 0) throw new Error("CSV file is empty");
          
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
              category: cleanRow.category || cleanRow.zone || "",
            };
          });

          const { error: insertError } = await supabase
            .from("students")
            .upsert(cleanData, { onConflict: "id" });

          if (insertError) throw insertError;

          setSuccess(`Successfully uploaded ${cleanData.length} students.`);
          fetchStudents();
          setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
          setError(err.message || "Failed to process CSV file.");
        } finally {
          setCsvLoading(false);
          e.target.value = '';
        }
      },
      error: (err) => {
        setError("Failed to parse CSV: " + err.message);
        setCsvLoading(false);
        e.target.value = '';
      }
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === "All" || student.team === teamFilter;
    const matchesZone = zoneFilter === "All" || student.category === zoneFilter;
    return matchesSearch && matchesTeam && matchesZone;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Students</h1>
            <p className="text-slate-500 font-medium">Manage all participants across all teams.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700">
            {csvLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload CSV
            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={csvLoading} />
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors text-sm font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Add
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 shadow-sm"
          >
            <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-semibold">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium min-w-[120px]"
            >
              <option value="All">All Teams</option>
              <option value="ZAMAAN">ZAMAAN</option>
              <option value="ZAMEEN">ZAMEEN</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium min-w-[120px]"
            >
              <option value="All">All Zones</option>
              <option value="Sub Junior">Sub Junior</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Super Senior">Super Senior</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-900 font-bold mb-1">No students found</p>
                    <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        student.team === 'ZAMAAN' ? 'bg-indigo-100 text-indigo-800' : 
                        student.team === 'ZAMEEN' ? 'bg-emerald-100 text-emerald-800' : 
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {student.team}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                      {student.category || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleManualAdd} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ID / Admission No</label>
                  <input
                    type="text" required value={manualStudent.id}
                    onChange={(e) => setManualStudent({...manualStudent, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                  <input
                    type="text" required value={manualStudent.name}
                    onChange={(e) => setManualStudent({...manualStudent, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="Student Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class</label>
                    <input
                      type="text" required value={manualStudent.class}
                      onChange={(e) => setManualStudent({...manualStudent, class: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team</label>
                    <select
                      required value={manualStudent.team}
                      onChange={(e) => setManualStudent({...manualStudent, team: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    >
                      <option value="" disabled>Select Team</option>
                      <option value="ZAMAAN">ZAMAAN</option>
                      <option value="ZAMEEN">ZAMEEN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zone</label>
                  <select
                    required value={manualStudent.zone}
                    onChange={(e) => setManualStudent({...manualStudent, zone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  >
                    <option value="" disabled>Select Zone</option>
                    <option value="Sub Junior">Sub Junior</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Super Senior">Super Senior</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="submit" disabled={manualLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    {manualLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                    Add Student
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
