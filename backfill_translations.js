/**
 * Backfill de traducciones zh-CN para órdenes y máquinas en Firestore.
 * Usa las mismas credenciales (.env) que index.js.
 * Ejecuta: `node backfill_translations.js`
 */
require("dotenv").config();
const admin = require("firebase-admin");
const translate = require("@iamtraction/google-translate");

// === Firebase admin init (copiado de index.js) ===
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const CACHE = new Map();
const SLEEP_MS = 250; // para no saturar API

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function translateSafe(text) {
  if (!text) return "";
  if (CACHE.has(text)) return CACHE.get(text);
  const { text: zh } = await translate(text, { to: "zh-CN" });
  CACHE.set(text, zh);
  return zh;
}

async function backfillOrders() {
  const snap = await db.collection("orders").get();
  console.log(`Órdenes: ${snap.size}`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const needsTitle = !data.title_zh;
    const needsMachine = !data.machine_zh;
    const needsDesc = !data.description_zh;

    if (!needsTitle && !needsMachine && !needsDesc) continue;

    const update = {};
    if (needsTitle) update.title_zh = await translateSafe(data.title || "");
    if (needsMachine) update.machine_zh = await translateSafe(data.machine || "");
    if (needsDesc) update.description_zh = await translateSafe(data.description || "");

    await doc.ref.update(update);
    console.log(`✓ Orden ${doc.id} actualizada`);
    await sleep(SLEEP_MS);
  }
}

async function backfillMachines() {
  const snap = await db.collection("machines").get();
  console.log(`Máquinas: ${snap.size}`);

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.name_zh) continue;

    const name_zh = await translateSafe(data.name || "");
    await doc.ref.update({ name_zh });
    console.log(`✓ Máquina ${doc.id} actualizada`);
    await sleep(SLEEP_MS);
  }
}

async function main() {
  try {
    await backfillOrders();
    await backfillMachines();
    console.log("Listo ✅");
  } catch (err) {
    console.error("Error en backfill:", err);
    process.exit(1);
  }
}

main();
