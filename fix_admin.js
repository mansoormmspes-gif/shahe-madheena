
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

const oldBulk = `      const compsWithResults = Array.from(new Set(allRes.map((r: any) => r.event_id)));

      for (const compId of compsWithResults) {
        const comp = comps.find(c => c.id === compId);
        if (!comp) continue;
        
        const compResults = allRes.filter((r: any) => r.event_id === compId).map((r: any) => ({
           position: r.position,
           student: r.students
        })).sort((a,b) => a.position - b.position);

        const template = templates[Math.floor(Math.random() * templates.length)];`;

const newBulk = `      const compsWithResults = Array.from(new Set(allRes.map((r: any) => r.event_id)));

      let templateIndex = 0;
      for (const compId of compsWithResults) {
        const comp = comps.find(c => c.id === compId);
        if (!comp) continue;
        
        const compResults = allRes.filter((r: any) => r.event_id === compId).map((r: any) => ({
           position: r.position,
           student: r.students
        })).sort((a,b) => a.position - b.position);

        const template = templates[templateIndex % templates.length];
        templateIndex++;`;

content = content.replace(oldBulk, newBulk);
fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Replaced bulk download logic");

