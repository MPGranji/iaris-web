import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const local = path.join(root, ".local");
const data = path.join(local, "postgres");
const bin = process.env.PG_BIN ?? "C:\\Program Files\\PostgreSQL\\18\\bin";
const command = process.argv[2] ?? "setup";
const run = (name, args, env = {}, quiet = false) =>
  execFileSync(path.join(bin, `${name}.exe`), args, {
    cwd: root,
    windowsHide: true,
    stdio: quiet ? "ignore" : "pipe",
    env: { ...process.env, ...env },
  });
if (!existsSync(path.join(bin, "pg_ctl.exe")))
  throw new Error("Set PG_BIN to your PostgreSQL bin directory.");
if (command === "stop") {
  if (existsSync(path.join(data, "postmaster.pid")))
    run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
  console.log("Development PostgreSQL stopped.");
  process.exit(0);
}
mkdirSync(local, { recursive: true });
const configPath = path.join(local, "database.json");
if (!existsSync(configPath)) {
  if (existsSync(path.join(root, "backend", ".env")) || existsSync(data))
    throw new Error("Existing development config detected; refusing to overwrite.");
  const config = {
    port: 5441,
    user: "iaris_dev",
    database: "iaris_dev",
    password: randomBytes(24).toString("hex"),
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2), { flag: "wx" });
}
const config = JSON.parse(readFileSync(configPath, "utf8"));
if (!existsSync(path.join(data, "PG_VERSION"))) {
  const passwordFile = path.join(local, "init-password");
  writeFileSync(passwordFile, config.password, { flag: "w" });
  try {
    run("initdb", [
      "-D",
      data,
      "-U",
      config.user,
      "-A",
      "scram-sha-256",
      "--pwfile",
      passwordFile,
      "--encoding=UTF8",
      "--locale=C",
    ]);
  } finally {
    unlinkSync(passwordFile);
  }
}
let running = false;
try {
  run("pg_ctl", ["-D", data, "status"]);
  running = true;
} catch {
  /* Start only our own cluster. */
}
if (!running)
  run(
    "pg_ctl",
    [
      "-D",
      data,
      "-l",
      path.join(local, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${config.port}`,
      "-w",
      "start",
    ],
    {},
    true,
  );
const connection = [
  "-h",
  "127.0.0.1",
  "-p",
  String(config.port),
  "-U",
  config.user,
];
const pgEnv = { PGPASSWORD: config.password };
const found = run(
  "psql",
  [
    ...connection,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = 'iaris_dev'`,
  ],
  pgEnv,
)
  .toString()
  .trim();
if (found !== "1") run("createdb", [...connection, config.database], pgEnv);
const envPath = path.join(root, "backend", ".env");
if (!existsSync(envPath)) {
  const password = randomBytes(18).toString("base64url");
  const email = "admin@iaris.local";
  writeFileSync(
    envPath,
    `DATABASE_URL="postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/${config.database}?schema=public"\nPORT=4001\nAPP_ORIGINS="http://127.0.0.1:5176,http://localhost:5176"\nBOOTSTRAP_ADMIN_EMAIL="${email}"\nBOOTSTRAP_ADMIN_PASSWORD="${password}"\n`,
    { flag: "wx" },
  );
  writeFileSync(
    path.join(local, "admin-access.txt"),
    `IARIS development (local only)\nAdmin: http://127.0.0.1:5176/\nWebsite: http://127.0.0.1:5175/\nEmail: ${email}\nPassword: ${password}\n`,
    { flag: "wx" },
  );
}
console.log(
  "Development PostgreSQL ready at 127.0.0.1:5441/iaris_dev. Credentials: .local/admin-access.txt (gitignored).",
);
