"use client";
export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import { LayoutDashboard, Users, Trophy, ClipboardList, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const quickLinks = [
    { href: "/admin/settings", label: "Fest Settings", icon: Settings, color: "text-indigo-500", bg: "bg-indigo-50" },
    { href: "/admin/students", label: "Manage Students", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { href: "/admin/competitions", label: "Competitions", icon: ClipboardList, color: "text-fuchsia-500", bg: "bg-fuchsia-50" },
    { href: "/admin/results", label: "Enter Results", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, Admin</h1>
          <p className="text-slate-500 font-medium">Here's your control center for Shahe Madeena.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link, i) => (
          <Link href={link.href} key={i}>
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-[2rem] p-6 flex flex-col items-center justify-center text-center h-48 cursor-pointer group"
            >
              <div className={`p-4 rounded-full ${link.bg} mb-4 group-hover:scale-110 transition-transform`}>
                <link.icon className={`h-8 w-8 ${link.color}`} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-slate-900">{link.label}</h2>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
