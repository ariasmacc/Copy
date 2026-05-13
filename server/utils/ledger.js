const fs = require('fs');
const path = require('path');
const https = require('https'); // Native node module, no install needed

// PASTE MO DITO YUNG DISCORD WEBHOOK URL MO
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1446015658776203377/AMdG9c0Tj-aN-Uqb0NVd_h-zAcZavTFLoqnJVMdQ7YDFUCoQ81hq7W3z2RjsfK7wACdi"; 

/**
 * Audit Ledger Recorder + Discord Mirror
 */
function recordToLedger(type, id, hash, rawString) {
    const timestamp = new Date().toISOString();

    // --- PART 1: Text File Logging (Railway Volume) ---
    try {
        let logPath;
        if (process.env.RAILWAY_ENVIRONMENT) {
            logPath = '/app/data/blockchain_audit_ledger.txt'; 
        } else {
            logPath = path.join(__dirname, 'blockchain_audit_ledger.txt'); 
        }

        const logEntry = `
================================================================
RECORD TYPE : ${type}
TIMESTAMP   : ${timestamp}
RECORD ID   : ${id}
DB HASH     : ${hash}
----------------------------------------------------------------
SECRET RAW STRING:
${rawString}
----------------------------------------------------------------
================================================================
\n`;

        fs.appendFileSync(logPath, logEntry);
        console.log(`✅ [FILE LOG] Recorded ${type} ID: ${id}`);

    } catch (error) {
        console.error("⚠️ [FILE LOG ERROR]", error);
    }

    // --- PART 2: Discord Logging (SAFE PREVIEW) ---
    try {
        if (!DISCORD_WEBHOOK_URL) return;

        // CUT THE STRING IF TOO LONG (Discord Limit is 1024 chars per field)
        const safeRawString = rawString.length > 1000 
            ? rawString.substring(0, 1000) + "... (Truncated for Discord)" 
            : rawString;

        const discordPayload = JSON.stringify({
            username: "Blockchain Audit Bot",
            embeds: [{
                title: `New ${type} Recorded`,
                color: type === 'EXPENSE' ? 15158332 : 3066993,
                fields: [
                    { name: "Record ID", value: `\`${id}\``, inline: true },
                    { name: "Time", value: timestamp, inline: true },
                    { name: "Database Hash", value: `\`${hash}\`` },
                    // DITO ANG FIX: Gamitin ang safeRawString
                    { name: "Secret Data Preview", value: `\`\`\`${safeRawString}\`\`\`` }
                ],
                footer: { text: "Full details stored in Audit Ledger File" }
            }]
        });

        const url = new URL(DISCORD_WEBHOOK_URL);
        const req = https.request({
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(discordPayload) // REQUIRED FIX
            }
        }, (res) => {
            console.log(`📡 [DISCORD STATUS] ${res.statusCode}`);
            if (res.statusCode >= 400) {
                 // ITO ANG MAGSASABI KUNG BAKIT AYAW
                 res.on('data', d => console.error('❌ DISCORD REJECT REASON:', d.toString()));
            }
        });

        req.on('error', (e) => console.error('❌ [NETWORK ERROR]', e));
        req.write(discordPayload);
        req.end();

    } catch (discordErr) {
        console.error("❌ [DISCORD CRASH]", discordErr);
    }
}

module.exports = recordToLedger;