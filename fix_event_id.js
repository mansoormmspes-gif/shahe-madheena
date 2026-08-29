
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

content = content.replace(
  `select("competition_id, points")`,
  `select("event_id, points")`
);

content = content.replaceAll("r.competition_id", "r.event_id");

fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Replaced competition_id with event_id");

