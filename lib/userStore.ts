// lib/userStore.ts
// PRO MAX (local persistente): users.json + hash seguro (scrypt).
// Mantiene las firmas usadas por tu login: verifyUserPassword(email, password)

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type UserRole = "admin" | "operator" | "user";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string; // scrypt
  passwordSalt: string; // base64
  createdAt: string;
};

type StoreShape =
  | { users: StoredUser[] }
  | StoredUser[];

const STORE_DIR = path.join(process.cwd(), ".jusp");
const STORE_FILE = path.join(STORE_DIR, "users.json");

async function ensureStore() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(
      STORE_FILE,
      JSON.stringify({ users: [] }, null, 2),
      "utf8"
    );
  }
}

async function readStore(): Promise<{ users: StoredUser[] }> {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");

  let parsed: StoreShape;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { users: [] };
  }

  if (Array.isArray(parsed)) return { users: parsed };

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as any).users)
  ) {
    return parsed as any;
  }

  return { users: [] };
}

async function writeStore(store: { users: StoredUser[] }) {
  await ensureStore();
  await fs.writeFile(
    STORE_FILE,
    JSON.stringify(store, null, 2),
    "utf8"
  );
}

function normEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function newId() {
  return crypto.randomBytes(16).toString("hex");
}

function scryptHash(password: string, saltB64: string) {
  const salt = Buffer.from(saltB64, "base64");
  const key = crypto.scryptSync(password, salt, 64);
  return key.toString("base64");
}

function timingSafeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);

  if (ab.length !== bb.length) return false;

  return crypto.timingSafeEqual(ab, bb);
}

export async function getUserByEmail(
  email: string
): Promise<StoredUser | null> {
  const e = normEmail(email);
  if (!e) return null;

  const store = await readStore();
  return store.users.find((u) => normEmail(u.email) === e) ?? null;
}

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<
  | { ok: true; user: StoredUser }
  | { ok: false; error: string }
> {
  const name = String(params.name || "").trim();
  const email = normEmail(params.email);
  const password = String(params.password || "");

  if (name.length < 2)
    return { ok: false, error: "Nombre inválido" };

  if (!email || !email.includes("@"))
    return { ok: false, error: "Correo inválido" };

  if (password.length < 4)
    return { ok: false, error: "Contraseña muy corta" };

  const store = await readStore();

  const exists = store.users.some(
    (u) => normEmail(u.email) === email
  );

  if (exists)
    return {
      ok: false,
      error: "Ese correo ya está registrado",
    };

  const salt = crypto.randomBytes(16).toString("base64");
  const passwordHash = scryptHash(password, salt);

  const user: StoredUser = {
    id: newId(),
    name,
    email,
    role: (params.role ?? "user") as UserRole,
    passwordHash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  await writeStore(store);

  return { ok: true, user };
}

// ✅ Usado por /api/auth/login
export async function verifyUserPassword(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = await getUserByEmail(email);

  if (!user) return null;

  const candidate = scryptHash(
    String(password || ""),
    user.passwordSalt
  );

  const ok = timingSafeEq(candidate, user.passwordHash);

  return ok ? user : null;
}

// ✅ Fix para que compile onboarding
export async function updateUserProfile(params: {
  email: string;
  name?: string;
  role?: UserRole;
}): Promise<
  | { ok: true; user: StoredUser }
  | { ok: false; error: string }
> {
  const email = normEmail(params.email);

  if (!email)
    return { ok: false, error: "Correo inválido" };

  const store = await readStore();

  const idx = store.users.findIndex(
    (u) => normEmail(u.email) === email
  );

  if (idx === -1)
    return { ok: false, error: "Usuario no existe" };

  const current = store.users[idx];

  const next: StoredUser = {
    ...current,
    name:
      typeof params.name === "string"
        ? String(params.name).trim() || current.name
        : current.name,
    role: params.role ?? current.role,
  };

  store.users[idx] = next;

  await writeStore(store);

  return { ok: true, user: next };
}