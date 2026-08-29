
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

// 1. Imports
content = content.replace(
  `import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive, FileText } from "lucide-react";`,
  `import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive, FileText, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";`
);

// 2. Add allResults state
content = content.replace(
  `const [competitions, setCompetitions] = useState<any[]>([]);`,
  `const [competitions, setCompetitions] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);`
);

// 3. Update useEffect
content = content.replace(
  `  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("name");
      if (data) setCompetitions(data);
      setLoading(false);
    };
    fetchCompetitions();
  }, []);`,
  `  const fetchData = async () => {
    const { data: compData } = await supabase.from("competitions").select("*").order("name");
    const { data: resData } = await supabase.from("results").select("competition_id, points");
    if (compData) setCompetitions(compData);
    if (resData) setAllResults(resData);
    setLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, []);`
);

// 4. Update save to refresh stats
content = content.replace(
  `setMessage({ text: "Results saved successfully!", type: "success" });`,
  `setMessage({ text: "Results saved successfully!", type: "success" });
      fetchData();`
);

// 5. Build tracker UI just below the Results Management header
const trackerUI = `
            <div className="flex flex-col sm:flex-row gap-4">
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
            </div>
          </motion.div>

          {/* Results Status Tracker */}
          {(() => {
            const pendingComps = competitions.filter(c => !allResults.some(r => r.competition_id === c.id));
            const completedComps = competitions.filter(c => {
               const compResults = allResults.filter(r => r.competition_id === c.id);
               return compResults.length > 0 && compResults.every(r => r.points !== null && r.points > 0);
            });
            const missingPointsComps = competitions.filter(c => {
               const compResults = allResults.filter(r => r.competition_id === c.id);
               return compResults.length > 0 && compResults.some(r => r.points === null || r.points === 0);
            });

            const renderAccordion = (title, items, icon, bgColor, textColor, key) => (
              <div className={"glass-card overflow-hidden rounded-[1.5rem] shadow-sm border border-slate-100 mb-4 " + bgColor}>
                <button 
                  onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                  className={"w-full flex items-center justify-between p-4 focus:outline-none transition-colors " + textColor}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="font-bold text-lg">{title} ({items.length})</h3>
                  </div>
                  {expandedSection === key ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <AnimatePresence>
                  {expandedSection === key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white/60 backdrop-blur-md"
                    >
                      <ul className="p-4 space-y-2 max-h-60 overflow-y-auto">
                        {items.length === 0 ? (
                           <li className="text-sm font-medium text-slate-500">None</li>
                        ) : items.map(c => (
                          <li key={c.id} className="text-sm font-semibold text-slate-700 flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                            <span>{c.name}</span>
                            <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{c.category}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );

            return (
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {renderAccordion("Pending Results", pendingComps, <Clock className="w-6 h-6" />, "bg-slate-50", "text-slate-700", "pending")}
                {renderAccordion("Missing Points", missingPointsComps, <AlertCircle className="w-6 h-6" />, "bg-red-50", "text-red-700", "missing")}
                {renderAccordion("Completed", completedComps, <CheckCircle className="w-6 h-6" />, "bg-emerald-50", "text-emerald-700", "completed")}
              </motion.div>
            );
          })()}
`;

content = content.replace(
  /<div className="flex flex-col sm:flex-row gap-4">([\s\S]*?)Bulk Download All Posters\n\s*<\/motion\.button>\n\s*<\/div>\n\s*<\/motion\.div>/m,
  trackerUI
);

fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Success");

