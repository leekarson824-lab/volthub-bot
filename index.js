import express from "express";
import fs from "fs";
import { Client, GatewayIntentBits } from "discord.js";

// ================= CONFIG =================
const PORT = process.env.PORT || 8080;
const TOKEN = process.env.TOKEN;
const KEYS_FILE = "./keys.json";

// ================= FILE SETUP =================
if (!fs.existsSync(KEYS_FILE)) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify({}, null, 2));
}

// ================= HELPERS =================
function readKeys() {
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
}

function saveKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

function generateScriptKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "SCRIPT-";
  for (let i = 0; i < 30; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ================= EXPRESS =================
const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.send("VoltHub API running");
});

// ================= VALIDATE =================
app.post("/validate", (req, res) => {
  const { key, robloxId, hwid } = req.body;
  if (!key || !robloxId || !hwid)
    return res.json({ valid: false });

  const keys = readKeys();
  const data = keys[key];

  if (!data || data.blacklisted)
    return res.json({ valid: false });

  if (!data.robloxId && !data.hwid) {
    data.robloxId = robloxId;
    data.hwid = hwid;
    saveKeys(keys);
    return res.json({ valid: true });
  }

  if (data.robloxId !== robloxId || data.hwid !== hwid) {
    data.blacklisted = true;
    saveKeys(keys);
    return res.json({
      valid: false,
      message:
        "Key locked to another account. Open a support ticket."
    });
  }

  res.json({ valid: true });
});

// ================= START API =================
app.listen(PORT, () => {
  console.log(`🌐 API running on port ${PORT}`);
});

// ================= DISCORD BOT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "getscript") {
    const keys = readKeys();
    const userId = interaction.user.id;

    for (const k in keys) {
      if (keys[k].discordId === userId && !keys[k].blacklisted) {
        return interaction.reply({
          content: `🔑 **Your Script Key:**\n\`\`\`${k}\`\`\``,
          ephemeral: true
        });
      }
    }

    const newKey = generateScriptKey();
    keys[newKey] = {
      discordId: userId,
      robloxId: null,
      hwid: null,
      blacklisted: false,
      createdAt: Date.now()
    };

    saveKeys(keys);

    interaction.reply({
      content: `✅ **New Script Key:**\n\`\`\`${newKey}\`\`\``,
      ephemeral: true
    });
  }
});

// ================= LOGIN =================
if (!TOKEN) {
  console.error("❌ TOKEN ENV VARIABLE IS MISSING");
  process.exit(1);
}

client.login(TOKEN);
