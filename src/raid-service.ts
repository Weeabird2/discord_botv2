import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import { DateTime } from "luxon";
import { config } from "./config.js";
import {
  formatWindowId,
  getCurrentRaidWindow,
  getRaidDates,
  getUpcomingRaidWindow,
} from "./date-utils.js";
import { loadState, saveState } from "./state.js";
import { AppState, PlayerProfile, RaidWindow } from "./types.js";
import {
  getClassDefinition,
  getSpecDefinition,
  ROLE_META,
  WOW_CLASSES,
  WowRole,
} from "./wow-data.js";

const TOGGLE_PREFIX = "raid:toggle";
const CLEAR_PREFIX = "raid:clear";
const SELECT_PREFIX = "raid:select";

function getRoleOrder(role: WowRole): number {
  if (role === "tank") {
    return 0;
  }

  if (role === "heal") {
    return 1;
  }

  return 2;
}

function formatProfile(profile: PlayerProfile): string {
  const wowClass = getClassDefinition(profile.wowClass);
  const spec = getSpecDefinition(profile.wowClass, profile.spec);
  if (!wowClass || !spec) {
    return "Unbekanntes Profil";
  }

  return `${wowClass.icon} ${spec.icon} ${spec.label} ${wowClass.label}`;
}

function ensureTextChannel(
  channel: { type?: ChannelType } | null,
): TextChannel {
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Configured channel is not a text channel.");
  }

  return channel as TextChannel;
}

function buildVoteSummary(window: RaidWindow, zone: string): string {
  const rows = getRaidDates(DateTime.fromISO(window.startDate, { zone })).map(
    (date) => {
      const key = date.toISODate()!;
      const count = window.votes[key]?.length ?? 0;
      return `${date.toFormat("ccc dd.LL")}: ${count} Stimme(n)`;
    },
  );

  return rows.join("\n");
}

function buildOtherDaysCompactSummary(
  window: RaidWindow,
  zone: string,
): string {
  const selected = new Set(window.selectedDays ?? []);
  const rows = getRaidDates(DateTime.fromISO(window.startDate, { zone }))
    .filter((date) => !selected.has(date.toISODate()!))
    .map((date) => {
      const key = date.toISODate()!;
      const count = window.votes[key]?.length ?? 0;
      return `${date.toFormat("ccc")} ${count}`;
    });

  return rows.length > 0 ? rows.join(" | ") : "Keine weiteren Tage";
}

function buildGroupedRoster(
  userIds: string[],
  profiles: Record<string, PlayerProfile>,
): string {
  const buckets: Record<WowRole, string[]> = {
    tank: [],
    heal: [],
    dd: [],
  };

  const sortedUsers = [...userIds].sort((left, right) => {
    const leftProfile = profiles[left];
    const rightProfile = profiles[right];
    const leftSpec = leftProfile
      ? getSpecDefinition(leftProfile.wowClass, leftProfile.spec)
      : undefined;
    const rightSpec = rightProfile
      ? getSpecDefinition(rightProfile.wowClass, rightProfile.spec)
      : undefined;

    const leftRole = leftSpec?.role ?? "dd";
    const rightRole = rightSpec?.role ?? "dd";
    if (leftRole !== rightRole) {
      return getRoleOrder(leftRole) - getRoleOrder(rightRole);
    }

    return left.localeCompare(right);
  });

  for (const userId of sortedUsers) {
    const profile = profiles[userId];
    if (!profile) {
      buckets.dd.push(`❔ <@${userId}> Profil fehlt`);
      continue;
    }

    const wowClass = getClassDefinition(profile.wowClass);
    const spec = getSpecDefinition(profile.wowClass, profile.spec);
    if (!wowClass || !spec) {
      buckets.dd.push(`❔ <@${userId}> Ungueltiges Profil`);
      continue;
    }

    buckets[spec.role].push(
      `${wowClass.icon} ${spec.icon} <@${userId}> ${spec.label} ${wowClass.label}`,
    );
  }

  return (["tank", "heal", "dd"] as const)
    .map((role) => {
      const title = `${ROLE_META[role].icon} ${ROLE_META[role].label}`;
      const lines = buckets[role];
      return `${title}: ${lines.length > 0 ? lines.join(", ") : "Niemand"}`;
    })
    .join("\n");
}

