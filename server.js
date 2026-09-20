const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
// Development keeps the dedicated settings port. Publishing supplies PORT and
// must be allowed to serve both the built SPA and the settings API together.
const PORT = process.env.SETTINGS_PORT || process.env.PORT || 3001;
const SETTINGS_FILE = path.join(__dirname, 'admin-settings.json');
const REPLIT_DB_URL = process.env.REPLIT_DB_URL;
const KV_KEY = 'admin_settings';

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

async function kvGet() {
    if (!REPLIT_DB_URL) return null;
    try {
        const res = await fetch(`${REPLIT_DB_URL}/${KV_KEY}`);
        if (res.status === 404 || !res.ok) return null;
        const val = await res.text();
        if (!val || val === 'null') return null;
        return JSON.parse(decodeURIComponent(val));
    } catch { return null; }
}

async function kvSet(data) {
    if (!REPLIT_DB_URL) return false;
    try {
        const res = await fetch(REPLIT_DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `${KV_KEY}=${encodeURIComponent(JSON.stringify(data))}`,
        });
        return res.ok;
    } catch { return false; }
}

function fileGet() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch { /* ignore */ }
    return null;
}

function fileSet(data) {
    try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2)); } catch { /* ignore */ }
}

app.get('/api/settings', async (req, res) => {
    try {
        const data = (await kvGet()) ?? fileGet();
        res.json(data);
    } catch {
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const data = req.body;
        await kvSet(data);
        fileSet(data);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// The publishing runtime supplies PORT but does not guarantee NODE_ENV=production.
// Keep the local settings-only workflow API-only while allowing the published
// process (which has no SETTINGS_PORT) to serve the built SPA.
const builtIndex = path.join(__dirname, 'dist', 'index.html');
const shouldServeBuiltApp =
    fs.existsSync(builtIndex) &&
    (process.env.NODE_ENV === 'production' || !process.env.SETTINGS_PORT);

if (shouldServeBuiltApp) {
    app.use(express.static(path.join(__dirname, 'dist')));
    // Express 5 requires a named wildcard parameter for SPA fallbacks.
    app.get('/{*splat}', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(builtIndex);
        }
    });
}

app.listen(PORT, '0.0.0.0', () => {
    const kvStatus = REPLIT_DB_URL ? 'KV store enabled — settings sync across all devices' : 'KV store unavailable — file-only storage';
    console.log(`Admin settings server running on 0.0.0.0:${PORT} (${kvStatus})`);
});
