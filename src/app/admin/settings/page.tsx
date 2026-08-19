"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Settings2, Clock, Image as ImageIcon, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState({
    max_individual_items: 4,
    registration_start_time: "",
    registration_end_time: "",
    show_leaderboard: false,
    poster_template_url: "",
    zone_config: null as any,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      const formatTime = (isoStr: string) => {
        if (!isoStr) return "";
        const date = new Date(isoStr);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      };

      setSettings({
        max_individual_items: data.max_individual_items || 4,
        registration_start_time: formatTime(data.registration_start_time),
        registration_end_time: formatTime(data.registration_end_time),
        show_leaderboard: data.show_leaderboard || false,
        poster_template_url: data.poster_template_url || "",
        zone_config: data.zone_config || null,
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...settings,
      registration_start_time: settings.registration_start_time
        ? new Date(settings.registration_start_time).toISOString()
        : null,
      registration_end_time: settings.registration_end_time
        ? new Date(settings.registration_end_time).toISOString()
        : null,
    };

    const { error } = await supabase
      .from("settings")
      .update(payload)
      .eq("id", 1);

    if (error) {
      setMessage("Error saving settings: " + error.message);
    } else {
      setMessage("Settings saved successfully!");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
          <Settings2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fest Settings</h1>
          <p className="text-slate-500 font-medium">Configure global rules and appearance for Meelad Fest 2k26.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden">
        <form onSubmit={handleSave} className="p-8 sm:p-10 space-y-8">
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className={`p-4 rounded-xl text-sm font-semibold border ${message.includes("Error") ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}
            >
              {message}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
            {/* Registration Settings */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center border-b border-slate-100 pb-4">
                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                Registration Window
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.registration_start_time}
                    onChange={(e) => setSettings({ ...settings, registration_start_time: e.target.value })}
                    className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.registration_end_time}
                    onChange={(e) => setSettings({ ...settings, registration_end_time: e.target.value })}
                    className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Rules & Display Settings */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center border-b border-slate-100 pb-4">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Rules & Display
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Max Individual Events (per student)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={settings.max_individual_items}
                    onChange={(e) => setSettings({ ...settings, max_individual_items: parseInt(e.target.value) })}
                    className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="relative flex items-center cursor-pointer p-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.show_leaderboard}
                      onChange={(e) => setSettings({ ...settings, show_leaderboard: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[18px] after:left-[18px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <div className="ml-4 flex flex-col">
                      <span className="text-sm font-bold text-slate-900">Show Leaderboard Publicly</span>
                      <span className="text-xs font-medium text-slate-500">Toggle live points on the public page</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Poster Template */}
            <div className="lg:col-span-2 space-y-6 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                <ImageIcon className="w-5 h-5 mr-2 text-indigo-500" />
                Custom Assets
              </h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Poster Template Background Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/poster-bg.png"
                  value={settings.poster_template_url}
                  onChange={(e) => setSettings({ ...settings, poster_template_url: e.target.value })}
                  className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                />
                <p className="mt-2 text-xs font-medium text-slate-500">Provide a URL for the background image used in the Custom Result Poster generator.</p>
              </div>
            </div>

            {/* Zone Settings */}
            <div className="lg:col-span-2 space-y-6 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Zone Classification (Classes)
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-4">
                Enter classes separated by commas (e.g., 1, 2, 3) for each zone. These will be used to automatically assign students to their correct zone when added.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["Minor Zone", "Mid Zone", "Premier Zone"].map((zone) => (
                  <div key={zone}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {zone}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1, 2, 3"
                      value={
                        (settings.zone_config && settings.zone_config[zone]) 
                        ? settings.zone_config[zone].join(", ") 
                        : (zone === "Minor Zone" ? "1, 2, 3" : zone === "Mid Zone" ? "4, 5, 6, 7" : "8, 9, 10, 11, 12")
                      }
                      onChange={(e) => {
                        const newConfig = { ...settings.zone_config };
                        newConfig[zone] = e.target.value.split(",").map(c => c.trim()).filter(Boolean);
                        setSettings({ ...settings, zone_config: newConfig });
                      }}
                      className="block w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all text-slate-900 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm shadow-indigo-600/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              Save Settings
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
