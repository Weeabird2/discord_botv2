import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "./config.js";
import { WOW_CLASSES } from "./wow-data.js";

const commandData = [
  new SlashCommandBuilder()
    .setName("raid-post")
    .setDescription(
      "Erstellt sofort die Verfuegbarkeitsabfrage fuer die naechste Raid-Woche.",
    ),
  new SlashCommandBuilder()
    .setName("raid-finalize")
    .setDescription("Wertet die aktuelle Raid-Woche sofort aus."),
  new SlashCommandBuilder()
    .setName("raid-finalize-now")
    .setDescription(
      "Finalisiert die aktive naechste Raid-Woche sofort fuer Tests.",
    ),
  new SlashCommandBuilder()
    .setName("raid-reset")
    .setDescription(
      "Loescht den aktiven Raid-Post und setzt die aktuelle Planung fuer Tests zurueck.",
    ),
  new SlashCommandBuilder()
    .setName("raid-status")
    .setDescription("Zeigt den Status der aktuellen Raid-Planung."),
  new SlashCommandBuilder()
    .setName("raid-profile")
    .setDescription(
      "Speichert deine WoW-Klasse und Spec fuer kuenftige Anmeldungen.",
    )
    .addStringOption((option) =>
      option
        .setName("klasse")
        .setDescription("Deine WoW-Klasse")
        .setRequired(true)
        .addChoices(
          ...WOW_CLASSES.map((wowClass) => ({
            name: wowClass.label,
            value: wowClass.key,
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("spec")
        .setDescription("Deine Spec")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  new SlashCommandBuilder()
    .setName("raid-config")
    .setDescription("Setzt den Zielkanal fuer Abfragen und Auswertungen.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Discord-Kanal fuer den Bot")
        .setRequired(true),
    ),
].map((command) => command.toJSON());

export async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.token);

  if (config.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      {
        body: commandData,
      },
    );
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: commandData,
  });
}
