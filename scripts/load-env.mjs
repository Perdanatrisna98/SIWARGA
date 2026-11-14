import fs from "node:fs";

function applyFile(path, { override }) {
  if (!fs.existsSync(path)) return;
  let content;
  try {
    content = fs.readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }

    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

// Muat .env lalu .env.local (nilai .env.local menimpa .env)
applyFile(".env", { override: false });
applyFile(".env.local", { override: true });
