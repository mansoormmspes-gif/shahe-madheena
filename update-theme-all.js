const fs = require('fs');

const paths = [
  'src/app/admin/competitions/page.tsx',
  'src/app/admin/results/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/students/page.tsx',
  'src/app/admin/ClientLayout.tsx',
  'src/app/admin/layout.tsx',
  'src/app/admin/page.tsx',
  'src/app/leaderboard/page.tsx',
  'src/app/login/page.tsx',
  'src/app/team/ClientLayout.tsx',
  'src/app/team/layout.tsx'
];

const rules = [
  ['bg-white/60 backdrop-blur-xl', 'bg-white/[0.03] backdrop-blur-2xl'],
  ['bg-white/60', 'bg-white/[0.03]'],
  ['bg-slate-100/80', 'bg-white/[0.05]'],
  ['bg-slate-50', 'bg-white/[0.03]'],
  ['bg-slate-100', 'bg-white/[0.05]'],
  ['text-slate-900', 'text-white'],
  ['text-slate-800', 'text-white'],
  ['text-slate-700', 'text-slate-300'],
  ['text-slate-600', 'text-slate-300'],
  ['text-slate-500', 'text-slate-400'],
  ['bg-white ', 'bg-white/[0.05] '],
  ['bg-white"', 'bg-white/[0.05]"'],
  ['border-slate-100', 'border-white/[0.08]'],
  ['border-slate-200', 'border-white/[0.08]'],
  ['border-blue-200', 'border-violet-500/20'],
  ['border-blue-100', 'border-violet-500/20'],
  ['bg-blue-50', 'bg-violet-500/10'],
  ['bg-blue-100', 'bg-violet-500/20'],
  ['text-blue-600', 'text-violet-400'],
  ['text-blue-700', 'text-violet-400'],
  ['text-blue-500', 'text-violet-400'],
  ['bg-emerald-50', 'bg-emerald-500/10'],
  ['text-emerald-700', 'text-emerald-400'],
  ['text-emerald-600', 'text-emerald-400'],
  ['bg-amber-50', 'bg-amber-500/10'],
  ['text-amber-700', 'text-amber-400'],
  ['bg-purple-50', 'bg-fuchsia-500/10'],
  ['text-purple-700', 'text-fuchsia-400'],
  ['bg-red-50', 'bg-red-500/10'],
  ['text-red-600', 'text-red-400'],
  ['border-red-100', 'border-red-500/20'],
  ['bg-indigo-600', 'bg-gradient-to-r from-violet-600 to-fuchsia-500'],
  ['hover:bg-indigo-700', 'hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'],
  ['shadow-indigo-600/20', 'shadow-[0_0_20px_rgba(168,85,247,0.2)]'],
  ['border-white/50', 'border-white/[0.08]'],
  ['bg-gradient-to-br from-emerald-50 via-white to-teal-50', 'bg-transparent'],
  ['bg-slate-200', 'bg-white/[0.08]'],
  ['border-t border-slate-100', 'border-t border-white/[0.08]'],
  ['border-b border-slate-100', 'border-b border-white/[0.08]'],
  ['text-slate-400 font-medium', 'text-slate-500 font-medium'],
  ['bg-blue-600 text-white hover:bg-blue-700', 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'],
  ['bg-blue-600', 'bg-violet-600'],
  ['hover:bg-blue-700', 'hover:bg-violet-700'],
  ['bg-slate-950', '#0B0F19'],
];

for (const path of paths) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');
  for (const [find, replace] of rules) {
    content = content.split(find).join(replace);
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated', path);
}
