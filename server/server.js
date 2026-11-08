import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : undefined });
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "*").split(",").map(x => x.trim()) }));
app.use(express.json({ limit: "32kb" }));
const port = Number(process.env.PORT || 3000);
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const passwordHash = async password => {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, k) => e ? reject(e) : resolve(k)));
  return salt + ":" + key.toString("hex");
};
const passwordMatches = async (password, stored) => {
  const [salt, keyHex] = stored.split(":");
  const key = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, k) => e ? reject(e) : resolve(k)));
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
};
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Giriş tələb olunur" });
    const result = await pool.query("SELECT k.id,k.slot,k.name,k.username,k.alliance_id FROM sessions s JOIN kingdoms k ON k.id=s.kingdom_id WHERE s.token_hash=$1 AND s.expires_at>NOW()", [hash(token)]);
    if (!result.rowCount) return res.status(401).json({ error: "Sessiya bitib" });
    req.kingdom = result.rows[0]; next();
  } catch (e) { next(e); }
}
app.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true, service: "kralliq-multiplayer", maxKingdoms: 1000 }); }
  catch { res.status(503).json({ ok: false, error: "Database bağlantısı yoxdur" }); }
});
app.get("/api/world", async (_req, res, next) => {
  try {
    const [players, alliances] = await Promise.all([
      pool.query("SELECT k.slot,k.name,k.username,k.alliance_id,a.tag AS alliance_tag FROM kingdoms k LEFT JOIN alliances a ON a.id=k.alliance_id ORDER BY k.slot"),
      pool.query("SELECT id,name,tag,(SELECT COUNT(*)::int FROM kingdoms k WHERE k.alliance_id=a.id) AS members FROM alliances a ORDER BY name")
    ]);
    res.json({ capacity: 1000, occupied: players.rowCount, available: 1000 - players.rowCount, kingdoms: players.rows, alliances: alliances.rows });
  } catch (e) { next(e); }
});
app.post("/api/kingdoms/register", async (req, res, next) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const kingdomName = String(req.body.kingdomName || "").trim();
  const password = String(req.body.password || "");
  if (!/^[a-z0-9_]{3,20}$/.test(username) || kingdomName.length < 2 || kingdomName.length > 32 || password.length < 8)
    return res.status(400).json({ error: "İstifadəçi adı 3–20 simvol, qala adı 2–32 simvol, şifrə ən azı 8 simvol olmalıdır" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const slot = await client.query("SELECT s FROM generate_series(1,1000) AS s WHERE NOT EXISTS (SELECT 1 FROM kingdoms WHERE slot=s) ORDER BY s LIMIT 1 FOR UPDATE");
    if (!slot.rowCount) { await client.query("ROLLBACK"); return res.status(409).json({ error: "Bu dünya doludur: maksimum 1000 krallıq" }); }
    const pass = await passwordHash(password);
    const created = await client.query("INSERT INTO kingdoms(slot,name,username,password_hash) VALUES($1,$2,$3,$4) RETURNING id,slot,name,username", [slot.rows[0].s, kingdomName, username, pass]);
    const token = crypto.randomBytes(32).toString("base64url");
    await client.query("INSERT INTO sessions(token_hash,kingdom_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')", [hash(token), created.rows[0].id]);
    await client.query("COMMIT");
    res.status(201).json({ kingdom: created.rows[0], token });
  } catch (e) { await client.query("ROLLBACK"); if (e.code === "23505") return res.status(409).json({ error: "Bu istifadəçi adı artıq götürülüb" }); next(e); }
  finally { client.release(); }
});
app.post("/api/kingdoms/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const result = await pool.query("SELECT id,slot,name,username,password_hash FROM kingdoms WHERE username=$1", [username]);
    if (!result.rowCount || !(await passwordMatches(String(req.body.password || ""), result.rows[0].password_hash))) return res.status(401).json({ error: "İstifadəçi adı və ya şifrə yanlışdır" });
    const k = result.rows[0], token = crypto.randomBytes(32).toString("base64url");
    await pool.query("INSERT INTO sessions(token_hash,kingdom_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')", [hash(token), k.id]);
    res.json({ kingdom: { id:k.id,slot:k.slot,name:k.name,username:k.username }, token });
  } catch (e) { next(e); }
});
app.get("/api/me", auth, (req, res) => res.json({ kingdom: req.kingdom }));
app.post("/api/alliances", auth, async (req, res, next) => {
  const name = String(req.body.name || "").trim();
  const tag = String(req.body.tag || "").trim().toUpperCase();
  if (name.length < 3 || name.length > 32 || !/^[A-Z0-9]{2,5}$/.test(tag)) return res.status(400).json({ error: "İttifaq adı 3–32 simvol, teq 2–5 hərf/rəqəm olmalıdır" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const me = await client.query("SELECT alliance_id FROM kingdoms WHERE id=$1 FOR UPDATE", [req.kingdom.id]);
    if (me.rows[0].alliance_id) { await client.query("ROLLBACK"); return res.status(409).json({ error: "Artıq ittifaq üzvüsən" }); }
    const alliance = await client.query("INSERT INTO alliances(name,tag,leader_id) VALUES($1,$2,$3) RETURNING id,name,tag", [name,tag,req.kingdom.id]);
    await client.query("UPDATE kingdoms SET alliance_id=$1 WHERE id=$2", [alliance.rows[0].id,req.kingdom.id]);
    await client.query("COMMIT"); res.status(201).json({ alliance: alliance.rows[0] });
  } catch(e) { await client.query("ROLLBACK"); if(e.code==="23505") return res.status(409).json({error:"Bu ad və ya teq artıq istifadə olunur"}); next(e); }
  finally { client.release(); }
});
app.post("/api/alliances/:id/join", auth, async (req,res,next) => {
  try {
    const client=await pool.connect();
    try {
      await client.query("BEGIN");
      const me=await client.query("SELECT alliance_id FROM kingdoms WHERE id=$1 FOR UPDATE",[req.kingdom.id]);
      if(me.rows[0].alliance_id){await client.query("ROLLBACK");return res.status(409).json({error:"Əvvəlcə hazırkı ittifaqdan ayrıl"});}
      const a=await client.query("SELECT id FROM alliances WHERE id=$1",[req.params.id]);
      if(!a.rowCount){await client.query("ROLLBACK");return res.status(404).json({error:"İttifaq tapılmadı"});}
      await client.query("UPDATE kingdoms SET alliance_id=$1 WHERE id=$2",[a.rows[0].id,req.kingdom.id]);
      await client.query("COMMIT");res.json({ok:true});
    }catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}
  }catch(e){next(e)}
});
app.post("/api/alliances/leave", auth, async (req,res,next) => {
  try {
    await pool.query("UPDATE kingdoms SET alliance_id=NULL WHERE id=$1 AND alliance_id IS NOT NULL AND id NOT IN (SELECT leader_id FROM alliances WHERE id=kingdoms.alliance_id)",[req.kingdom.id]);
    res.json({ok:true});
  }catch(e){next(e)}
});
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:"Server xətası"});});
const here=path.dirname(fileURLToPath(import.meta.url));
try { const schema=await fs.readFile(path.join(here,"schema.sql"),"utf8"); await pool.query(schema); }
catch(e){ console.error("Database schema init failed:",e.message); }
app.listen(port,"0.0.0.0",()=>console.log("Kralliq multiplayer API listening on "+port));
