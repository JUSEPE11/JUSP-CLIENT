// lib/profileStore.ts
import fs from "fs/promises";
import path from "path";

type ProfilesDb = Record<string, any>;

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "profiles.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
  }
}

async function readDb(): Promise<ProfilesDb> {
  await ensureDataFile();
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function writeDb(db: ProfilesDb) {
  await ensureDataFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function getStoredProfile(userId: string) {
  const db = await readDb();
  return db[userId] ?? null;
}

export async function setStoredProfile(userId: string, profile: any) {
  const db = await readDb();
  db[userId] = profile ?? {};
  await writeDb(db);
}