function buildNameList(userIds: string[]): string {
  if (userIds.length === 0) {
    return "Niemand";
  }

  return userIds.map((userId) => `<@${userId}>`).join(", ");
}

function addAvailabilityFields(
  embed: EmbedBuilder,
  window: RaidWindow,
  zone: string,
): EmbedBuilder {
  for (const date of getRaidDates(
    DateTime.fromISO(window.startDate, { zone }),
  )) {
    const key = date.toISODate()!;
    const users = window.votes[key] ?? [];
    embed.addFields({
      name: `${date.toFormat("cccc dd.LL")} (${users.length})`,
      value: buildNameList(users),
      inline: false,
    });
  }

  return embed;
}

function addGroupedRosterFields(
  embed: EmbedBuilder,
  window: RaidWindow,
  zone: string,
  profiles: Record<string, PlayerProfile>,
): EmbedBuilder {
  const dates =
    window.selectedDays && window.selectedDays.length > 0
      ? window.selectedDays.map((day) => DateTime.fromISO(day, { zone }))
      : getRaidDates(DateTime.fromISO(window.startDate, { zone }));

  for (const date of dates) {
    const key = date.toISODate()!;
    const users = window.votes[key] ?? [];
    embed.addFields({
      name: `${date.toFormat("cccc dd.LL")} (${users.length})`,
      value: buildGroupedRoster(users, profiles),
      inline: false,
    });
  }

  return embed;
}

