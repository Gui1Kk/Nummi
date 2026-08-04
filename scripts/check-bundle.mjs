import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../dist/assets/", import.meta.url);
let total = 0;
for (const name of await readdir(root)) {
  if (!name.endsWith(".js")) continue;
  const size = (await stat(join(root.pathname, name))).size;
  total += size;
  if (size > 700_000) throw new Error(`${name} excede 700 KB sem compressão (${size} bytes).`);
}
if (total > 1_800_000) throw new Error(`JavaScript total excede 1,8 MB sem compressão (${total} bytes).`);
console.log(`Bundle JS dentro do orçamento: ${total} bytes.`);
