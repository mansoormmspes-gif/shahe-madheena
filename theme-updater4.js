const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/admin/competitions/page.tsx');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-slate-900\/50/g, 'bg-white');
  content = content.replace(/bg-slate-900\/40/g, 'bg-slate-900/20');
  content = content.replace(/bg-slate-950\/50/g, 'bg-slate-50');
  content = content.replace(/bg-slate-950\/80/g, 'bg-slate-50');
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  
  content = content.replace(/text-white/g, 'text-slate-900');
  // Revert buttons to text-white
  content = content.replace(/text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800/g, 'text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100');
  content = content.replace(/bg-fuchsia-600 text-slate-900/g, 'bg-fuchsia-600 text-white');
  
  content = content.replace(/hover:bg-slate-950/g, 'hover:bg-slate-50');
  content = content.replace(/border-slate-100/g, 'border-slate-200');
  
  fs.writeFileSync(filePath, content);
}
