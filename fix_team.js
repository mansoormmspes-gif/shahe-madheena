
const fs = require("fs");
let content = fs.readFileSync("src/app/team/page.tsx", "utf-8");

const oldVariants = `  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };`;

const newVariants = `  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const availableZones = Array.from(new Set(students.map(s => s.category).filter(Boolean))).sort();`;

content = content.replace(oldVariants, newVariants);

// Fix validStudents filtering logic
const oldValidStudents = `            const validStudents = catStudents.filter(student => {
              if (isFilterActive && catCompetitions.length === 0) return false;
              return true;
            });`;

const newValidStudents = `            const validStudents = catStudents.filter(student => {
              const searchLower = globalSearch.toLowerCase().trim();
              const matchesStudentSearch = searchLower && (
                (student.name && String(student.name).toLowerCase().includes(searchLower)) ||
                (student.id && String(student.id).toLowerCase().includes(searchLower))
              );

              if (matchesStudentSearch) return true;
              if (isFilterActive && catCompetitions.length === 0 && !matchesStudentSearch) return false;
              return true;
            });`;

content = content.replace(oldValidStudents, newValidStudents);

// Fix dropdown
const oldDropdown = `{settings?.zone_config && Object.keys(settings.zone_config).map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
            <option value="General Zone">General Zone</option>`;

const newDropdown = `{availableZones.map(zone => (
              <option key={String(zone)} value={String(zone)}>{String(zone)}</option>
            ))}`;

content = content.replace(oldDropdown, newDropdown);

fs.writeFileSync("src/app/team/page.tsx", content, "utf-8");
console.log("Team page fixed.");

