
const fs = require("fs");
let content = fs.readFileSync("src/app/team/page.tsx", "utf-8");

const oldDropdown = `{availableZones.map(zone => (
              <option key={String(zone)} value={String(zone)}>{String(zone)}</option>
            ))}`;

const newDropdown = `{availableZones.map(zone => (
              <option key={String(zone)} value={String(zone)}>{String(zone)}</option>
            ))}
            {!availableZones.some(z => String(z).toLowerCase() === "general zone") && (
              <option value="General Zone">General Zone</option>
            )}`;

content = content.replace(oldDropdown, newDropdown);
fs.writeFileSync("src/app/team/page.tsx", content, "utf-8");
console.log("Team dropdown fixed again.");

