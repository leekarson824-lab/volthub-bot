import express from "express";
import fs from "fs-extra";
import { Client, GatewayIntentBits } from "discord.js";

// ================= CONFIG =================
const PORT = process.env.PORT || 8080;
const TOKEN = process.env.TOKEN; // Railway env var
const KEYS_FILE = "./keys.json";

// ================= FILE SETUP =================
if (!fs.existsSync(KEYS_FILE)) {
  fs.writeJsonSync(KEYS_FILE, {});
}

// ================= HELPERS =================
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

// ================= VALIDATE ENDPOINT =================
app.post("/validate", (req, res) => {
  const { key, robloxId, hwid } = req.body;

  if (!key || !robloxId || !hwid) {
    return res.json({ valid: false, message: "Invalid request." });
  }

  const keys = fs.readJsonSync(KEYS_FILE);
  const data = keys[key];

  if (!data) {
    return res.json({ valid: false, message: "Invalid key." });
  }

  if (data.blacklisted) {
    return res.json({
      valid: false,
      message:
        "❌ This key has been blacklisted.\nPlease open a support ticket."
    });
  }

  // First-time bind
  if (!data.robloxId && !data.hwid) {
    data.robloxId = robloxId;
    data.hwid = hwid;
    keys[key] = data;
    fs.writeJsonSync(KEYS_FILE, keys);
    return res.json({ valid: true });
  }

  // Mismatch = blacklist
  if (data.robloxId !== robloxId || data.hwid !== hwid) {
    data.blacklisted = true;
    keys[key] = data;
    fs.writeJsonSync(KEYS_FILE, keys);

    return res.json({
      valid: false,
      message:
        "⚠ KEY VIOLATION DETECTED ⚠\n\nThis key is locked to another account.\nOpen a support ticket with a screenshot."
    });
  }

  return res.json({ valid: true });
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

// ================= SLASH COMMAND =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "getscript") {
    const userId = interaction.user.id;
    const keys = fs.readJsonSync(KEYS_FILE);

    // Check existing key
    for (const k in keys) {
      if (keys[k].discordId === userId && !keys[k].blacklisted) {
        return interaction.reply({
          content: `🔑 **Your Script Key:**\n\`\`\`${k}\`\`\``,
          ephemeral: true
        });
      }
    }

    // Generate new key
    const newKey = generateScriptKey();
    keys[newKey] = {
      discordId: userId,
      robloxId: null,
      hwid: null,
      blacklisted: false,
      createdAt: Date.now()
    };

    fs.writeJsonSync(KEYS_FILE, keys);

    interaction.reply({
      content: `✅ **Script Key Generated:**\n\`\`\`${newKey}\`\`\``,
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
