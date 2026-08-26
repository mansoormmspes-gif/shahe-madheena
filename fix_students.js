
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/students/page.tsx", "utf-8");

// 1. Fix the filteredStudents logic
const oldFilterStr = `  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === "All" || student.team === teamFilter;
    const matchesZone = zoneFilter === "All" || student.category === zoneFilter;
    return matchesSearch && matchesTeam && matchesZone;
  });`;

const newFilterStr = `  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                          (student.name && String(student.name).toLowerCase().includes(searchLower)) || 
                          (student.id && String(student.id).toLowerCase().includes(searchLower));
    const matchesTeam = teamFilter === "All" || student.team === teamFilter;
    const matchesZone = zoneFilter === "All" || student.category === zoneFilter;
    return matchesSearch && matchesTeam && matchesZone;
  });

  const availableZones = Array.from(new Set(students.map(s => s.category).filter(Boolean))).sort();`;

content = content.replace(oldFilterStr, newFilterStr);

// 2. Fix the dropdown for filter
const oldZoneDropdownStr = `{zoneConfig && Object.keys(zoneConfig).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}`;

const newZoneDropdownStr = `{availableZones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}`;

content = content.replace(oldZoneDropdownStr, newZoneDropdownStr);

// 3. Fix the dropdown for Manual Student creation/edit
const oldModalZoneDropdownStr = `{zoneConfig && Object.keys(zoneConfig).map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}`;

const newModalZoneDropdownStr = `{["Minor Zone", "Mid Zone", "Premier Zone", "General Zone"].map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}`;

content = content.replace(oldModalZoneDropdownStr, newModalZoneDropdownStr);

fs.writeFileSync("src/app/admin/students/page.tsx", content, "utf-8");
console.log("Fixed student search and filter");

