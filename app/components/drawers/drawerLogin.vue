<template>
  <div v-if="open" class="login-drawer-overlay fixed inset-0 bg-base-100/50 backdrop-blur-[4px] z-40" @click="handleClose" />

  <div
    class="login-drawer-panel fixed top-0 right-0 h-[100dvh] w-full sm:max-w-[420px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-500 ease-in"
    :class="open ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="bg-base-200 px-3 sm:px-4 pt-16 sm:pt-20 pb-6 w-full h-full overflow-y-auto overscroll-contain">
      <button class="absolute top-3 right-3 sm:top-4 sm:right-4 btn btn-outline btn-error btn-sm" @click="handleClose">
        ✕
      </button>

      <div class="flex justify-center mb-4 sm:mb-6">
        <img src="/img/user.webp" alt="Logo" class="h-24 sm:h-32 md:h-36 border border-primary rounded-full" />
      </div>

      <h2 class="text-xl sm:text-2xl font-bold text-center text-primary mb-4 sm:mb-6">
        {{ showForgotPassword ? 'Réinitialiser le mot de passe' : 'Connexion à votre compte' }}
      </h2>

      <div class="items-center my-4 sm:my-6">
        <span v-if="!showForgotPassword" class="flex flex-wrap justify-center text-sm sm:text-base text-center">
          Pas encore de compte ? &nbsp;
          <a @click="createAccount()" class="text-blue-500 hover:underline cursor-pointer">Créer un compte</a>
        </span>

        <span v-else class="flex flex-wrap justify-center text-sm sm:text-base text-center">
          Entrez votre e-mail pour recevoir un lien de réinitialisation.
        </span>
      </div>

      <form ref="loginForm" @submit.prevent="showForgotPassword ? sendPasswordReset() : doLogin()">
        <div class="fieldset-legend mt-2" for="email">Email</div>

        <label class="input input-primary validator w-full">
          <input v-model="email" type="email" placeholder="example@mail.com" required />
        </label>

        <template v-if="!showForgotPassword">
          <div class="fieldset-legend mt-2" for="password">Mot de passe</div>

          <label class="w-full input input-primary validator">
            <input
              v-model="password"
              type="password"
              required
              placeholder="Mot de passe"
              minlength="8"
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Doit contenir au moins 8 caractères, avec un chiffre, une minuscule et une majuscule"
            />
          </label>
        </template>

        <div class="flex items-center justify-between p-2 mb-4 sm:mb-6">
          <button
            v-if="!showForgotPassword"
            type="button"
            class="text-sm sm:text-base text-blue-500 hover:underline"
            @click="showForgotPassword = true"
          >
            Mot de passe oublié ?
          </button>

          <button
            v-else
            type="button"
            class="text-sm sm:text-base text-blue-500 hover:underline"
            @click="showForgotPassword = false"
          >
            Retour à la connexion
          </button>
        </div>

        <button type="submit" class="w-full btn btn-primary" :disabled="isSubmittingReset">
          <span>
            {{ showForgotPassword ? (isSubmittingReset ? 'Envoi...' : 'Envoyer le lien') : 'Connexion' }}
          </span>
        </button>
      </form>

      <template v-if="!showForgotPassword">
        <div class="divider my-5 sm:my-8">OU</div>

        <div class="flex flex-col space-y-4">
          <button class="w-full btn btn-primary" @click="doGoogleLogin()">
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" class="w-6 h-6 mr-2" />
            <span>Se connecter avec Google</span>
          </button>

          <button class="w-full btn btn-primary" @click="doGithubLogin()">
            <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" class="w-6 h-6 mr-2" />
            <span>Se connecter avec GitHub</span>
          </button>
        </div>
      </template>
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

const email = ref('');
const password = ref('');
const loginForm = ref<HTMLFormElement | null>(null);
const showForgotPassword = ref(false);
const isSubmittingReset = ref(false);

const handleClose = () => close();

const close = () => {
  email.value = '';
  password.value = '';
  showForgotPassword.value = false;
  isSubmittingReset.value = false;
  loginForm.value?.reset();

  emits('close');
  drawerStore.closeDrawer();
};

const doLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
    themeStore.setTheme();
    close();
  } catch (e: any) {
    loginForm.value?.reset();
    toast.openToast({ type: 'error', message: e.message || 'Identifiants invalides.' });
  }
};

const sendPasswordReset = async () => {
  if (!email.value.trim()) {
    toast.openToast({ type: 'error', message: 'Saisissez votre adresse e-mail.' });
    return;
  }

  try {
    isSubmittingReset.value = true;

    await authStore.requestPasswordReset(email.value);

    toast.openToast({
      type: 'success',
      message: 'Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé.'
    });

    close();
  } catch (e: any) {
    toast.openToast({
      type: 'error',
      message: e.message || "Impossible d'envoyer l'e-mail de réinitialisation."
    });
  } finally {
    isSubmittingReset.value = false;
  }
};

const doGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
    close();
    await navigateTo('/');
  } catch (e: any) {
    loginForm.value?.reset();
    toast.openToast({ type: 'error', message: e.message || 'La connexion Google a échoué.' });
  }
};

const doGithubLogin = async () => {
  try {
    await authStore.loginWithGithub();
    toast.openToast({ type: 'success', message: 'Bienvenue.' });
    close();
    await navigateTo('/');
  } catch (e: any) {
    loginForm.value?.reset();
    toast.openToast({ type: 'error', message: e.message || 'La connexion GitHub a échoué.' });
  }
};

const createAccount = () => {
  close();
  drawerStore.openDrawer('drawerCreateUser');
};
</script>

<style scoped>
.login-drawer-overlay {
  z-index: 180;
}

.login-drawer-panel {
  z-index: 190;
}
</style>