function buildComponents(window: RaidWindow, zone: string) {
  const dateStrings = window.finalized
    ? (window.selectedDays ?? [])
    : getRaidDates(DateTime.fromISO(window.startDate, { zone })).map(
        (date) => date.toISODate()!,
      );

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${SELECT_PREFIX}:${window.id}`)
    .setPlaceholder(
      window.finalized
        ? "Raidtage an- oder abmelden"
        : "Verfuegbare Tage fuer die Raid-Woche waehlen",
    )
    .setMinValues(0)
    .setMaxValues(Math.max(1, dateStrings.length));

  for (const day of dateStrings) {
    const date = DateTime.fromISO(day, { zone });
    const count = window.votes[day]?.length ?? 0;
    select.addOptions({
      label: date.toFormat("cccc dd.LL"),
      value: day,
      description: `${count} Anmeldung(en)`,
    });
  }

  const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
  ];

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CLEAR_PREFIX}:${window.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(
          window.finalized
            ? "Alle finalen Tage abmelden"
            : "Meine Auswahl loeschen",
        ),
    ),
  );

  return rows;
}

function buildPollEmbed(
  window: RaidWindow,
  zone: string,
  profiles: Record<string, PlayerProfile>,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("WoW Raid-Verfuegbarkeit")
    .setDescription(
      [
        `Raid-Woche: **${DateTime.fromISO(window.startDate, { zone }).toFormat("dd.LL.yyyy")} bis ${DateTime.fromISO(window.endDate, { zone }).toFormat("dd.LL.yyyy")}**`,
        "Lege zuerst einmalig dein Profil mit `/raid-profile` fest. Danach waehlst du im Menue alle Tage, an denen du Zeit hast.",
        "",
        buildVoteSummary(window, zone),
      ].join("\n"),
    )
    .setFooter({ text: "Automatische Auswertung am Mittwoch" });

  return addAvailabilityFields(embed, window, zone);
}

function buildFinalizedEmbed(
  window: RaidWindow,
  zone: string,
  profiles: Record<string, PlayerProfile>,
): EmbedBuilder {
  const selected = (window.selectedDays ?? []).map((day) =>
    DateTime.fromISO(day, { zone }).toFormat("cccc dd.LL"),
  );

  const embed = new EmbedBuilder()
    .setTitle("Raidtage festgelegt")
    .setDescription(
      [
        `Raid-Woche: **${DateTime.fromISO(window.startDate, { zone }).toFormat("dd.LL.yyyy")} bis ${DateTime.fromISO(window.endDate, { zone }).toFormat("dd.LL.yyyy")}**`,
        selected.length > 0
          ? `Geplante Raidtage: **${selected.join("** und **")}**`
          : "Keine Raidtage ermittelt.",
        "",
        `Restliche Tage: ${buildOtherDaysCompactSummary(window, zone)}`,
        "",
        "Du kannst dich unten weiterhin fuer die finalen Raidtage an- oder abmelden.",
      ].join("\n"),
    );

  return addGroupedRosterFields(embed, window, zone, profiles);
}

function pickTopRaidDays(window: RaidWindow, zone: string): string[] {
  const ranked = getRaidDates(DateTime.fromISO(window.startDate, { zone }))
    .map((date) => ({
      day: date.toISODate()!,
      count: window.votes[date.toISODate()!]?.length ?? 0,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.day.localeCompare(right.day);
    });

  return ranked
    .filter((entry) => entry.count > 0)
    .slice(0, 2)
    .map((entry) => entry.day);
}

export class RaidService {
  constructor(private readonly client: Client<true>) {}

  private state: AppState = {};

  async init(): Promise<void> {
    this.state = await loadState();
    this.state.profiles ??= {};
    if (!this.state.channelId && config.defaultChannelId) {
      this.state.channelId = config.defaultChannelId;
      await saveState(this.state);
    }
  }

  async handleAutocomplete(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    if (interaction.commandName !== "raid-profile") {
      return;
    }

    const focused = interaction.options.getFocused(true);
    if (focused.name !== "spec") {
      await interaction.respond([]);
      return;
    }

    const classKey = interaction.options.getString("klasse");
    const wowClass = classKey ? getClassDefinition(classKey) : undefined;
    if (!wowClass) {
      await interaction.respond([]);
      return;
    }

    const query = focused.value.toLowerCase();
    const matches = wowClass.specs
      .filter((spec) => spec.label.toLowerCase().includes(query))
      .slice(0, 25)
      .map((spec) => ({
        name: `${spec.icon} ${spec.label} (${ROLE_META[spec.role].label})`,
        value: spec.key,
      }));

    await interaction.respond(matches);
  }

  async setProfile(interaction: ChatInputCommandInteraction): Promise<void> {
    const classKey = interaction.options.getString("klasse", true);
    const specKey = interaction.options.getString("spec", true);
    const wowClass = getClassDefinition(classKey);
    const spec = getSpecDefinition(classKey, specKey);

    if (!wowClass || !spec) {
      await interaction.reply({
        content: "Die gewaehlte Klasse oder Spec ist ungueltig.",
        flags: ["Ephemeral"],
      });
      return;
    }

    this.state.profiles ??= {};
    this.state.profiles[interaction.user.id] = {
      userId: interaction.user.id,
      wowClass: classKey,
      spec: specKey,
      updatedAt: DateTime.now().setZone(config.timezone).toISO()!,
    };
    await saveState(this.state);

    await interaction.reply({
      content: `Profil gespeichert: ${formatProfile(this.state.profiles[interaction.user.id])}.`,
      flags: ["Ephemeral"],
    });
  }

  async setChannel(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel("channel", true);
    this.state.channelId = channel.id;
    await saveState(this.state);
    await interaction.reply({
      content: `Raid-Kanal gesetzt auf <#${channel.id}>.`,
      flags: ["Ephemeral"],
    });
  }

  async postUpcomingPoll(
    interaction?: ChatInputCommandInteraction,
  ): Promise<void> {
    const zone = config.timezone;
    const now = DateTime.now().setZone(zone);
    const { start, end } = getUpcomingRaidWindow(now);
    const windowId = formatWindowId(start, end);

    if (!this.state.channelId) {
      throw new Error("No target channel configured. Use /raid-config first.");
    }

    if (
      this.state.activeWindow?.id === windowId &&
      this.state.activeWindow.messageId
    ) {
      if (interaction) {
        await interaction.reply({
          content: "Die Abfrage fuer diese Raid-Woche existiert bereits.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    const channel = ensureTextChannel(
      await this.client.channels.fetch(this.state.channelId),
    );

    const newWindow: RaidWindow = {
      id: windowId,
      startDate: start.toISODate()!,
      endDate: end.toISODate()!,
      finalized: false,
      votes: {},
      createdAt: now.toISO()!,
      channelId: channel.id,
    };

    const message = await channel.send({
      embeds: [buildPollEmbed(newWindow, zone, this.state.profiles ?? {})],
      components: buildComponents(newWindow, zone),
    });

    newWindow.messageId = message.id;
    this.state.activeWindow = newWindow;
    await saveState(this.state);

    if (interaction) {
      await interaction.reply({
        content: `Raid-Abfrage fuer ${start.toFormat("dd.LL")} bis ${end.toFormat("dd.LL")} wurde erstellt.`,
        flags: ["Ephemeral"],
      });
    }
  }

  async finalizeCurrentWindow(
    interaction?: ChatInputCommandInteraction,
  ): Promise<void> {
    const zone = config.timezone;
    const current = this.state.activeWindow;

    if (!current) {
      if (interaction) {
        await interaction.reply({
          content: "Aktuell gibt es keine offene Raid-Abfrage.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    if (current.finalized) {
      if (interaction) {
        await interaction.reply({
          content: "Diese Raid-Woche wurde bereits ausgewertet.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    const now = DateTime.now().setZone(zone);
    const { start: expectedStart } = getCurrentRaidWindow(now);
    if (current.startDate !== expectedStart.toISODate()) {
      if (interaction) {
        await interaction.reply({
          content: "Die aktive Abfrage gehoert nicht zur aktuellen Raid-Woche.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    current.selectedDays = pickTopRaidDays(current, zone);
    current.finalized = true;
    current.finalizedAt = now.toISO()!;
    await saveState(this.state);

    if (!current.channelId || !current.messageId) {
      throw new Error("Active window is missing channel or message metadata.");
    }

    const channel = ensureTextChannel(
      await this.client.channels.fetch(current.channelId),
    );
    const message = await channel.messages.fetch(current.messageId);
    await message.edit({
      embeds: [buildFinalizedEmbed(current, zone, this.state.profiles ?? {})],
      components: buildComponents(current, zone),
    });

    if (interaction) {
      await interaction.reply({
        content: "Raidtage wurden ausgewertet und im Kanal veroeffentlicht.",
        flags: ["Ephemeral"],
      });
    }
  }

  async finalizeActiveWindowNow(
    interaction?: ChatInputCommandInteraction,
  ): Promise<void> {
    const zone = config.timezone;
    const current = this.state.activeWindow;

    if (!current) {
      if (interaction) {
        await interaction.reply({
          content: "Aktuell gibt es keine offene Raid-Abfrage.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    if (current.finalized) {
      if (interaction) {
        await interaction.reply({
          content: "Diese Raid-Woche wurde bereits ausgewertet.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    const now = DateTime.now().setZone(zone);
    current.selectedDays = pickTopRaidDays(current, zone);
    current.finalized = true;
    current.finalizedAt = now.toISO()!;
    await saveState(this.state);

    if (!current.channelId || !current.messageId) {
      throw new Error("Active window is missing channel or message metadata.");
    }

    const channel = ensureTextChannel(
      await this.client.channels.fetch(current.channelId),
    );
    const message = await channel.messages.fetch(current.messageId);
    await message.edit({
      embeds: [buildFinalizedEmbed(current, zone, this.state.profiles ?? {})],
      components: buildComponents(current, zone),
    });

    if (interaction) {
      await interaction.reply({
        content: "Die aktive naechste Raid-Woche wurde sofort finalisiert.",
        flags: ["Ephemeral"],
      });
    }
  }

  async resetActiveWindow(
    interaction?: ChatInputCommandInteraction,
  ): Promise<void> {
    const current = this.state.activeWindow;
    if (!current) {
      if (interaction) {
        await interaction.reply({
          content:
            "Es gibt aktuell keinen aktiven Raid-Post zum Zuruecksetzen.",
          flags: ["Ephemeral"],
        });
      }
      return;
    }

    if (current.channelId && current.messageId) {
      try {
        const channel = ensureTextChannel(
          await this.client.channels.fetch(current.channelId),
        );
        const message = await channel.messages.fetch(current.messageId);
        await message.delete();
      } catch (error) {
        console.warn("Could not delete active raid post during reset:", error);
      }
    }

    this.state.activeWindow = undefined;
    await saveState(this.state);

    if (interaction) {
      await interaction.reply({
        content:
          "Aktiver Raid-Post wurde zurueckgesetzt. Du kannst jetzt `/raid-post` erneut ausfuehren.",
        flags: ["Ephemeral"],
      });
    }
  }

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const zone = config.timezone;
    const current = this.state.activeWindow;

    if (!current) {
      await interaction.reply({
        content: "Diese Abfrage ist nicht mehr aktiv.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const parts = interaction.customId.split(":");
    const action = `${parts[0]}:${parts[1]}`;
    const windowId = parts[2];

    if (windowId !== current.id) {
      await interaction.reply({
        content: "Diese Abfrage ist veraltet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!this.state.profiles?.[interaction.user.id]) {
      await interaction.reply({
        content: "Bitte speichere zuerst dein Profil mit `/raid-profile`.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (action === CLEAR_PREFIX) {
      const relevantDays = current.finalized
        ? (current.selectedDays ?? [])
        : getRaidDates(DateTime.fromISO(current.startDate, { zone })).map(
            (date) => date.toISODate()!,
          );
      for (const day of relevantDays) {
        current.votes[day] = (current.votes[day] ?? []).filter(
          (userId) => userId !== interaction.user.id,
        );
      }
    }

    await saveState(this.state);
    await interaction.update({
      embeds: [
        current.finalized
          ? buildFinalizedEmbed(current, zone, this.state.profiles ?? {})
          : buildPollEmbed(current, zone, this.state.profiles ?? {}),
      ],
      components: buildComponents(current, zone),
    });
  }

  async handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const zone = config.timezone;
    const current = this.state.activeWindow;

    if (!current) {
      await interaction.reply({
        content: "Diese Abfrage ist nicht mehr aktiv.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const [, , windowId] = interaction.customId.split(":");
    if (windowId !== current.id) {
      await interaction.reply({
        content: "Diese Abfrage ist veraltet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!this.state.profiles?.[interaction.user.id]) {
      await interaction.reply({
        content: "Bitte speichere zuerst dein Profil mit `/raid-profile`.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const relevantDays = current.finalized
      ? new Set(current.selectedDays ?? [])
      : new Set(
          getRaidDates(DateTime.fromISO(current.startDate, { zone })).map(
            (date) => date.toISODate()!,
          ),
        );

    for (const day of relevantDays) {
      current.votes[day] = (current.votes[day] ?? []).filter(
        (userId) => userId !== interaction.user.id,
      );
    }

    for (const day of interaction.values) {
      if (!relevantDays.has(day)) {
        continue;
      }

      const existing = new Set(current.votes[day] ?? []);
      existing.add(interaction.user.id);
      current.votes[day] = Array.from(existing).sort();
    }

    await saveState(this.state);
    await interaction.update({
      embeds: [
        current.finalized
          ? buildFinalizedEmbed(current, zone, this.state.profiles ?? {})
          : buildPollEmbed(current, zone, this.state.profiles ?? {}),
      ],
      components: buildComponents(current, zone),
    });
  }

  async showStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const current = this.state.activeWindow;

    if (!current) {
      await interaction.reply({
        content: "Keine aktive Raid-Abfrage vorhanden.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const profiles = this.state.profiles ?? {};
    const ownProfile = profiles[interaction.user.id];
    const embed = current.finalized
      ? buildFinalizedEmbed(current, config.timezone, profiles)
      : buildPollEmbed(current, config.timezone, profiles);
    if (ownProfile) {
      embed.addFields({
        name: "Dein Profil",
        value: formatProfile(ownProfile),
        inline: false,
      });
    }
    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  }
}
