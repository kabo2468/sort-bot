export type Visibility = 'public' | 'home' | 'followers' | 'specified';
type OnlineStatus = 'online' | 'active' | 'offline' | 'unknown';

export type WebhookResponse = {
  hookId: string;
  userId: string;
  eventId: string;
  createdAt: number;
} & (
  | { type: 'follow'; body: { user: User } }
  | { type: 'followed'; body: { user: User } }
  | { type: 'unfollow'; body: { user: User } }
  | { type: 'note'; body: { note: Note } }
  | { type: 'reply'; body: { note: Note } }
  | { type: 'renote'; body: { note: Note } }
  | {
      type: 'mention';
      body: { note: Note };
    }
);

export interface Note {
  id: string;
  createdAt: string;
  text: string | null;
  cw: string | null;
  user: User;
  userId: string;
  visibility: Visibility;
  mention: string[] | null;
  replyId: string | null;
  reply: Note | null;
}

export interface User {
  id: string;
  createdAt: string;
  username: string;
  host: string | null;
  name: string;
  onlineStatus: OnlineStatus;
  avatarUrl: string;
  avatarBlurhash: string;
}
