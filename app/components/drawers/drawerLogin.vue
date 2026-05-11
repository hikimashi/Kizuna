<template>
  <div v-if="open" class="fixed inset-0 z-[180] bg-base-100/50 backdrop-blur-[4px]" @click="handleClose" />

  <div
    class="fixed top-0 right-0 z-[190] h-[100dvh] w-full transform bg-base-100 shadow-2xl transition-transform duration-500 ease-in-out sm:max-w-[420px]"
    :class="open ? 'translate-x-0' : 'translate-x-full'">
    <div class="h-full w-full overflow-y-auto overscroll-contain bg-base-200 px-3 pb-6 pt-16 sm:px-4 sm:pt-20">
      <button class="absolute top-3 right-3 btn btn-outline btn-error btn-sm sm:top-4 sm:right-4" @click="handleClose">
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="mb-4 flex justify-center sm:mb-6">
        <img src="/img/user.webp" alt="Logo" class="h-24 rounded-full border border-primary bg-base-100/70 p-1 shadow-lg sm:h-32 md:h-36" />
      </div>
      <h2 class="mb-4 text-center text-xl font-bold text-primary sm:mb-6 sm:text-2xl">Connexion a votre compte</h2>

      <div class="my-4 rounded-2xl border border-base-300/60 bg-base-100/50 px-4 py-3 text-center shadow-sm sm:my-6">
        <span class="flex flex-wrap justify-center text-center text-sm sm:text-base">Pas encore de compte ?&nbsp;<a @click="createAccount()" class="cursor-pointer font-semibold text-primary transition hover:underline">Créer un compte</a></span>
      </div>

      <form ref="loginForm" class="space-y-3" @submit.prevent="doLogin()">
        <div>
          <div class="fieldset-legend mt-2" for="email">Email</div>
        </div>
        <label class="input input-primary validator w-full">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </g>
          </svg>
          <input v-model="email" type="email" placeholder="yourmail@mail.com" required />
        </label>
        <div class="validator-hint hidden">Saisissez une adresse e-mail valide</div>

        <div>
          <div class="fieldset-legend mt-2" for="password">Mot de passe</div>
        </div>
        <label class="input input-primary validator w-full">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
              <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
            </g>
          </svg>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Mot de passe"
            minlength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Doit contenir au moins 8 caracteres, avec un chiffre, une minuscule et une majuscule"
          />
        </label>
        <p class="validator-hint hidden">
          Doit contenir au moins 8 caracteres, avec
          <br />Au moins un chiffre <br />Au moins une lettre minuscule <br />Au moins une lettre majuscule
        </p>

        <div class="mb-4 flex items-center justify-between p-2 sm:mb-6">
          <a href="#" class="text-sm text-blue-500 hover:underline sm:text-base">Mot de passe oublie ?</a>
        </div>

        <button type="submit" class="btn btn-primary w-full">
          <span>Connexion</span>
        </button>
      </form>
      <div class="divider my-5 sm:my-8">OU</div>
      <div class="flex flex-col space-y-4">
        <button
          class="btn btn-primary w-full shadow-sm transition duration-300 hover:-translate-y-0.5 focus:outline-none"
          @click="doGoogleLogin()">
          <img src="https://authjs.dev/img/providers/google.svg" alt="Google" class="mr-2 h-6 w-6" />
          <span>Se connecter avec Google</span>
        </button>

        <button
          class="btn btn-primary w-full shadow-sm transition duration-300 hover:-translate-y-0.5 focus:outline-none"
          @click="doGithubLogin()">
          <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" class="mr-2 h-6 w-6" />
          <span>Se connecter avec GitHub</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawersStore } from '~/composables/useDrawersStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';
import { useToastStore } from '~/composables/useToastStore';
import { useThemeStore } from '~/composables/useThemeStore';

const drawerStore = useDrawersStore();
const authStore = useMyAuthStore();
const toast = useToastStore();
const themeStore = useThemeStore();

defineProps({
  open: { type: Boolean, default: false },
});
const emits = defineEmits(['close']);
const handleClose = () => emits('close');

const email = ref<string>('');
const password = ref<string>('');
const loginForm = ref<HTMLFormElement | null>(null);

const close = () => {
  emits('close');
  drawerStore.closeDrawer();
};

const doLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'Identifiants invalides.' });
    return;
  }
  themeStore.setTheme();
  close();
};

const doGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'La connexion Google a echoue.' });
    return;
  }
  close();
  await navigateTo('/');
};

const doGithubLogin = async () => {
  try {
    await authStore.loginWithGithub();
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'La connexion GitHub a echoue.' });
    return;
  }
  close();
  await navigateTo('/');
};

const createAccount = () => {
  close();
  drawerStore.openDrawer('drawerCreateUser');
};
</script>
