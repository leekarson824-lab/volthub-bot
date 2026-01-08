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
  InteractionType
} from "discord.js";
import fs from "fs";
import express from "express";

// ===== EXPRESS (Railway keep-alive) =====
const app = express();
app.get("/", (_, res) => res.send("VoltHub API running"));
app.listen(process.env.PORT || 8080);

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // SAFE intent only
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}

// ===== ENSURE keys.json EXISTS =====
if (!fs.existsSync("./keys.json")) {
  fs.writeFileSync("./keys.json", JSON.stringify({ keys: {} }, null, 2));
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // Register /panel command
  await client.application.commands.create({
    name: "panel",
    description: "Open VoltHub panel"
  });
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (interaction) => {

  // /panel command
  if (interaction.isChatInputCommand() && interaction.commandName === "panel") {
    const embed = new EmbedBuilder()
      .setTitle("⚡ VoltHub")
      .setDescription("Redeem your key or get the script")
      .setColor(0xffff00);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("redeem")
        .setLabel("Redeem Key")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("script")
        .setLabel("Script")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [buttons] });
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    // Redeem button
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

    // Script button
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
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "redeemModal") {
    const key = interaction.fields.getTextInputValue("key").trim();
    const data = JSON.parse(fs.readFileSync("./keys.json", "utf8"));

    if (!data.keys[key]) {
      return interaction.reply({ content: "❌ Invalid key", ephemeral: true });
    }

    if (data.keys[key].used) {
      return interaction.reply({ content: "❌ Key already used", ephemeral: true });
    }

    data.keys[key].used = true;
    data.keys[key].user = interaction.user.id;

    fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: "✅ Key redeemed successfully!",
      ephemeral: true
    });
  }
});

client.login(TOKEN);
