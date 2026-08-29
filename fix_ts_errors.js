
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

content = content.replace(
    /fetchData\(\);\s+fetchCompetitions\(\);/g,
    "fetchData();"
);

content = content.replace(
    "const renderAccordion = (title, items, icon, bgColor, textColor, key) => (",
    "const renderAccordion = (title: string, items: any[], icon: any, bgColor: string, textColor: string, key: string) => ("
);

content = content.replace(
    ") : items.map(c => (",
    ") : items.map((c: any) => ("
);

fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("TS fixed");

