<template>
  <div class="settings-page">
    <div class="page">
      <aside class="sidebar">
        <div class="sidebar-section">Profile</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'anilist' }" type="button" @click="scrollToSection('anilist')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          AniList
        </button>

        <div class="sidebar-section">Account</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'profile' }" type="button" @click="scrollToSection('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          Profile
        </button>
        <button class="sidebar-link" :class="{ active: activeSection === 'security' }" type="button" @click="scrollToSection('security')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Security
        </button>

        <div class="sidebar-section">App</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'appearance' }" type="button" @click="scrollToSection('appearance')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
          </svg>
          Appearance
        </button>
      </aside>

      <main class="main">
        <div class="settings-sections">
          <section id="section-anilist" ref="anilistSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">AniList</div>
              <div class="section-subtitle">Linked AniList profile settings</div>
            </div>
            <section class="card">
              <div class="card-header"><span class="card-title">Profile Info</span></div>
              <div class="card-body anilist-card-body">
                <div class="fields-grid">
                  <div class="field">
                    <span class="field-label">Username</span>
                    <div class="field-value">{{ username || '-' }}</div>
                  </div>
                  <div class="field">
                    <span class="field-label">AniList ID</span>
                    <div class="field-value">{{ anilistId || '-' }}</div>
                  </div>
                </div>
                <div class="readonly-note">
                  <span>Avatar and banner are read-only. Change them on AniList, then refresh.</span>
                  <a class="anilist-settings-link" href="https://anilist.co/settings" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 100 100" width="14" height="14" aria-hidden="true">
                      <circle cx="50" cy="50" r="50" fill="currentColor" />
                      <rect x="20" y="47" width="16" height="33" fill="#0B1622" />
                      <rect x="45" y="20" width="16" height="60" fill="#0B1622" />
                      <rect x="64" y="35" width="16" height="45" fill="#0B1622" />
                    </svg>
                    AniList settings
                  </a>
                </div>
                <div class="profile-hero">
                  <div class="profile-avatar-col">
                    <div class="profile-avatar-label">Avatar</div>
                    <div class="profile-avatar-img">
                      <img v-if="avatarSrc" :src="avatarSrc" alt="AniList avatar" />
                      <div v-else class="profile-banner-placeholder">No avatar</div>
                    </div>
                  </div>
                  <div class="profile-banner-col">
                    <div class="profile-banner-label">Banner</div>
                    <div class="profile-banner-img">
                      <img v-if="bannerSrc" :src="bannerSrc" alt="AniList banner" />
                      <div v-else class="profile-banner-placeholder">No banner set on AniList</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div class="btn-row">
              <button class="btn-refresh" :disabled="isRefreshing" @click="refreshAnilistData">
                {{ isRefreshing ? 'Refreshing...' : 'Refresh from AniList' }}
              </button>
              <button class="btn-danger" :disabled="isUnlinking" @click="unlinkAniList">
                {{ isUnlinking ? 'Unlinking...' : 'Unlink AniList' }}
              </button>
            </div>
          </section>

          <section id="section-profile" ref="profileSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Profile</div>
              <div class="section-subtitle">Your account profile information</div>
            </div>
            <section class="card">
              <div class="card-header"><span class="card-title">Profile Details</span></div>
              <div class="card-body">
                <div class="fields-grid">
                  <div class="field"><span class="field-label">Email</span><div class="field-value">{{ emailDisplay }}</div></div>
                  <div class="field"><span class="field-label">Joined</span><div class="field-value">{{ joinedDisplay }}</div></div>
                  <div class="field"><span class="field-label">AniList Username</span><div class="field-value">{{ username || '-' }}</div></div>
                  <div class="field"><span class="field-label">AniList ID</span><div class="field-value">{{ anilistId || '-' }}</div></div>
                  <div class="field"><span class="field-label">AniList Token Expires</span><div class="field-value">{{ anilistTokenExpiryDisplay }}</div></div>
                </div>
              </div>
            </section>
          </section>

          <section id="section-security" ref="securitySectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Security</div>
              <div class="section-subtitle">Password and account safety</div>
            </div>

            <section class="card">
              <div class="card-header"><span class="card-title">Account</span></div>
              <div class="card-body">
                <div class="account-field">
                  <div class="account-field-info">
                    <div class="account-field-name">Email address</div>
                    <div class="account-field-desc">{{ emailDisplay }}</div>
                  </div>
                  <button class="btn-edit" type="button" @click="toggleEmailChange">
                    {{ showEmailChange ? 'Cancel' : 'Change' }}
                  </button>
                </div>
                <div v-if="showEmailChange" class="account-action">
                  <label class="field-label" for="new-email">New email</label>
                  <input id="new-email" v-model="pendingEmail" class="action-input" type="email" placeholder="name@example.com" />
                  <div class="action-buttons">
                    <button class="btn-edit" :disabled="isChangingEmail" type="button" @click="submitEmailChange">
                      {{ isChangingEmail ? 'Sending...' : 'Send Confirmation' }}
                    </button>
                  </div>
                </div>

                <div class="account-field">
                  <div class="account-field-info">
                    <div class="account-field-name">Password</div>
                    <div class="account-field-desc">Change your password directly.</div>
                  </div>
                  <button class="btn-edit" type="button" @click="togglePasswordReset">
                    {{ showPasswordReset ? 'Cancel' : 'Change' }}
                  </button>
                </div>
                <div v-if="showPasswordReset" class="account-action">
                  <label class="field-label" for="current-password">Current password</label>
                  <input id="current-password" v-model="currentPassword" class="action-input" type="password" />
                  <label class="field-label" for="next-password">New password</label>
                  <input id="next-password" v-model="newPassword" class="action-input" type="password" />
                  <label class="field-label" for="confirm-password">Confirm password</label>
                  <input id="confirm-password" v-model="confirmPassword" class="action-input" type="password" />
                  <p v-if="passwordChangeError" class="security-error">{{ passwordChangeError }}</p>
                  <div class="action-buttons">
                    <button class="btn-edit" :disabled="isUpdatingPassword" type="button" @click="updatePasswordDirectly">
                      {{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section class="danger-card">
              <div class="card-header"><span class="card-title">Danger Zone</span></div>
              <div class="card-body">
                <div class="account-field danger-row">
                  <div class="account-field-info">
                    <div class="account-field-name">Delete account</div>
                    <div class="account-field-desc">Permanently delete your account. This cannot be undone.</div>
                  </div>
                  <button class="btn-danger" :disabled="isDeleting" @click="deleteAccount">
                    {{ isDeleting ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </div>
            </section>
          </section>

          <section id="section-appearance" ref="appearanceSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Appearance</div>
              <div class="section-subtitle">Theme and visual preferences</div>
            </div>
            <section class="card">
              <div class="card-header"><span class="card-title">Theme Color</span></div>
              <div class="card-body">
                <div class="theme-controls">
                  <button class="theme-chip" :class="{ active: selectedTheme === 'forest' }" @click="previewTheme('forest')">Forest</button>
                  <button class="theme-chip" :class="{ active: selectedTheme === 'winter' }" @click="previewTheme('winter')">Winter</button>
                  <button class="btn-edit" :disabled="isSavingTheme" @click="saveTheme">
                    {{ isSavingTheme ? 'Saving...' : 'Save' }}
                  </button>
                </div>
                <p class="account-field-desc" style="margin-top: 10px;">Theme is previewed instantly; click Save to persist.</p>
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { navigateTo } from '#app'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore'
import { useThemeStore } from '~/composables/useThemeStore'
import { useMyAuthStore } from '~/composables/useMyAuthStore'
import { useToastStore } from '~/composables/useToastStore'
import { useAlertStore } from '~/composables/useAlertStore'

// Cette page regroupe les reglages du compte :
// liaison AniList, informations de profil, securite et apparence.

definePageMeta({ middleware: ['auth'] })

type SectionKey = 'anilist' | 'profile' | 'security' | 'appearance'

const pocketbaseStore = usePocketbaseStore()
const anilistAuthStore = useAnilistAuthStore()
const themeStore = useThemeStore()
const myAuthStore = useMyAuthStore()
const toastStore = useToastStore()
const alertStore = useAlertStore()

const activeSection = ref<SectionKey>('anilist')
const isRefreshing = ref(false)
const isUnlinking = ref(false)
const isSavingTheme = ref(false)
const isDeleting = ref(false)
const isChangingEmail = ref(false)
const isUpdatingPassword = ref(false)
const showEmailChange = ref(false)
const showPasswordReset = ref(false)
const selectedTheme = ref<'forest' | 'winter'>(themeStore.activeTheme)
const pendingEmail = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const anilistSectionRef = ref<HTMLElement | null>(null)
const profileSectionRef = ref<HTMLElement | null>(null)
const securitySectionRef = ref<HTMLElement | null>(null)
const appearanceSectionRef = ref<HTMLElement | null>(null)
let sectionObserver: IntersectionObserver | null = null

const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
const username = computed(() => authRecord.value.anilist_username ?? '')
const anilistId = computed(() => authRecord.value.anilist_user_id ?? '')
const emailDisplay = computed(() => authRecord.value.email ?? '-')
const avatarSrc = computed(() => authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
const bannerSrc = computed(() => authRecord.value.anilist_banner || '')
const joinedDisplay = computed(() => formatDate(authRecord.value.created))
const anilistTokenExpiryDisplay = computed(() => {
  if (!authRecord.value.anilist_token) return '-'
  if (authRecord.value.anilist_token_expires_at) return formatDateShort(authRecord.value.anilist_token_expires_at)
  return 'Unavailable (not stored)'
})
const passwordChangeError = computed(() => {
  // Validation locale avant tout appel reseau.
  if (!currentPassword.value && !newPassword.value && !confirmPassword.value) return ''
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) return 'All fields are required.'
  if (newPassword.value.length < 8) return 'New password must be at least 8 characters.'
  if (newPassword.value !== confirmPassword.value) return 'Passwords do not match.'
  return ''
})

function formatDateTime(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatDate(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function formatDateShort(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function getSectionRef(key: SectionKey): HTMLElement | null {
  if (key === 'anilist') return anilistSectionRef.value
  if (key === 'profile') return profileSectionRef.value
  if (key === 'security') return securitySectionRef.value
  return appearanceSectionRef.value
}

function scrollToSection(key: SectionKey) {
  // Le clic dans la sidebar fait defiler vers la section correspondante.
  activeSection.value = key
  getSectionRef(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setupScrollSpy() {
  // L'observer met a jour la sidebar selon la section actuellement visible.
  const sections: Array<{ key: SectionKey; el: HTMLElement | null }> = [
    { key: 'anilist', el: anilistSectionRef.value },
    { key: 'profile', el: profileSectionRef.value },
    { key: 'security', el: securitySectionRef.value },
    { key: 'appearance', el: appearanceSectionRef.value }
  ]

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (!visible) return
      const match = sections.find(section => section.el === visible.target)
      if (match) activeSection.value = match.key
    },
    {
      root: null,
      rootMargin: '-30% 0px -55% 0px',
      threshold: [0.1, 0.25, 0.5]
    }
  )

  for (const section of sections) {
    if (section.el) sectionObserver.observe(section.el)
  }
}

const previewTheme = (theme: 'forest' | 'winter') => {
  // Le theme est applique tout de suite en apercu, meme avant sauvegarde.
  selectedTheme.value = theme
  themeStore.setThemeByName(theme)
}

const refreshAnilistData = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await anilistAuthStore.refreshLinkedAniListProfile()
  } finally {
    isRefreshing.value = false
  }
}

const unlinkAniList = async () => {
  // Cette action efface tous les champs AniList stockes dans le profil local.
  if (isUnlinking.value) return
  const ok = await alertStore.openAlert({ type: 'warning', message: 'Unlink AniList account from Kizuna?' })
  if (!ok) return

  isUnlinking.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Not authenticated')

    await pocketbaseStore.pb.collection('user').update(userId, {
      anilist_user_id: null,
      anilist_username: null,
      anilist_token: null,
      anilist_token_expires_at: null,
      anilist_avatar_url_medium: null,
      anilist_avatar_url_large: null,
      anilist_banner: null
    })

    await myAuthStore.authRefresh()
    toastStore.openToast({ type: 'success', message: 'AniList unlinked.' })
    await navigateTo('/')
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to unlink AniList.' })
  } finally {
    isUnlinking.value = false
  }
}

const saveTheme = async () => {
  // Le theme choisi est persiste en base puis resynchronise localement.
  if (isSavingTheme.value) return
  isSavingTheme.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Not authenticated')

    await pocketbaseStore.pb.collection('user').update(userId, { theme: selectedTheme.value })
    await myAuthStore.authRefresh()
    themeStore.setThemeByName(selectedTheme.value)
    toastStore.openToast({ type: 'success', message: 'Theme saved.' })
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to save theme.' })
  } finally {
    isSavingTheme.value = false
  }
}

const toggleEmailChange = () => {
  showEmailChange.value = !showEmailChange.value
  if (showEmailChange.value) pendingEmail.value = String(authRecord.value.email ?? '')
}

const submitEmailChange = async () => {
  // PocketBase envoie un email de confirmation au lieu de changer directement l'adresse.
  const nextEmail = pendingEmail.value.trim()
  if (!nextEmail) {
    toastStore.openToast({ type: 'error', message: 'Please enter a valid email.' })
    return
  }

  isChangingEmail.value = true
  try {
    await myAuthStore.emailChange(nextEmail)
    toastStore.openToast({ type: 'success', message: 'Confirmation email sent for address change.' })
    showEmailChange.value = false
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to request email change.' })
  } finally {
    isChangingEmail.value = false
  }
}

const togglePasswordReset = () => {
  showPasswordReset.value = !showPasswordReset.value
  if (!showPasswordReset.value) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

const updatePasswordDirectly = async () => {
  // Si la validation locale echoue, on n'envoie aucune requete.
  if (passwordChangeError.value) {
    toastStore.openToast({ type: 'error', message: passwordChangeError.value })
    return
  }

  isUpdatingPassword.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Not authenticated')

    await pocketbaseStore.pb.collection('user').update(userId, {
      oldPassword: currentPassword.value,
      password: newPassword.value,
      passwordConfirm: confirmPassword.value
    })

    await myAuthStore.authRefresh()
    toastStore.openToast({ type: 'success', message: 'Password updated.' })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordReset.value = false
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to update password.' })
  } finally {
    isUpdatingPassword.value = false
  }
}

const deleteAccount = async () => {
  // Suppression irreversible apres confirmation utilisateur.
  if (isDeleting.value) return
  const ok = await alertStore.openAlert({
    type: 'error',
    message: 'Delete your account permanently? This action is irreversible.'
  })
  if (!ok) return

  isDeleting.value = true
  try {
    await myAuthStore.deleteAccount()
    await myAuthStore.logout()
    toastStore.openToast({ type: 'success', message: 'Account deleted.' })
    await navigateTo('/')
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to delete account.' })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  setupScrollSpy()
})

onBeforeUnmount(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
})
</script>

<style scoped src="~/assets/css/pages/settings.css"></style>
