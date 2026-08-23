
const fs = require("fs");
let content = fs.readFileSync("src/app/results/page.tsx", "utf-8");

// 1. Find the top of generateCanvasPoster to add isGroup
content = content.replace(
  `      const comp = competitions.find(c => c.id === compId);
      if (!comp) return null;`,
  `      const comp = competitions.find(c => c.id === compId);
      if (!comp) return null;
      const isGroup = comp.type === "Group" || comp.type === "group";`
);

// 2. Replace studentName references in the templates
// We will look for: const studentName = (w.student?.name || "Unknown").toUpperCase();
// And replace it with:
// const baseName = (w.student?.name || "Unknown").toUpperCase();
// const studentName = isGroup ? `${baseName} & TEAM` : baseName;

content = content.replace(/const studentName = \(w\.student\?\.name \|\| "Unknown"\)\.toUpperCase\(\);/g, 
\`const baseName = (w.student?.name || "Unknown").toUpperCase();
            const studentName = isGroup ? \\\`\${baseName} & TEAM\\\` : baseName;\`);

fs.writeFileSync("src/app/results/page.tsx", content, "utf-8");
console.log("Success");

