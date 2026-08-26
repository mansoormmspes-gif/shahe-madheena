
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

// 1. Update imports
content = content.replace(
  /import \{ Loader2.*?\} from "lucide-react";/,
  `import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive, FileText } from "lucide-react";`
);
content = content.replace(
  /import \{ saveAs \} from "file-saver";/,
  `import { saveAs } from "file-saver";\nimport { jsPDF } from "jspdf";\nimport autoTable from "jspdf-autotable";`
);

// 2. Add state: const [downloadingPDF, setDownloadingPDF] = useState(false);
content = content.replace(
  /const \[bulkDownloading, setBulkDownloading\] = useState\(false\);/,
  `const [bulkDownloading, setBulkDownloading] = useState(false);\n  const [downloadingPDF, setDownloadingPDF] = useState(false);`
);

// 3. Add handleDownloadPDF before handleBulkDownload
const handleDownloadPDF = `
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const { data: allRes } = await supabase.from("results").select("*, students(name, team)");
      const { data: comps } = await supabase.from("competitions").select("*");
      if (!allRes || !comps) throw new Error("Failed to fetch data");

      const doc = new jsPDF();
      
      const zoneOrder = ["MINOR ZONE", "MID ZONE", "PREMIER ZONE", "GENERAL ZONE"];
      
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      doc.text("Complete Results Report", 14, 20);
      
      let yPos = 35;

      for (const zone of zoneOrder) {
        const zoneComps = comps.filter(c => {
           const z = (c.category || "GENERAL ZONE").toUpperCase();
           return z === zone;
        });

        if (zoneComps.length === 0) continue;
        
        // Check if any comp in this zone has results
        const hasResults = zoneComps.some(c => allRes.some((r: any) => r.event_id === c.id));
        if (!hasResults) continue;

        // Print Zone Header
        doc.setFontSize(18);
        doc.setTextColor(220, 38, 38); // Red-ish for Zone Title
        doc.text(zone, 14, yPos);
        yPos += 10;

        for (const comp of zoneComps) {
           const compResults = allRes.filter((r: any) => r.event_id === comp.id).sort((a: any, b: any) => a.position - b.position);
           if (compResults.length === 0) continue;

           const isGroup = comp.type === "Group" || comp.type === "group";

           doc.setFontSize(14);
           doc.setTextColor(60, 60, 60);
           doc.text(comp.name, 14, yPos);
           yPos += 5;

           const tableData = compResults.map((r: any) => {
               let sName = (r.students?.name || "Unknown").toUpperCase();
               if (isGroup) sName += " & TEAM";
               return [
                  r.position === 1 ? "1st" : r.position === 2 ? "2nd" : r.position === 3 ? "3rd" : \`\${r.position}th\`,
                  sName,
                  (r.students?.team || "Unknown").toUpperCase()
               ];
           });

           autoTable(doc, {
             startY: yPos,
             head: [["Position", "Student Name", "Team"]],
             body: tableData,
             theme: "grid",
             headStyles: { fillColor: [79, 70, 229] },
             margin: { left: 14, right: 14 },
           });

           yPos = (doc as any).lastAutoTable.finalY + 15;

           if (yPos > 260) {
              doc.addPage();
              yPos = 20;
           }
        }
        
        yPos += 5;
        if (yPos > 260) {
           doc.addPage();
           yPos = 20;
        }
      }

      doc.save("Complete_Results_Report.pdf");
    } catch (err) {
      console.error(err);
      alert("PDF generation failed.");
    } finally {
      setDownloadingPDF(false);
    }
  };
`;

content = content.replace(
  /const handleBulkDownload = async \(\) => \{/,
  handleDownloadPDF + "\n  const handleBulkDownload = async () => {"
);

// 4. Update the buttons in the JSX
const oldButtons = `          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all"
          >
            {bulkDownloading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Archive className="h-5 w-5 mr-2" />}
            Bulk Download All Posters
          </motion.button>`;

const newButtons = `          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || bulkDownloading}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 transition-all"
            >
              {downloadingPDF ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <FileText className="h-5 w-5 mr-2" />}
              Full Results (PDF)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDownload}
              disabled={bulkDownloading || downloadingPDF}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all"
            >
              {bulkDownloading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Archive className="h-5 w-5 mr-2" />}
              Bulk Download All Posters
            </motion.button>
          </div>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Replaced successfully!");

