import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  PermissionsBitField
} from "discord.js";
import fs from "fs";
import crypto from "crypto";
import express from "express";

// ===== EXPRESS =====
const app = express();
app.get("/", (_, res) => res.send("VoltHub API running"));
app.listen(process.env.PORT || 8080);

// ===== DISCORD =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}

// ===== AUTO CREATE keys.json =====
if (!fs.existsSync("./keys.json")) {
  fs.writeFileSync("./keys.json", JSON.stringify({ keys: {} }, null, 2));
}

// ===== UTIL: LONG KEY GENERATOR =====
function generateKey() {
  return "VOLT-" + crypto.randomBytes(16).toString("hex").toUpperCase();
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  await client.application.commands.set([
    {
      name: "panel",
      description: "Open VoltHub panel"
    },
    {
      name: "genkey",
      description: "Generate a premium key (admin only)"
    }
  ]);
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (interaction) => {

  // ===== /panel =====
  if (interaction.isChatInputCommand() && interaction.commandName === "panel") {
    const embed = new EmbedBuilder()
      .setTitle("⚡ VoltHub")
      .setDescription("Redeem your key or get the script")
      .setColor(0xffff00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("redeem")
        .setLabel("Redeem Key")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("script")
        .setLabel("Script")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ===== /genkey (ADMIN ONLY) =====
  if (interaction.isChatInputCommand() && interaction.commandName === "genkey") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ Admins only",
        ephemeral: true
      });
    }

    const data = JSON.parse(fs.readFileSync("./keys.json", "utf8"));
    const key = generateKey();

    data.keys[key] = {
      used: false,
      createdBy: interaction.user.id,
      createdAt: Date.now()
    };

    fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `✅ **New Premium Key**\n\`${key}\``,
      ephemeral: true
    });
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    if (interaction.customId === "redeem") {
      const modal = new ModalBuilder()
        .setCustomId("redeemModal")
        .setTitle("Redeem Key");

      const input = new TextInputBuilder()
        .setCustomId("key")
        .setLabel("Enter your key")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === "script") {
      return interaction.reply({
        content:
```lua
loadstring(game:HttpGet("https://yourdomain/script.lua?key=YOUR_KEY_HERE"))()
```,
        ephemeral: true
      });
    }
  }

  // ===== MODAL SUBMIT =====
  if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "redeemModal"
  ) {
    const key = interaction.fields.getTextInputValue("key").trim();
    const data = JSON.parse(fs.readFileSync("./keys.json", "utf8"));

    if (!data.keys[key]) {
      return interaction.reply({
        content: "❌ Invalid key",
        ephemeral: true
      });
    }

    if (data.keys[key].used) {
      return interaction.reply({
        content: "❌ Key already used",
        ephemeral: true
      });
    }

    data.keys[key].used = true;
    data.keys[key].usedBy = interaction.user.id;
    data.keys[key].usedAt = Date.now();

    fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: "✅ Key redeemed successfully!",
      ephemeral: true
    });
  }
});

client.login(TOKEN);

