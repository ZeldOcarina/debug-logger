// server.mjs
import express from "express";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const app = express();

// Config
const HOST = "127.0.0.1";
const PORT = 43125;
const BASE_DIR =
    path.join(os.homedir(), ".local-debug-logs");

// Ensure log folder exists
fs.mkdirSync(BASE_DIR, { recursive: true });

// Parse JSON bodies
app.use(express.json({ limit: "1mb" }));

// Optional: allow browser apps to post logs (CORS = browser cross-site permission)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.post("/log", (req, res) => {
    try {
        const msg = req.body || {};
        const file = path.join(BASE_DIR, "debug.log");
        const { project: _project, runId: _runId, ...cleanMsg } = msg;

        const line =
            JSON.stringify({
                ts: new Date().toISOString(),
                ...cleanMsg,
            }) + "\n";

        fs.appendFileSync(file, line);
        return res.sendStatus(204);
    } catch (e) {
        return res.status(400).send("bad json");
    }
});

// DELETE all logs
app.delete("/logs", (_req, res) => {
    const file = path.join(BASE_DIR, "debug.log");

    let deleted = 0;
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        deleted = 1;
    }

    return res.json({ ok: true, deleted });
});

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.listen(PORT, HOST, () => {
    console.log(`Local debug logger listening on http://${HOST}:${PORT}/log`);
    console.log(`Writing logs under: ${BASE_DIR}`);
});
