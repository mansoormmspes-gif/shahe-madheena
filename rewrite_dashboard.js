
const fs = require("fs");

const newContent = `
"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, Trophy, ClipboardList, Settings, Medal, Loader2, Award } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [teamLeaderboard, setTeamLeaderboard] = useState<{ team: string, points: number }[]>([]);
  const [studentLeaderboard, setStudentLeaderboard] = useState<{ id: string, name: string, team: string, points: number }[]>([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const { data: results } = await supabase
        .from("results")
        .select(\`
          points,
          student_id,
          students!inner (
            name,
            team
          )
        \`);

      if (results) {
        const teamPts: Record<string, number> = {};
        const studentPts: Record<string, { id: string, name: string, team: string, points: number }> = {};

        results.forEach((r: any) => {
          const pts = r.points || 0;
          const teamName = r.students?.team || "Unknown";
          const sName = r.students?.name || "Unknown";
          const sId = r.student_id;

          if (!teamPts[teamName]) teamPts[teamName] = 0;
          teamPts[teamName] += pts;

          if (!studentPts[sId]) {
             studentPts[sId] = { id: sId, name: sName, team: teamName, points: 0 };
          }
          studentPts[sId].points += pts;
        });

        const sortedTeams = Object.entries(teamPts)
           .map(([team, points]) => ({ team, points }))
           .sort((a, b) => b.points - a.points);
        
        const sortedStudents = Object.values(studentPts)
           .sort((a, b) => b.points - a.points);
        
        setTeamLeaderboard(sortedTeams);
        setStudentLeaderboard(sortedStudents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const quickLinks = [
    { href: "/admin/settings", label: "Fest Settings", icon: Settings, color: "text-indigo-500", bg: "bg-indigo-50", hover: "hover:bg-indigo-600" },
    { href: "/admin/students", label: "Manage Students", icon: Users, color: "text-blue-500", bg: "bg-blue-50", hover: "hover:bg-blue-600" },
    { href: "/admin/competitions", label: "Competitions", icon: ClipboardList, color: "text-fuchsia-500", bg: "bg-fuchsia-50", hover: "hover:bg-fuchsia-600" },
    { href: "/admin/results", label: "Enter Results", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", hover: "hover:bg-amber-500" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
      <motion.div variants={itemVariants} className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight mb-1">Welcome, Admin</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base">Here is your control center for Meelad Fest 2k26.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link, i) => (
          <Link href={link.href} key={i}>
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-[2rem] p-6 flex flex-col items-center justify-center text-center h-48 cursor-pointer group transition-all"
            >
              <div className={\`p-4 rounded-full \${link.bg} mb-4 group-hover:\${link.hover} transition-colors\`}>
                <link.icon className={\`h-8 w-8 \${link.color} group-hover:text-white transition-colors\`} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{\`\${link.label}\`}</h2>
            </motion.div>
          </Link>
        ))}
      </div>

      <motion.div variants={itemVariants} className="pt-8 border-t border-slate-200">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-500" />
            Live Points Dashboard
          </h2>
          <p className="text-slate-500 font-medium">Internal realtime standings across all teams and students.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Team Leaderboard */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Team Standings
              </h3>
              <div className="space-y-4">
                {teamLeaderboard.map((team, index) => (
                  <div key={team.team} className={\`glass-card rounded-2xl p-6 flex items-center justify-between border \${index === 0 ? "border-amber-200 bg-amber-50/50" : "border-slate-100"}\`}>
                    <div className="flex items-center gap-4">
                      <div className={\`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl \${
                         index === 0 ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-white shadow-lg shadow-amber-500/30" : 
                         index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" : 
                         "bg-gradient-to-br from-amber-700 to-amber-900 text-white"
                      }\`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900">{team.team}</h4>
                        <p className="text-sm font-semibold text-slate-500">Team Points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        {team.points}
                      </span>
                      <span className="text-sm font-bold text-slate-500 ml-1">pts</span>
                    </div>
                  </div>
                ))}
                {teamLeaderboard.length === 0 && (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 font-medium">No team results yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Student Leaderboard */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Medal className="h-5 w-5 text-emerald-500" />
                Top Students
              </h3>
              <div className="glass-card rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Rank</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                            No student results yet.
                          </td>
                        </tr>
                      ) : (
                        studentLeaderboard.map((student, index) => {
                          let rankIcon = null;
                          let rankClass = "text-slate-600 font-bold";
                          if (index === 0) {
                             rankIcon = <Award className="w-6 h-6 text-amber-500 inline" />;
                             rankClass = "text-amber-600 font-black";
                          } else if (index === 1) {
                             rankIcon = <Award className="w-6 h-6 text-slate-400 inline" />;
                             rankClass = "text-slate-500 font-black";
                          } else if (index === 2) {
                             rankIcon = <Award className="w-6 h-6 text-amber-700 inline" />;
                             rankClass = "text-amber-800 font-black";
                          }

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4 text-center">
                                {rankIcon || <span className={rankClass}>{index + 1}</span>}
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                  {student.name}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold \${
                                  student.team === "ZAMAAN" ? "bg-indigo-100 text-indigo-800" :
                                  student.team === "ZAMEEN" ? "bg-emerald-100 text-emerald-800" :
                                  "bg-slate-100 text-slate-800"
                                }\`}>
                                  {student.team}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-lg font-black text-slate-700">{student.points}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
`;

fs.writeFileSync("src/app/admin/page.tsx", newContent, "utf-8");
console.log("Rewrote dashboard successfully.");

