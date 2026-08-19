const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/app/page.tsx',
  'src/app/team/page.tsx',
  'src/app/admin/ClientLayout.tsx',
  'src/app/admin/settings/page.tsx',
];

const replacements = [
  { from: /bg-slate-900\/60/g, to: 'bg-white/60' },
  { from: /bg-slate-950\/50/g, to: 'bg-white/50' },
  { from: /bg-slate-900\/40/g, to: 'bg-white/40' },
  { from: /bg-slate-950\/30/g, to: 'bg-slate-50/50' },
  { from: /bg-slate-900\/10/g, to: 'bg-white/50' },
  { from: /bg-slate-900/g, to: 'bg-white' },
  { from: /bg-slate-950/g, to: 'bg-white' },
  { from: /bg-slate-800/g, to: 'bg-slate-50' },
  
  // Text colors inside specific containers that we changed to white
  // Note: we can't blindly change text-white everywhere because buttons use it.
  { from: /text-slate-200/g, to: 'text-slate-700' },
  { from: /text-slate-300/g, to: 'text-slate-600' },
  
  // Borders
  { from: /border-slate-800/g, to: 'border-slate-100' },
  { from: /border-slate-700/g, to: 'border-slate-200' },
  
  // Specifically in the dark backgrounds that are now white, text-white should be text-slate-900
  // Instead of complex regex, let's just do it manually for the known ones or carefully via regex.
  { from: /text-white/g, to: 'text-white' }, // placeholder, will do manually
];

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Custom replacements for page.tsx
    if (file === 'src/app/page.tsx') {
      // The "Result Checker" card
      content = content.replace(/bg-slate-900 rounded-\[3rem\]/g, 'bg-white rounded-[3rem]');
      content = content.replace(/text-4xl md:text-5xl font-black text-white/g, 'text-4xl md:text-5xl font-black text-slate-900');
      content = content.replace(/text-slate-400 text-lg/g, 'text-slate-500 text-lg');
      content = content.replace(/bg-white\/10 backdrop-blur-md border border-white\/20 rounded-2xl text-white placeholder-slate-400/g, 'bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400');
      content = content.replace(/bg-slate-900 hover:bg-slate-100 text-white/g, 'bg-blue-600 hover:bg-blue-700 text-white');
      
      // The Search Results
      content = content.replace(/bg-slate-900 p-8/g, 'bg-white p-8');
      content = content.replace(/bg-slate-950 p-8/g, 'bg-white p-8');
      content = content.replace(/bg-slate-900 px-4/g, 'bg-slate-50 px-4');
      content = content.replace(/text-white text-sm/g, 'text-slate-900 text-sm');
      content = content.replace(/bg-slate-900 text-white px-4 py-2/g, 'bg-blue-100 text-blue-800 px-4 py-2');
      content = content.replace(/text-2xl font-black text-white/g, 'text-2xl font-black text-slate-900');
      content = content.replace(/bg-slate-900 rounded-2xl/g, 'bg-slate-50 rounded-2xl');
      content = content.replace(/text-lg font-bold text-white/g, 'text-lg font-bold text-slate-900');
      content = content.replace(/bg-slate-900 hover:bg-slate-800 text-white/g, 'bg-blue-600 hover:bg-blue-700 text-white');
      
      // No Results
      content = content.replace(/bg-slate-950 rounded-full/g, 'bg-slate-50 rounded-full');
      content = content.replace(/text-2xl font-black text-white mb-2/g, 'text-2xl font-black text-slate-900 mb-2');
    }
    
    if (file === 'src/app/team/page.tsx') {
      content = content.replace(/bg-slate-900\/60/g, 'bg-white/60');
      content = content.replace(/bg-slate-950\/50/g, 'bg-white/50');
      content = content.replace(/bg-slate-950\/30/g, 'bg-slate-50');
      content = content.replace(/bg-slate-900\/40/g, 'bg-white/40');
      
      content = content.replace(/text-3xl font-black text-white/g, 'text-3xl font-black text-slate-900');
      content = content.replace(/text-white border-l/g, 'text-slate-900 border-l');
      
      // Filter buttons
      content = content.replace(/bg-slate-900 text-white shadow-sm/g, 'bg-white text-blue-600 shadow-sm border border-blue-200');
      content = content.replace(/text-slate-400 hover:text-white/g, 'text-slate-500 hover:text-slate-900');
      
      // Generate PDF button
      content = content.replace(/bg-slate-900 text-white/g, 'bg-indigo-600 text-white');
      content = content.replace(/hover:bg-slate-800/g, 'hover:bg-indigo-700');
      content = content.replace(/shadow-slate-900\/20/g, 'shadow-indigo-600/20');
      
      // Search bars
      content = content.replace(/bg-slate-900 border/g, 'bg-white border');
      
      // Category headers
      content = content.replace(/text-xl font-black text-white/g, 'text-xl font-black text-slate-900');
      
      // Student/Event Cards
      content = content.replace(/hover:bg-slate-900\/40/g, 'hover:bg-slate-50');
      content = content.replace(/text-lg font-bold text-white/g, 'text-lg font-bold text-slate-900');
      content = content.replace(/bg-slate-900 px-4/g, 'bg-white px-4');
      content = content.replace(/bg-slate-900 px-5/g, 'bg-white px-5');
      
      // Modal
      content = content.replace(/bg-slate-900\/40 backdrop-blur-sm/g, 'bg-slate-900/20 backdrop-blur-sm');
      content = content.replace(/bg-slate-900 w-full/g, 'bg-white w-full');
      content = content.replace(/bg-slate-900 p-4/g, 'bg-slate-50 p-4');
      content = content.replace(/text-xl font-black text-white/g, 'text-xl font-black text-slate-900');
      
      // Inputs in modal
      content = content.replace(/bg-slate-950 border/g, 'bg-white border');
      content = content.replace(/focus:bg-slate-900/g, 'focus:bg-slate-50');
      
      content = content.replace(/bg-slate-900 rounded-xl border-2/g, 'bg-white rounded-xl border border-slate-200');
      
      // Countdown Timer
      content = content.replace(/bg-slate-800/g, 'bg-white');
      content = content.replace(/border-slate-700/g, 'border-slate-200');
    }
    
    fs.writeFileSync(filePath, content);
  }
});
