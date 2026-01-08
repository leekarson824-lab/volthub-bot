const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;
const PREFIX = "!";
const REQUIRED_ROLE = "Key Admin"; // change if needed

// ===== DEBUG (VERY IMPORTANT) =====
console.log("DEBUG TOKEN TYPE:", typeof TOKEN);
console.log("DEBUG TOKEN LENGTH:", TOKEN ? TOKEN.length : "undefined");

// ===== EXPRESS API =====
const app = express();
app.use(express.json());

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== LOAD KEYS =====
let keys = {};
if (fs.existsSync("keys.json")) {
  try {
    keys = JSON.parse(fs.readFileSync("keys.json", "utf8"));
  } catch (e) {
    console.error("❌ keys.json is invalid JSON");
    process.exit(1);
  }
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

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "genkey") {
    if (!msg.member.roles.cache.some(r => r.name === REQUIRED_ROLE)) {
      return msg.reply("❌ You do not have permission to generate keys.");
    }

    const days = parseInt(args[0]) || 30;
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
  console.log("🌐 API running on port", PORT);
});

// ===== LOGIN =====
if (!TOKEN) {
  console.error("❌ TOKEN ENV VARIABLE IS MISSING");
  process.exit(1);
}

client.login(TOKEN);
