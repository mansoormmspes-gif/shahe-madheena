
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");
content = content.replace(/catch \(err\) \{/g, "catch (err: any) {");
fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");

