// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

export interface UserType {
  id: string;
  token: string;
  // name: string;
  email: string;
  avatar?: string;
  // avatarFile?: File|null;
  avatarURL?: string|null;
  created: string;
  theme?: 'forest' | 'winter';
  // themeMode: string;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  anilist_user_id?: string;
  anilist_username?: string;
  anilist_avatar_url_medium?: string;
  anilist_avatar_url_large?: string;
  anilist_banner?: string | null;
  anilist_token?: string;
  anilist_token_expires_at?: string | null;
}
