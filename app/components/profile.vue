<template>
  <div class="w-full h-full px-4 py-16 mt-20">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left col  - Avatar and created -->
      <div class="col-span-1">
        <div class="h-full flex flex-col bg-base-100 rounded-xl shadow-xl border border-base-300">
          <!-- Seção de avatar -->
          <div class="flex flex-col h-auto items-center p-6 border-b border-base-300">
            <div class="avatar online mb-4">
              <div class="w-32 rounded-md border border-base-300/50 shadow-sm ring ring-offset-base-100 ring-offset-2 relative">
                <img :src="previewUrl || anilistAvatarUrl" class="object-cover" />
                <div v-if="duplicateData.avatarFile" class="absolute -top-1 -right-1 badge badge-warning badge-sm">

                </div>
              </div>
            </div>
            <h2 class="text-xl font-bold">{{ anilistUsername }}</h2>
            <div class="mt-4 w-full">
              <label class="btn btn-outline w-full btn-sm gap-2 ">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Change photo <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
              </label>
            </div>
          </div>

          <!-- Status e estatísticas -->
          <div class="p-4">
            <div class="stats stats-vertical w-full shadow">
              <div class="stat">
                <div class="stat-title">Created</div>
                <div class="stat-desc text-lg">{{ userData?.created }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Col- profile form-->

      <div class="w-full col-span-2 shadow-xl rounded-xl border border-base-300">
        <div class="tabs tabs-lift">
          <input type="radio" name="tabsProfile" class="tab" aria-label="Profile" checked />
          <!-- Profile Tab -->
          <div class="tab-content bg-base-100 p-6 rounded-b-xs border border-base-300">
            <div>
              <h2 class="text-xl font-bold mb-4">Profile</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="form-control w-full">
                  <label class="fieldset-legend" for="anilistId"> AniList ID</label>
                  <input id="anilistId" :value="anilistUserId || 'Not linked'" type="text" placeholder="AniList ID"
                    class="input w-full validator" disabled />
                  <p class="validator-hint">Non-editable field</p>
                </div>

                <div class="form-control w-full">
                  <label class="fieldset-legend" for="email"> Email</label>
                  <input id="email" v-model="duplicateData.email" type="email" placeholder="email@example.com"
                    class="input w-full validator" />
                  <p class="validator-hint">Required Field!</p>
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div class="divider"></div>

            <h2 class="text-xl font-bold mb-4">Theme preference</h2>
            <label class="swap-rotate swap btn btn-ghost">
              <!-- Theme change -->
              <input type="checkbox" :checked="themeStore.activeTheme === 'winter'" data-toggle-theme="forest,winter"
                @change="themeStore.changeTheme()" />

              <!-- sun icon -->
              <svg class="swap-off w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              <!-- moon icon -->
              <svg class="swap-on w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
          </div>

          <input type="radio" name="tabsProfile" class="tab" aria-label="Security" />
          <!-- security Tab-->
          <div class="tab-content p-6 rounded-b-xs border border-base-300">
            <div>
              <h2 class="text-xl font-bold mb-4">Security</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="form-control w-full">
                  <label class="fieldset-legend" for="email1"> Email</label>
                  <input id="email1" v-model="duplicateData.email" type="email" placeholder="email@example.com" disabled
                    class="input w-full validator" />
                </div>

                <div class="form-control">
                  <label class="fieldset-legend" for="pasword">Current password</label>
                  <input v-model="duplicateData.oldPassword" type="password" id="pasword" class="input validator w-full"
                    placeholder="Current password" minlength="8" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="You password" />
                  <p class="validator-hint">Required Field!</p>
                </div>

                <div class="form-control">
                  <label class="fieldset-legend" for="newPassword">New password</label>

                  <input v-model="duplicateData.password" type="password" id="newPassword"
                    class="input validator w-full" placeholder="New password" minlength="8"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain 8 characters with uppercase, lowercase, numbers, and symbols" />
                  <p class="validator-hint">
                    Minimum 8 characters with uppercase, lowercase, numbers, and symbols.
                  </p>
                </div>

                <div class="form-control">
                  <label class="fieldset-legend" for="confirmPassword">Confirm new password</label>
                  <input v-model="duplicateData.passwordConfirm" type="password" id="confirmPassword"
                    class="input validator w-full" placeholder="Confirm new password" minlength="8"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain 8 characters with uppercase, lowercase, numbers, and symbols" />
                  <p v-if="passwordMisMatch()" class="text-error">Passwords do not match!</p>
                </div>
              </div>
            </div>
            <div class="flex justify-center ">

              <button @click="deleteAccount()" class="btn btn-outline btn-error w-1/2">
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <!-- Botões de ação -->
        <div class="flex w-full justify-end gap-2 p-4">
          <button @click="cancelChanges()" class="btn btn-outline btn-error ">
            Cancel
          </button>
          <button @click="saveChanges()" class="btn btn-outline btn-success">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
import { navigateTo } from '#app';
import { onBeforeRouteLeave } from '#vue-router';
import { storeToRefs } from 'pinia';
import { themeChange } from 'theme-change';
import { useUserStore } from '~/composables/useUserStore';
import { useThemeStore } from '~/composables/useThemeStore';
import { useAlertStore } from '~/composables/useAlertStore';
import { useToastStore } from '~/composables/useToastStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';
import { useDrawersStore } from '~/composables/useDrawersStore';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { computed } from 'vue';

/**
 * Stores
 */
const userStore = useUserStore();
const themeStore = useThemeStore();
const alertStore = useAlertStore();
const toastStore = useToastStore();
const myAuthStore = useMyAuthStore();
const drawersStore = useDrawersStore();
const pocketbaseStore = usePocketbaseStore();
/**
 * Props/Emits
 */

/**
 * References
 */
const { userData } = storeToRefs(userStore);

// Use the reactive authRecord from pocketbase store for AniList data
const anilistUsername = computed(() => pocketbaseStore.authRecord?.anilist_username || 'Unknown user');
const anilistAvatarUrl = computed(() => pocketbaseStore.authRecord?.anilist_avatar_url_large || pocketbaseStore.authRecord?.anilist_avatar_url_medium || '/img/user.png');
const anilistUserId = computed(() => pocketbaseStore.authRecord?.anilist_user_id);

userData.value.password = '';
userData.value.passwordConfirm = '';
userData.value.oldPassword = '';
userData.value.avatarFile = null;

const duplicateData = ref(structuredClone(toRaw(userData.value)));
const previewUrl = ref<string>('');

/**
 * Computed Properties
 */

/**
 * Methods
 */
const clearAllData = () => {
  duplicateData.value = null
};

const cancelChanges = () => {
  duplicateData.value = structuredClone(toRaw(userData.value));
  duplicateData.value.avatarFile = null;
  previewUrl.value = '';
};

const passwordMisMatch = () => {
  if (duplicateData.value.passwordConfirm.length >= 7)
    return duplicateData.value.password !== duplicateData.value.passwordConfirm;
};

const handleFileChange = (event: Event) => {

  const input = event.target as HTMLInputElement
  duplicateData.value.avatarFile = input.files?.[0]
  if (!duplicateData.value.avatarFile) return

  previewUrl.value = URL.createObjectURL(duplicateData.value.avatarFile);

};


const saveChanges = async () => {
  const formData = new FormData();

  formData.append('name', duplicateData.value.name);
  formData.append('themeMode', themeStore.activeTheme);

  const emailChanged = duplicateData.value.email !== userData.value?.email;
  const hasPasswordFields = duplicateData.value.password || duplicateData.value.passwordConfirm || duplicateData.value.oldPassword;

  if (emailChanged) {
    const response = await alertStore.openAlert({
      type: 'warning',
      message: `You try to change your email to "${duplicateData.value.email}", do you want to proceed?`,
    });
    if (response) {
      formData.append('email', duplicateData.value.email);
    } else {
      duplicateData.value.email = userData.value?.email || '';
      return;
    }
  }

  if (hasPasswordFields) {
    if (duplicateData.value.password !== duplicateData.value.passwordConfirm) {
      toastStore.openToast({ type: 'error', message: 'Passwords do not match!' });
      return;
    }
    if (!duplicateData.value.oldPassword) {
      toastStore.openToast({ type: 'error', message: 'Current password is required!' });
      return;
    }

    formData.append('oldPassword', duplicateData.value.oldPassword);
    formData.append('password', duplicateData.value.password);
    formData.append('passwordConfirm', duplicateData.value.passwordConfirm);
  }

  if (duplicateData.value.avatarFile) {
    formData.append('avatar', duplicateData.value.avatarFile);
  }

  try {
    const response = await userStore.updateUser(formData);

    if (emailChanged) {
      try {
        await myAuthStore.emailChange(duplicateData.value.email);
      } catch (error: any) {
        toastStore.openToast({ type: 'error', message: error?.message || 'Error changing email!' });
        return;
      }
    }

    toastStore.openToast({ type: 'success', message: 'Data updated successfully!' });

    if (emailChanged || hasPasswordFields) {
      await myAuthStore.logout();
      navigateTo('/');
      drawersStore.openDrawer('drawerLogin');
    } else {
      await myAuthStore.authRefresh();
      cancelChanges();
      navigateTo('/profilePage');
    }
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: 'Error updating data!' });
  }
};
const deleteAccount = async () => {
  const response = await alertStore.openAlert({
    type: 'error',
    message: `Are you sure you want to delete your account? This action is irreversible!`,
  });
  if (response) {
    try {
      await myAuthStore.deleteAccount();
      toastStore.openToast({ type: 'success', message: 'Account deleted successfully!' });
      clearAllData();
      await myAuthStore.logout();
      navigateTo('/');
    } catch (error: any) {
      toastStore.openToast({ type: 'error', message: error?.message || 'Error deleting account!' });
    }
  }
};

/**
 * Watchers
 */
watch(() => pocketbaseStore.authRecord, () => {
  // The computed properties will automatically update when authRecord changes
}, { deep: true, immediate: true });

onBeforeRouteLeave(async () => {
  const editedProfile = await userStore.userDataHasEdited(duplicateData.value);
  if (editedProfile) {
    const response = await alertStore.openAlert({
      type: 'success',
      message: 'Data profile was edited do you wanna leave?',
    });

    if (!response) {
      return false;
    }
  }
});
/**
 * Mounted/Unmounted
 */
onMounted(() => {
  themeChange(false);
});
</script>