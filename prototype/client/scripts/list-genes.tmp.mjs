import fs from "node:fs";
const t = fs.readFileSync(
  "c:/Users/jamie/OneDrive/Desktop/Prokaryon_v26/prototype/client/src/genes.ts",
  "utf8",
);
const genes = [...t.matchAll(/"id": "(\w+)",\s*"name": "([^"]+)",\s*"category": "([^"]+)",/g)].map(
  (m) => `${m[3]} | ${m[1]} | ${m[2]}`,
);
console.log(genes.join("\n"));
console.log("total:", genes.length);