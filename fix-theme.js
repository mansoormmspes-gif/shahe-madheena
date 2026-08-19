const fs = require('fs');

function applyFixes(file, fixes) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const fix of fixes) {
    if (typeof fix.search === 'string') {
      content = content.split(fix.search).join(fix.replace);
    } else if (fix.search instanceof RegExp) {
      content = content.replace(fix.search, fix.replace);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

const blobReplacements = [
  { search: /bg-slate-50/g, replace: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative' },
  { search: /bg-blue-100\/40 blur-\[100px\]/g, replace: 'bg-emerald-300/30 blur-[120px]' },
  { search: /bg-purple-100\/40 blur-\[120px\]/g, replace: 'bg-amber-300/20 blur-[120px]' },
  { search: /bg-blue-100\/50 blur-3xl/g, replace: 'bg-emerald-300/30 blur-[120px]' },
  { search: /bg-indigo-100\/50 blur-3xl/g, replace: 'bg-amber-300/20 blur-[120px]' },
  { search: /bg-cyan-50\/50 blur-3xl/g, replace: 'bg-emerald-300/30 blur-[120px]' },
  { search: /bg-blue-50\/50 blur-3xl/g, replace: 'bg-amber-300/20 blur-[120px]' },
  { search: /bg-indigo-50\/50 blur-3xl/g, replace: 'bg-emerald-300/30 blur-[120px]' },
  { search: /bg-indigo-200\/40 blur-3xl/g, replace: 'bg-emerald-300/30 blur-[120px]' },
  { search: /bg-emerald-200\/40 blur-3xl/g, replace: 'bg-amber-300/20 blur-[120px]' },
  
  // Glassmorphism upgrades
  { search: /glass-card rounded-\[1rem\] md:rounded-\[2rem\] overflow-hidden/g, replace: 'glass-card rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-lg shadow-teal-900/5 border border-white/60 backdrop-blur-xl bg-white/60' },
  { search: /bg-white\/60 backdrop-blur-2xl border-r border-slate-200\/50/g, replace: 'bg-white/60 backdrop-blur-2xl border-r border-white/60 shadow-lg shadow-teal-900/5' },
  { search: /bg-white\/80 backdrop-blur-md border-b border-slate-200\/50/g, replace: 'bg-white/80 backdrop-blur-lg border-b border-white/60 shadow-sm shadow-teal-900/5' }
];

applyFixes('src/app/page.tsx', blobReplacements);
applyFixes('src/app/login/page.tsx', blobReplacements);
applyFixes('src/app/team/ClientLayout.tsx', blobReplacements);
applyFixes('src/app/leaderboard/page.tsx', blobReplacements);
applyFixes('src/app/admin/ClientLayout.tsx', blobReplacements);
applyFixes('src/app/admin/students/page.tsx', blobReplacements);
applyFixes('src/app/admin/competitions/page.tsx', blobReplacements);
applyFixes('src/app/admin/results/page.tsx', blobReplacements);
applyFixes('src/app/admin/settings/page.tsx', blobReplacements);
applyFixes('src/app/admin/page.tsx', blobReplacements);

// Add pattern overlay manually in CSS
let css = fs.readFileSync('src/app/globals.css', 'utf8');
if (!css.includes('.bg-dot-pattern')) {
  css += `\n.bg-dot-pattern {
  background-image: radial-gradient(rgba(13, 148, 136, 0.15) 1px, transparent 1px);
  background-size: 24px 24px;
}\n`;
  fs.writeFileSync('src/app/globals.css', css);
  console.log('Added pattern to globals.css');
}

console.log("Theme enhancements applied!");
