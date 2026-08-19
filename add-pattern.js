const fs = require('fs');

function addPattern(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Look for the animated background div, usually `pointer-events-none`
  // We can just add the pattern div right after it or inside it.
  const animatedBgRegex = /(<div className="[^"]*pointer-events-none[^"]*-z-10[^"]*">)/;
  
  if (animatedBgRegex.test(content) && !content.includes('bg-dot-pattern')) {
    content = content.replace(animatedBgRegex, '$1\n        <div className="absolute inset-0 bg-dot-pattern opacity-50 -z-20" />');
    fs.writeFileSync(file, content);
    console.log(`Added dot pattern to ${file}`);
  }
}

addPattern('src/app/page.tsx');
addPattern('src/app/login/page.tsx');
addPattern('src/app/team/ClientLayout.tsx');
addPattern('src/app/leaderboard/page.tsx');
addPattern('src/app/admin/ClientLayout.tsx');
