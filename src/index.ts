import { Client, Events, GatewayIntentBits, Interaction } from "discord.js";
import cron from "node-cron";
import { config } from "./config.js";
import { registerCommands } from "./commands.js";
import { RaidService } from "./raid-service.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
let raidService: RaidService | null = null;

client.once(Events.ClientReady, async (readyClient) => {
  raidService = new RaidService(readyClient);
  await raidService.init();
  await registerCommands();
  const service = raidService;

  cron.schedule(
    config.postCron,
    async () => {
      try {
        await service.postUpcomingPoll();
      } catch (error) {
        console.error("Failed to post raid poll:", error);
      }
    },
    { timezone: config.timezone },
  );

  cron.schedule(
    config.finalizeCron,
    async () => {
      try {
        await service.finalizeCurrentWindow();
      } catch (error) {
        console.error("Failed to finalize raid week:", error);
      }
    },
    { timezone: config.timezone },
  );

  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!raidService) {
    return;
  }
  const service = raidService;

  try {
    if (interaction.isAutocomplete()) {
      await service.handleAutocomplete(interaction);
      return;
    }

    if (interaction.isButton()) {
      await service.handleButton(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await service.handleSelect(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    switch (interaction.commandName) {
      case "raid-post":
        await service.postUpcomingPoll(interaction);
        break;
      case "raid-profile":
        await service.setProfile(interaction);
        break;
      case "raid-reset":
        await service.resetActiveWindow(interaction);
        break;
      case "raid-finalize":
        await service.finalizeCurrentWindow(interaction);
        break;
      case "raid-finalize-now":
        await service.finalizeActiveWindowNow(interaction);
        break;
      case "raid-status":
        await service.showStatus(interaction);
        break;
      case "raid-config":
        await service.setChannel(interaction);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Interaction error:", error);
    const payload = {
      content: "Aktion fehlgeschlagen. Details stehen im Bot-Log.",
      flags: ["Ephemeral"] as const,
    };
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
});

await client.login(config.token);
