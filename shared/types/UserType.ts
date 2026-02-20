/**
 * UserType.ts
 * Interface représentant un utilisateur dans l'application.
 */

export interface UserType {
  id: string;
  token: string;
  email: string;
  avatar?: string;
  avatarURL?: string|null;
  created: string;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  anilist_user_id?: string;
  anilist_username?: string;
  anilist_avatar_url?: string;
  anilist_token?: string;
}
