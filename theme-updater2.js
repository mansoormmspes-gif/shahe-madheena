const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/admin/ClientLayout.tsx');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/bg-slate-900\/60/g, 'bg-white/60');
  content = content.replace(/bg-slate-900\/80/g, 'bg-white/80');
  content = content.replace(/bg-slate-900\/40/g, 'bg-slate-900/20');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-400 hover:text-white/g, 'text-slate-500 hover:text-slate-900');
  
  fs.writeFileSync(filePath, content);
}

const settingsPath = path.join(__dirname, 'src/app/admin/settings/page.tsx');
if (fs.existsSync(settingsPath)) {
  let content = fs.readFileSync(settingsPath, 'utf8');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/text-white/g, 'text-slate-900');
  fs.writeFileSync(settingsPath, content);
}

const resultsPath = path.join(__dirname, 'src/app/admin/results/page.tsx');
if (fs.existsSync(resultsPath)) {
  let content = fs.readFileSync(resultsPath, 'utf8');
  // Just in case it has dark classes, though we didn't touch it much
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  fs.writeFileSync(resultsPath, content);
}
