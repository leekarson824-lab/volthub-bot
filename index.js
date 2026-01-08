const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

// ===== CONFIG =====
const TOKEN = process.env.TOKEN; // Discord bot token (Railway variable)
const PORT = process.env.PORT || 3000;
const PREFIX = "!";

// ===== EXPRESS (API FOR ROBLOX) =====
const app = express();
app.use(express.json());

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== LOAD / SAVE KEYS =====
let keys = {};
if (fs.existsSync("keys.json")) {
  keys = JSON.parse(fs.readFileSync("keys.json"));
}

function saveKeys() {
  fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));
}

// ===== KEY GENERATOR =====
function generateKey() {
  return (
    "VH-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

// ===== DISCORD COMMANDS =====
client.on("messageCreate", (msg) => {
  if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

  const args = msg.content.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  // !genkey [days]
  if (command === "genkey") {
    const days = parseInt(args[0]) || 30; // default 30 days
    const key = generateKey();

    keys[key] = {
      expires: Date.now() + days * 24 * 60 * 60 * 1000
    };

    saveKeys();
    msg.reply(
      `⚡ **VoltHub Premium Key**\n\`${key}\`\n⏳ Expires in **${days} days**`
    );
  }
});

// ===== API ENDPOINT =====
app.get("/check", (req, res) => {
  const key = req.query.key;

  if (!key || !keys[key]) {
    return res.json({ valid: false });
  }

  if (Date.now() > keys[key].expires) {
    delete keys[key];
    saveKeys();
    return res.json({ valid: false });
  }

  return res.json({ valid: true });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("🌐 API running on port " + PORT);
});

client.login(TOKEN);
