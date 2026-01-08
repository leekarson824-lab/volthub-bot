const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

// ===== READY =====
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log("🌐 API running on port 8080");
});

// ===== PANEL COMMAND =====
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.content !== "!panel") return;

  const embed = new EmbedBuilder()
    .setTitle("⚡ VoltHub Premium Control Panel")
    .setDescription(
      "Use the buttons below to redeem your key, get the script, or manage your access."
    )
    .setColor(0x000000);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("redeem_key")
      .setLabel("Redeem Key")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("get_script")
      .setLabel("Get Script")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("get_role")
      .setLabel("Get Role")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("reset_hwid")
      .setLabel("Reset HWID")
      .setStyle(ButtonStyle.Danger)
  );

  await msg.channel.send({ embeds: [embed], components: [row] });
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (interaction) => {

  // ---- BUTTONS ----
  if (interaction.isButton()) {

    if (interaction.customId === "redeem_key") {
      const modal = new ModalBuilder()
        .setCustomId("redeem_modal")
        .setTitle("Redeem a key");

      const keyInput = new TextInputBuilder()
        .setCustomId("script_key")
        .setLabel("Enter script key below:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(keyInput)
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === "get_script") {
      return interaction.reply({
        content:
          "📜 **Your Script:**\n```lua\nloadstring(game:HttpGet('https://your-api-url/script'))()\n```",
        ephemeral: true
      });
    }

    if (interaction.customId === "get_role") {
      return interaction.reply({
        content: "👤 Role assignment coming soon.",
        ephemeral: true
      });
    }

    if (interaction.customId === "reset_hwid") {
      return interaction.reply({
        content: "♻️ HWID reset request received.",
        ephemeral: true
      });
    }
  }

  // ---- MODAL SUBMIT ----
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "redeem_modal") {
      const key = interaction.fields.getTextInputValue("script_key");

      console.log("🔑 KEY SUBMITTED:", key);
      console.log("👤 USER:", interaction.user.tag);

      // TODO: validate key with your backend / database

      return interaction.reply({
        content: "✅ Key received. Validating...",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);
