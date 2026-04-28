<template>
  <!-- Background overlay -->
  <div v-if="open" class="login-drawer-overlay fixed inset-0 bg-base-100/50 backdrop-blur-[4px] z-40" @click="handleClose" />

  <!-- DrawerLogin panel -->
  <div
    class="login-drawer-panel fixed top-0 right-0 h-[100dvh] w-full sm:max-w-[420px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out"
    :class="open ? 'translate-x-0' : 'translate-x-full'">
    <div class="bg-base-200 px-3 sm:px-4 pt-16 sm:pt-20 pb-6 w-full h-full overflow-y-auto overscroll-contain">
      <button class="absolute top-3 right-3 sm:top-4 sm:right-4 btn btn-outline btn-error btn-sm" @click="handleClose">
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="flex justify-center mb-4 sm:mb-6 ">
        <img src="/img/user.webp" alt="Logo" class="h-24 sm:h-32 md:h-36 border border-primary rounded-full" />
      </div>
      <h2 class="text-xl sm:text-2xl font-bold text-center text-primary mb-4 sm:mb-6">Login to your Account</h2>

      <div class="items-center my-4 sm:my-6">
        <span class="flex flex-wrap justify-center text-sm sm:text-base text-center">Don't have an account? &nbsp; <a @click="createAccount()" class="text-blue-500 hover:underline cursor-pointer">Create an Account</a></span>
        </div>

      <form ref="loginForm" @submit.prevent="doLogin()">
        <div>
          <div class="fieldset-legend mt-2" for="email">Email</div>
        </div>
        <label class="input input-primary validator w-full ">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </g>
          </svg>
          <input v-model="email" type="email" placeholder="yourmail@mail.com" required />
        </label>
        <div class="validator-hint hidden">Enter valid email address</div>

        <div>
          <div class="fieldset-legend mt-2" for="password">Password</div>
        </div>
        <label class="w-full input input-primary validator">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
            </g>
          </svg>
          <input v-model="password" type="password" required placeholder="Password" minlength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" />
        </label>
        <p class="validator-hint hidden">
          Must be more than 8 characters, including
          <br />At least one number <br />At least one lowercase letter <br />At least one uppercase
          letter
        </p>

        <div class="flex items-center justify-between p-2 mb-4 sm:mb-6">
          <a href="#" class="text-sm sm:text-base text-blue-500 hover:underline">Forgot Password?</a>
        </div>

        <button type="submit" class="w-full btn btn-primary">
          <span>Login</span>
        </button>
      </form>
      <div class="divider my-5 sm:my-8">OR</div>
      <div class="flex flex-col space-y-4">

        <button
          class="w-full btn btn-primary focus:outline-none focus:shadow-outline transition duration-300"
          @click="doGoogleLogin()">
          <img src="https://authjs.dev/img/providers/google.svg" alt="Google" class="w-6 h-6 mr-2" />
          <span>Sign in with Google</span>
        </button>

        <button
          class="w-full btn btn-primary focus:outline-none focus:shadow-outline transition duration-300"
          @click="doGithubLogin()">
          <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" class="w-6 h-6 mr-2" />
          <span>Sign in with GitHub</span>
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

// Connexion email/mot de passe classique.
const doLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    toast.openToast({ type: 'success', message: `Welcome` });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'Invalid credentials!' });
    return;
  }
  themeStore.setTheme();
  close();
};

// Connexion OAuth Google.
const doGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    toast.openToast({ type: 'success', message: `Welcome` });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'Google login failed!' });
    return;
  }
  close();
  await navigateTo('/');
};

// Connexion OAuth GitHub.
const doGithubLogin = async () => {
  try {
    await authStore.loginWithGithub();
    toast.openToast({ type: 'success', message: `Welcome` });
  } catch (e: any) {
    if (loginForm.value) {
      loginForm.value.reset();
    }
    toast.openToast({ type: 'error', message: e.message || 'GitHub login failed!' });
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

<style scoped>
.login-drawer-overlay {
  z-index: 180;
}

.login-drawer-panel {
  z-index: 190;
}
</style>

