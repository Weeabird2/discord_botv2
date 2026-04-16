import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID,
  defaultChannelId: process.env.DISCORD_CHANNEL_ID,
  timezone: process.env.BOT_TIMEZONE ?? 'Europe/Berlin',
  postCron: process.env.POST_CRON ?? '0 12 * * 5',
  finalizeCron: process.env.FINALIZE_CRON ?? '0 12 * * 3'
};
