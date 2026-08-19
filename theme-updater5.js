const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/login/page.tsx');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/bg-slate-900\/50/g, 'bg-white/80');
  content = content.replace(/hover:bg-slate-900/g, 'hover:bg-white');
  content = content.replace(/focus:bg-slate-900/g, 'focus:bg-white');
  
  content = content.replace(/text-white/g, 'text-slate-900');
  // Revert button text
  content = content.replace(/text-slate-900 bg-slate-900/g, 'text-white bg-indigo-600');
  content = content.replace(/text-slate-900 bg-indigo-600/g, 'text-white bg-indigo-600');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-indigo-700');
  
  fs.writeFileSync(filePath, content);
}
