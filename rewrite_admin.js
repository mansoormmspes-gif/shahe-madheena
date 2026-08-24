
const fs = require("fs");

let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

// Replace handleGeneratePoster with new logic
const oldFuncRegex = /const handleGeneratePoster = async \(\) => \{[\s\S]*?const handleSave =/m;

const newLogic = `
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const generatePosterCanvasDataUrl = async (comp, compResults, template, overrideZone = null) => {
    return new Promise(async (resolve, reject) => {
      try {
        const isGroup = comp.type === "Group" || comp.type === "group";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        const img = new Image();
        img.src = template;
        img.crossOrigin = "anonymous";
        
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error("Failed to load " + template));
        });

        if (template.includes("poster-3") || template.includes("poster-4")) {
          canvas.width = 1080;
          canvas.height = 1080;
          ctx.drawImage(img, 0, 0, 1080, 1080);
        } else {
          canvas.width = 1023;
          canvas.height = 1280;
          ctx.drawImage(img, 0, 0, 1023, 1280);
        }
        
        ctx.textBaseline = "top";
        const zoneStr = (overrideZone || comp.category || "GENERAL ZONE").toUpperCase();

        if (template.includes("poster-1")) {
          ctx.fillStyle = "#FFD700"; 
          ctx.font = \`600 28px Montserrat, sans-serif\`;
          ctx.fillText(comp.name.toUpperCase(), 279, 430);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = \`18px Montserrat, sans-serif\`;
          ctx.fillText(zoneStr, 279, 470);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter(r => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ".";
            
            winners.forEach(w => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? \`\${baseName} & TEAM\` : baseName;
              const teamName = (w.student?.team || "Unknown").toUpperCase();

              const Y = 590 + (winnerIndex * 65);

              ctx.fillStyle = "#FFFFFF";
              ctx.font = \`600 24px Montserrat, sans-serif\`;
              ctx.fillText(placePrefix, 280, Y);

              ctx.font = \`20px Montserrat, sans-serif\`;
              ctx.fillText(studentName, 330, Y);

              ctx.font = \`20px Montserrat, sans-serif\`;
              const teamX = 330 + ctx.measureText(studentName).width + 12;
              ctx.fillText(\`( \${teamName} )\`, teamX, Y);

              winnerIndex++;
            });
          });
        } else if (template.includes("poster-2")) {
          ctx.fillStyle = "#C8102E";
          ctx.font = \`600 22px Montserrat, sans-serif\`;
          ctx.fillText(zoneStr, 490, 480);

          ctx.fillStyle = "#332211";
          ctx.font = \`bold 34px Montserrat, sans-serif\`;
          ctx.fillText(comp.name.toUpperCase(), 490, 505);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter(r => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach(w => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? \`\${baseName} & TEAM\` : baseName;
              const teamName = (w.student?.team || "Unknown").toUpperCase();

              const Y = 640 + (winnerIndex * 115);

              ctx.fillStyle = "#332211";
              ctx.font = \`bold 30px Montserrat, sans-serif\`;
              ctx.fillText(\`\${placePrefix}\${studentName}\`, 490, Y);

              ctx.fillStyle = "#C8102E";
              ctx.font = \`600 22px Montserrat, sans-serif\`;
              ctx.fillText(teamName, 540, Y + 35);

              winnerIndex++;
            });
          });
        } else if (template.includes("poster-3")) {
          ctx.fillStyle = "#FFD700";
          ctx.font = \`600 24px Montserrat, sans-serif\`;
          ctx.fillText(zoneStr, 180, 280);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = \`bold 48px Montserrat, sans-serif\`;
          ctx.fillText(comp.name.toUpperCase(), 180, 310);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter(r => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach(w => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? \`\${baseName} & TEAM\` : baseName;
              const teamName = (w.student?.team || "Unknown").toUpperCase();

              const Y = 440 + (winnerIndex * 120);

              ctx.fillStyle = "#FFFFFF";
              ctx.font = \`bold 34px Montserrat, sans-serif\`;
              ctx.fillText(\`\${placePrefix}\${studentName}\`, 180, Y);

              ctx.fillStyle = "#FFD700";
              ctx.font = \`600 24px Montserrat, sans-serif\`;
              ctx.fillText(teamName, 230, Y + 40);

              winnerIndex++;
            });
          });
        } else if (template.includes("poster-4")) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = \`600 24px Montserrat, sans-serif\`;
          ctx.fillText(zoneStr, 260, 370);

          ctx.fillStyle = "#FFD700";
          ctx.font = \`bold 42px Montserrat, sans-serif\`;
          ctx.fillText(comp.name.toUpperCase(), 260, 410);

          let winnerIndex = 0;
          
          [1, 2, 3].forEach(pos => {
            const winners = compResults.filter(r => r.position === pos);
            if (winners.length === 0) return;
            const placePrefix = pos + ". ";
            
            winners.forEach(w => {
              const baseName = (w.student?.name || "Unknown").toUpperCase();
              const studentName = isGroup ? \`\${baseName} & TEAM\` : baseName;
              const placeAndStudentText = \`\${placePrefix}\${studentName}\`;
              const teamName = (w.student?.team || "Unknown").toUpperCase();

              const Y = 510 + (winnerIndex * 110);

              ctx.fillStyle = "#FFFFFF";
              ctx.font = \`bold 32px Montserrat, sans-serif\`;
              ctx.fillText(placeAndStudentText, 260, Y);

              const indent = ctx.measureText(placePrefix).width;

              ctx.fillStyle = "#FFD700";
              ctx.font = \`22px Montserrat, sans-serif\`;
              ctx.fillText(teamName, 260 + indent, Y + 35);

              winnerIndex++;
            });
          });
        }

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const { data: allRes } = await supabase.from("results").select("*, students(name, team)");
      const { data: comps } = await supabase.from("competitions").select("*");
      if (!allRes || !comps) throw new Error("Failed to fetch data");

      const zip = new JSZip();
      const templates = ["/poster-1.jpg", "/poster-2.jpg", "/poster-3.png", "/poster-4.jpg"];

      const compsWithResults = Array.from(new Set(allRes.map(r => r.event_id)));

      for (const compId of compsWithResults) {
        const comp = comps.find(c => c.id === compId);
        if (!comp) continue;
        
        const compResults = allRes.filter(r => r.event_id === compId).map(r => ({
           position: r.position,
           student: r.students
        })).sort((a,b) => a.position - b.position);

        const template = templates[Math.floor(Math.random() * templates.length)];
        const dataUrl = await generatePosterCanvasDataUrl(comp, compResults, template, comp.category);
        
        if (dataUrl) {
           const base64Data = dataUrl.split(",")[1];
           zip.file(\`\${comp.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Poster.jpg\`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Results_Posters.zip");
    } catch (err) {
      console.error(err);
      alert("Bulk download failed.");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleGeneratePoster = async () => {
    const comp = competitions.find(c => c.id === selectedEventId);
    if (!comp) return;

    setGeneratingPoster(true);
    try {
      const compResults = [];
      [1, 2, 3].forEach(pos => {
         results[pos].student_ids.forEach(sid => {
            const r = registrations.find(reg => reg.student_id === sid);
            compResults.push({
               position: pos,
               student: { name: r?.students?.name || "Unknown", team: r?.students?.team || "Unknown" }
            });
         });
      });
      
      const templates = ["/poster-1.jpg", "/poster-2.jpg", "/poster-3.png", "/poster-4.jpg"];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const dataUrl = await generatePosterCanvasDataUrl(comp, compResults, template, selectedZone);
      if (dataUrl) {
         const a = document.createElement("a");
         a.href = dataUrl;
         a.download = \`\${comp.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Poster.jpg\`;
         a.click();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate poster.");
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSave =`;

content = content.replace(oldFuncRegex, newLogic);
fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Success replacing poster logic");

