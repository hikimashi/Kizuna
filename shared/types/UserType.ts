export interface UserType {
  id: string;
  token: string;
  // name: string;
  email: string;
  avatar?: string;
  // avatarFile?: File|null;
  avatarURL?: string|null;
  created: string;
  // themeMode: string;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  anilist_user_id?: string;
  anilist_username?: string;
  anilist_avatar_url?: string;
  anilist_token?: string;
}
