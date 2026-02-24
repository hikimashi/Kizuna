<template>
    <!-- Background overlay -->
    <div v-if="open" class="fixed inset-0 bg-base-100/50 backdrop-blur-[4px] z-40" @click="handleClose" />

     <!-- DrawerCreateUser panel -->
     <div
         class="fixed top-0 right-0 h-screen w-full md:w-1/4 bg-base-100 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out"
         :class="open ? 'translate-x-0' : 'translate-x-full'">
         <div class="bg-base-200 p-4 pt-20 w-full h-full">
             <button class="absolute top-4 right-4 btn btn-outline btn-error md:hidden" @click="handleClose">
                 <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                 </svg>
             </button>

             <div class="flex justify-center mb-6">
                 <img src="/img/user.png" alt="Logo" class="h-36 border border-primary rounded-full" />
             </div>
             <h2 class="text-2xl font-bold text-center text-primary mb-6">Create New Account</h2>

             <div class="items-center my-6">
                 <span class="flex justify-center text-md">Already have an account? &nbsp; <a @click="login()" class="text-blue-500 hover:underline cursor-pointer">Login</a></span>
             </div>

             <form @submit.prevent="createUser()">
                 <!-- <div>
                     <div class="fieldset-legend mt-2" for="name">Full Name</div>
                 </div>
                 <label class="input input-primary validator w-full">
                     <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                             <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
                         </g>
                     </svg>
                     <input v-model="newUser.name" type="text" placeholder="Your name" required />
                 </label> -->
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
                     <input v-model="newUser.email" type="email" placeholder="yourmail@mail.com" required />
                 </label>
                 <div class="validator-hint hidden">Enter valid email address</div>

                 <div>
                     <div class="fieldset-legend mt-2" for="password">Password</div>
                 </div>
                 <label class="input input-primary validator w-full">
                     <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round"
                                 d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                             <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                         </g>
                     </svg>
                     <input v-model="newUser.password" type="password" required placeholder="Password" minlength="8"
                         pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                         title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" />
                 </label>
                 <p class="validator-hint hidden">
                     Must be more than 8 characters, including
                     <br />At least one number <br />At least one lowercase letter <br />At least one uppercase
                     letter
                 </p>

                 <div>
                     <div class="fieldset-legend mt-2" for="confirmPassword">Confirm Password</div>
                 </div>
                 <label class="input input-primary validator w-full">
                     <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round"
                                 d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                             <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                         </g>
                     </svg>
                     <input v-model="newUser.passwordConfirm" type="password" required placeholder="Confirm Password" minlength="8"
                         pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                         title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" />
                 </label>
                 <p class="validator-hint hidden">
                     Must be more than 8 characters, including
                     <br />At least one number <br />At least one lowercase letter <br />At least one uppercase
                     letter
                 </p>
                 <p v-if="passwordMisMatch()" class="text-error">Passwords do not match!</p>

                 <button type="submit" class="w-full btn btn-primary mt-6">
                     <span>Create Account</span>
                 </button>
             </form>

             <div class="divider my-8">OR</div>
             <div class="flex flex-col space-y-4">
                 <button
                     class="w-full btn btn-primary focus:outline-none focus:shadow-outline transition duration-300"
                     @click="doGoogleLogin()">
                     <img src="https://authjs.dev/img/providers/google.svg" alt="Google" class="w-6 h-6 mr-2" />
                     <span>Sign up with Google</span>
                 </button>
                 <button
                     class="w-full btn btn-primary focus:outline-none focus:shadow-outline transition duration-300"
                     @click="doGithubLogin()">
                     <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" class="w-6 h-6 mr-2" />
                     <span>Sign up with GitHub</span>
                 </button>
             </div>
         </div>
     </div>
</template>


<script setup lang="ts">
/**
 * Stores
 */

import { useDrawersStore } from '~/composables/useDrawersStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';
import { useToastStore } from '~/composables/useToastStore';
import { useThemeStore } from '~/composables/useThemeStore';

const drawerStore = useDrawersStore();
const authStore = useMyAuthStore();
const toast = useToastStore();
const themeStore = useThemeStore();

/**
 * Props/Emits
 */

defineProps({
    open: { type: Boolean, default: false },
});
const emits = defineEmits(['close']);
const handleClose = () => emits('close');

/**
 * References
 */
const newUser = ref<NewUserType>({
    // name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    // themeMode: themeStore.activeTheme,
});

/**
 * Computed Properties
 */

/**
 * Methods
 */

const close = () => {
  emits('close');
  drawerStore.closeDrawer();
};

const clearForm = () => {
  newUser.value = {
    // name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    // themeMode: themeStore.activeTheme,
  };
};

const createUser = async () => {
  let data;

  try {
    data = await authStore.createAccount(newUser.value);
    toast.openToast({ type: 'success', message: `Account created successfully! Welcome ${data.record.name}` });
  } catch (e: any) {
    toast.openToast({ type: 'error', message: e.message || 'Account creation failed!' });
    return;
  }
  close();
};

const doGoogleLogin = async () => {
  let data;
  try {
    data = await authStore.loginWithGoogle();
    toast.openToast({ type: 'success', message: `Welcome ${data.record.name}` });
  } catch (e: any) {
    toast.openToast({ type: 'error', message: e.message || 'Google login failed!' });
    return;
  }
  clearForm();
  close();
  await navigateTo('/');
};

const doGithubLogin = async () => {
  let data;
  try {
    data = await authStore.loginWithGithub();
    toast.openToast({ type: 'success', message: `Welcome ${data.record.name}` });
  } catch (e: any) {
    toast.openToast({ type: 'error', message: e.message || 'GitHub login failed!' });
    return;
  }
  clearForm();
  close();
  await navigateTo('/');
};

const login = () => {
  close();
  drawerStore.openDrawer('drawerLogin');
};

const passwordMisMatch = () => {
  if (newUser.value.passwordConfirm.length >= 7)
    return newUser.value.password !== newUser.value.passwordConfirm;
};

/**
 * Watchers
 */

/**
 * Mounted/Unmounted
 */
</script>