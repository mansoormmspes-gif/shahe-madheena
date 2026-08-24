
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/results/page.tsx", "utf-8");

content = content.replace(
  /const generatePosterCanvasDataUrl = async \(comp, compResults, template, overrideZone = null\) => \{/,
  "const generatePosterCanvasDataUrl = async (comp: any, compResults: any[], template: string, overrideZone: string | null = null): Promise<string> => {"
);

content = content.replace(
  /return new Promise\(async \(resolve, reject\) => \{/,
  "return new Promise<string>(async (resolve, reject) => {"
);

content = content.replace(
  /const compResults = \[\];/,
  "const compResults: any[] = [];"
);

content = content.replace(
  /catch \(err\) \{/g,
  "catch (err: any) {"
);

// We need to fix the `r =>` and `w =>` by replacing them with `(r: any) =>` and `(w: any) =>` in the `generatePosterCanvasDataUrl` and `handleBulkDownload` functions.
content = content.replace(/r => r.position/g, "(r: any) => r.position");
content = content.replace(/w => {/g, "(w: any) => {");
content = content.replace(/r => r.event_id/g, "(r: any) => r.event_id");

// Fix `(c => c.id` if there are errors, but TS only complained about r and w.

fs.writeFileSync("src/app/admin/results/page.tsx", content, "utf-8");
console.log("Fixed TS");

