
const fs = require("fs");
const lines = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8").split(/\r?\n/);

// 1. Add imports
const importIdx = lines.findIndex(l => l.includes("import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive, FileText }"));
if (importIdx !== -1) {
    lines[importIdx] = `import { Loader2, Save, Trophy, Medal, Award, Trash2, X, Download, Archive, FileText, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";`;
}

// 2. Add state
const stateIdx = lines.findIndex(l => l.includes("const [competitions, setCompetitions] = useState<any[]>([])"));
if (stateIdx !== -1) {
    lines.splice(stateIdx + 1, 0, 
      `  const [allResults, setAllResults] = useState<any[]>([]);`,
      `  const [expandedSection, setExpandedSection] = useState<string | null>(null);`
    );
}

// 3. Update useEffect and fetch
const effectStartIdx = lines.findIndex(l => l.includes("const fetchCompetitions = async () => {"));
if (effectStartIdx !== -1) {
    lines.splice(effectStartIdx, 5,
      `    const fetchData = async () => {`,
      `      const { data: compData } = await supabase.from("competitions").select("*").order("name");`,
      `      const { data: resData } = await supabase.from("results").select("competition_id, points");`,
      `      if (compData) setCompetitions(compData);`,
      `      if (resData) setAllResults(resData);`,
      `      setLoading(false);`,
      `    };`,
      `    fetchData();`
    );
}

// 5. Inject UI
const injectIdx = lines.findIndex(l => l.includes("Bulk Download All Posters"));
if (injectIdx !== -1) {
    let targetIdx = injectIdx;
    while (!lines[targetIdx].includes("</motion.div>")) {
        targetIdx++;
    }
    targetIdx++; // After </motion.div>
    
    const uiLines = [
      `          {/* Results Status Tracker */}`,
      `          {(() => {`,
      `            const pendingComps = competitions.filter(c => !allResults.some(r => r.competition_id === c.id));`,
      `            const completedComps = competitions.filter(c => {`,
      `               const compResults = allResults.filter(r => r.competition_id === c.id);`,
      `               return compResults.length > 0 && compResults.every(r => r.points !== null && r.points > 0);`,
      `            });`,
      `            const missingPointsComps = competitions.filter(c => {`,
      `               const compResults = allResults.filter(r => r.competition_id === c.id);`,
      `               return compResults.length > 0 && compResults.some(r => r.points === null || r.points === 0);`,
      `            });`,
      ``,
      `            const renderAccordion = (title, items, icon, bgColor, textColor, key) => (`,
      `              <div className={"glass-card overflow-hidden rounded-[1.5rem] shadow-sm border border-slate-100 " + bgColor}>`,
      `                <button `,
      `                  onClick={() => setExpandedSection(expandedSection === key ? null : key)}`,
      `                  className={"w-full flex items-center justify-between p-4 focus:outline-none transition-colors " + textColor}`,
      `                >`,
      `                  <div className="flex items-center gap-3">`,
      `                    {icon}`,
      `                    <h3 className="font-bold text-lg">{title} ({items.length})</h3>`,
      `                  </div>`,
      `                  {expandedSection === key ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}`,
      `                </button>`,
      `                <AnimatePresence>`,
      `                  {expandedSection === key && (`,
      `                    <motion.div`,
      `                      initial={{ height: 0, opacity: 0 }}`,
      `                      animate={{ height: "auto", opacity: 1 }}`,
      `                      exit={{ height: 0, opacity: 0 }}`,
      `                      className="bg-white/60 backdrop-blur-md"`,
      `                    >`,
      `                      <ul className="p-4 space-y-2 max-h-60 overflow-y-auto">`,
      `                        {items.length === 0 ? (`,
      `                           <li className="text-sm font-medium text-slate-500">None</li>`,
      `                        ) : items.map(c => (`,
      `                          <li key={c.id} className="text-sm font-semibold text-slate-700 flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">`,
      `                            <span>{c.name}</span>`,
      `                            <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{c.category}</span>`,
      `                          </li>`,
      `                        ))}`,
      `                      </ul>`,
      `                    </motion.div>`,
      `                  )}`,
      `                </AnimatePresence>`,
      `              </div>`,
      `            );`,
      ``,
      `            return (`,
      `              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">`,
      `                {renderAccordion("Pending Results", pendingComps, <Clock className="w-6 h-6" />, "bg-slate-50", "text-slate-700", "pending")}`,
      `                {renderAccordion("Missing Points", missingPointsComps, <AlertCircle className="w-6 h-6" />, "bg-red-50", "text-red-700", "missing")}`,
      `                {renderAccordion("Completed", completedComps, <CheckCircle className="w-6 h-6" />, "bg-emerald-50", "text-emerald-700", "completed")}`,
      `              </motion.div>`,
      `            );`,
      `          })()}`
    ];
    lines.splice(targetIdx, 0, ...uiLines);
}

fs.writeFileSync("src/app/admin/results/page.tsx", lines.join(String.fromCharCode(10)), "utf-8");
console.log("Success");

