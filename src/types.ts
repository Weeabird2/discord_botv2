export type RaidDayVote = Record<string, string[]>;

export interface PlayerProfile {
  userId: string;
  wowClass: string;
  spec: string;
  updatedAt: string;
}

export interface RaidWindow {
  id: string;
  startDate: string;
  endDate: string;
  messageId?: string;
  channelId?: string;
  finalized: boolean;
  votes: RaidDayVote;
  createdAt: string;
  finalizedAt?: string;
  selectedDays?: string[];
}

export interface AppState {
  channelId?: string;
  activeWindow?: RaidWindow;
  profiles?: Record<string, PlayerProfile>;
}
