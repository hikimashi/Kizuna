<template>
  <div class="settings-page">
    <div class="page">
      <aside class="sidebar shadow-xl backdrop-blur-sm">
        <div class="sidebar-section">Profil</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'anilist' }" type="button" @click="scrollToSection('anilist')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          AniList
        </button>

        <div class="sidebar-section">Compte</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'profile' }" type="button" @click="scrollToSection('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          Profil
        </button>
        <button class="sidebar-link" :class="{ active: activeSection === 'security' }" type="button" @click="scrollToSection('security')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Securite
        </button>

        <div class="sidebar-section">Application</div>
        <button class="sidebar-link" :class="{ active: activeSection === 'appearance' }" type="button" @click="scrollToSection('appearance')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
          </svg>
          Apparence
        </button>
      </aside>

      <main class="main">
        <div class="settings-sections">
          <section id="section-anilist" ref="anilistSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">AniList</div>
              <div class="section-subtitle">Paramètres du profil AniList lié</div>
            </div>
            <section class="card shadow-xl backdrop-blur-sm">
              <div class="card-header"><span class="card-title">Informations du profil</span></div>
              <div class="card-body anilist-card-body">
                <div class="fields-grid">
                  <div class="field">
                    <span class="field-label">Nom d'utilisateur</span>
                    <div class="field-value">{{ username || '-' }}</div>
                  </div>
                  <div class="field">
                    <span class="field-label">AniList ID</span>
                    <div class="field-value">{{ anilistId || '-' }}</div>
                  </div>
                </div>
                <div class="readonly-note">
                  <span>L'avatar et la bannière sont en lecture seule. Modifiez-les sur AniList puis actualisez.</span>
                  <a class="anilist-settings-link" href="https://anilist.co/settings" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 100 100" width="14" height="14" aria-hidden="true">
                      <circle cx="50" cy="50" r="50" fill="currentColor" />
                      <rect x="20" y="47" width="16" height="33" fill="#0B1622" />
                      <rect x="45" y="20" width="16" height="60" fill="#0B1622" />
                      <rect x="64" y="35" width="16" height="45" fill="#0B1622" />
                    </svg>
                    Paramètres AniList
                  </a>
                </div>
                <div class="profile-hero">
                  <div class="profile-avatar-col">
                    <div class="profile-avatar-label">Avatar</div>
                    <div class="profile-avatar-img">
                      <img v-if="avatarSrc" :src="avatarSrc" alt="Avatar AniList" />
                      <div v-else class="profile-banner-placeholder">Aucun avatar</div>
                    </div>
                  </div>
                  <div class="profile-banner-col">
                    <div class="profile-banner-label">Bannière</div>
                    <div class="profile-banner-img">
                      <img v-if="bannerSrc" :src="bannerSrc" alt="Bannière AniList" />
                      <div v-else class="profile-banner-placeholder">Aucune bannière définie sur AniList</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div class="btn-row">
              <button class="btn-refresh inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isRefreshing" @click="refreshAnilistData">
                {{ isRefreshing ? 'Actualisation...' : 'Actualiser depuis AniList' }}
              </button>
              <button class="btn-danger inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isUnlinking" @click="unlinkAniList">
                {{ isUnlinking ? 'Déliage...' : 'Délier AniList' }}
              </button>
            </div>
          </section>

          <section id="section-profile" ref="profileSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Profil</div>
              <div class="section-subtitle">Informations de votre compte</div>
            </div>
            <section class="card shadow-xl backdrop-blur-sm">
              <div class="card-header"><span class="card-title">Détails du profil</span></div>
              <div class="card-body">
                <div class="fields-grid">
                  <div class="field"><span class="field-label">Email</span><div class="field-value">{{ emailDisplay }}</div></div>
                  <div class="field"><span class="field-label">Inscription</span><div class="field-value">{{ joinedDisplay }}</div></div>
                  <div class="field"><span class="field-label">Nom d'utilisateur AniList</span><div class="field-value">{{ username || '-' }}</div></div>
                  <div class="field"><span class="field-label">AniList ID</span><div class="field-value">{{ anilistId || '-' }}</div></div>
                  <div class="field"><span class="field-label">Expiration du token AniList</span><div class="field-value">{{ anilistTokenExpiryDisplay }}</div></div>
                </div>
              </div>
            </section>
          </section>

          <section id="section-security" ref="securitySectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Sécurité</div>
              <div class="section-subtitle">Mot de passe et sécurité du compte</div>
            </div>

            <section class="card shadow-xl backdrop-blur-sm">
              <div class="card-header"><span class="card-title">Compte</span></div>
              <div class="card-body">
                <div class="account-field">
                  <div class="account-field-info">
                    <div class="account-field-name">Adresse e-mail</div>
                    <div class="account-field-desc">{{ emailDisplay }}</div>
                  </div>
                  <button class="btn-edit inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" type="button" @click="toggleEmailChange">
                    {{ showEmailChange ? 'Annuler' : 'Modifier' }}
                  </button>
                </div>
                <div v-if="showEmailChange" class="account-action">
                  <label class="field-label" for="new-email">Nouvel e-mail</label>
                  <input id="new-email" v-model="pendingEmail" class="action-input w-full rounded-lg px-3 text-sm" type="email" placeholder="name@example.com" />
                  <div class="action-buttons">
                    <button class="btn-edit inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isChangingEmail" type="button" @click="submitEmailChange">
                      {{ isChangingEmail ? 'Envoi...' : 'Envoyer la confirmation' }}
                    </button>
                  </div>
                </div>

                <div class="account-field">
                  <div class="account-field-info">
                    <div class="account-field-name">Mot de passe</div>
                    <div class="account-field-desc">Modifiez directement votre mot de passe.</div>
                  </div>
                  <button class="btn-edit inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" type="button" @click="togglePasswordReset">
                    {{ showPasswordReset ? 'Annuler' : 'Modifier' }}
                  </button>
                </div>
                <div v-if="showPasswordReset" class="account-action">
                  <label class="field-label" for="current-password">Mot de passe actuel</label>
                  <input id="current-password" v-model="currentPassword" class="action-input w-full rounded-lg px-3 text-sm" type="password" />
                  <label class="field-label" for="next-password">Nouveau mot de passe</label>
                  <input id="next-password" v-model="newPassword" class="action-input w-full rounded-lg px-3 text-sm" type="password" />
                  <label class="field-label" for="confirm-password">Confirmer le mot de passe</label>
                  <input id="confirm-password" v-model="confirmPassword" class="action-input w-full rounded-lg px-3 text-sm" type="password" />
                  <p v-if="passwordChangeError" class="security-error">{{ passwordChangeError }}</p>
                  <div class="action-buttons">
                    <button class="btn-edit inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isUpdatingPassword" type="button" @click="updatePasswordDirectly">
                      {{ isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section class="danger-card shadow-xl backdrop-blur-sm">
              <div class="card-header"><span class="card-title">Zone dangereuse</span></div>
              <div class="card-body">
                <div class="account-field danger-row">
                  <div class="account-field-info">
                    <div class="account-field-name">Supprimer le compte</div>
                    <div class="account-field-desc">Supprime definitivement votre compte. Cette action est irreversible.</div>
                  </div>
                  <button class="btn-danger inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isDeleting" @click="deleteAccount">
                    {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
                  </button>
                </div>
              </div>
            </section>
          </section>

          <section id="section-appearance" ref="appearanceSectionRef" class="settings-section">
            <div class="section-header">
              <div class="section-title">Apparence</div>
              <div class="section-subtitle">Theme et preferences visuelles</div>
            </div>
            <section class="card shadow-xl backdrop-blur-sm">
              <div class="card-header"><span class="card-title">Couleur du theme</span></div>
              <div class="card-body">
                <div class="theme-controls">
                  <button class="theme-chip inline-flex items-center justify-center rounded-md px-3.5 text-xs font-bold transition hover:-translate-y-0.5" :class="{ active: selectedTheme === 'forest' }" @click="previewTheme('forest')">Foret</button>
                  <button class="theme-chip inline-flex items-center justify-center rounded-md px-3.5 text-xs font-bold transition hover:-translate-y-0.5" :class="{ active: selectedTheme === 'winter' }" @click="previewTheme('winter')">Hiver</button>
                  <button class="btn-edit inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isSavingTheme" @click="saveTheme">
                    {{ isSavingTheme ? 'Enregistrement...' : 'Enregistrer' }}
                  </button>
                </div>
                <p class="account-field-desc" style="margin-top: 10px;">Le theme est previsualise instantanement ; cliquez sur Enregistrer pour le conserver.</p>
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
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


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
  // Certains anciens tokens n'ont pas de date d'expiration stockee en base.
  if (authRecord.value.anilist_token_expires_at) return formatDateShort(authRecord.value.anilist_token_expires_at)
  return 'Indisponible (non stocke)'
})
const passwordChangeError = computed(() => {
  // Validation réactive: le bouton peut rester simple et afficher l'erreur courante.
  if (!currentPassword.value && !newPassword.value && !confirmPassword.value) return ''
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) return 'Tous les champs sont obligatoires.'
  if (newPassword.value.length < 8) return 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'
  if (newPassword.value !== confirmPassword.value) return 'Les mots de passe ne correspondent pas.'
  return ''
})

/**
 * Formate date time.
 *
 * @param value - Valeur utilisée par le traitement « format date time ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatDateTime(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Formate date.
 *
 * @param value - Valeur utilisée par le traitement « format date ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatDate(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/**
 * Formate date short.
 *
 * @param value - Valeur utilisée par le traitement « format date short ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatDateShort(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

/**
 * Retourne section ref.
 *
 * @param key - Valeur utilisée par le traitement « get section ref ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function getSectionRef(key: SectionKey): HTMLElement | null {
  if (key === 'anilist') return anilistSectionRef.value
  if (key === 'profile') return profileSectionRef.value
  if (key === 'security') return securitySectionRef.value
  return appearanceSectionRef.value
}

/**
 * Fait défiler to section.
 *
 * @param key - Valeur utilisée par le traitement « scroll to section ».
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
function scrollToSection(key: SectionKey) {
  activeSection.value = key
  getSectionRef(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Définit up scroll spy.
 *
 * @returns Le résultat calculé par la fonction.
 * @sideEffects modifie l'état réactif, interagit avec le navigateur ou le DOM.
 */
function setupScrollSpy() {
  const sections: Array<{ key: SectionKey; el: HTMLElement | null }> = [
    { key: 'anilist', el: anilistSectionRef.value },
    { key: 'profile', el: profileSectionRef.value },
    { key: 'security', el: securitySectionRef.value },
    { key: 'appearance', el: appearanceSectionRef.value }
  ]

  sectionObserver = new IntersectionObserver(
    (entries) => {
      // La section la plus visible devient l'entrée active dans la navigation latérale.
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (!visible) return
      const match = sections.find(section => section.el === visible.target)
      if (match) activeSection.value = match.key
    },
    {
      root: null,
      // Fenêtre centrale virtuelle: évite de changer d'onglet pour une section à peine visible.
      rootMargin: '-30% 0px -55% 0px',
      threshold: [0.1, 0.25, 0.5]
    }
  )

  for (const section of sections) {
    if (section.el) sectionObserver.observe(section.el)
  }
}

/**
 * Prévisualise theme.
 *
 * @param theme - Valeur utilisée par le traitement « preview theme ».
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const previewTheme = (theme: 'forest' | 'winter') => {
  // Aperçu immédiat; la persistance PocketBase attend le bouton enregistrer.
  selectedTheme.value = theme
  themeStore.setThemeByName(theme)
}

/**
 * Calcule la valeur « refresh anilist data ».
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const refreshAnilistData = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await anilistAuthStore.refreshLinkedAniListProfile()
  } finally {
    isRefreshing.value = false
  }
}

/**
 * Calcule la valeur « unlink ani list ».
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif, effectue des appels réseau ou persistants.
 */
const unlinkAniList = async () => {
  if (isUnlinking.value) return
  // Délier AniList ne supprime pas le compte local PocketBase.
  const ok = await alertStore.openAlert({ type: 'warning', message: 'Delier le compte AniList de Kizuna ?' })
  if (!ok) return

  isUnlinking.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Non authentifie.')

    // Nettoie uniquement les champs derives d'AniList.
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
    toastStore.openToast({ type: 'success', message: 'AniList a été délié.' })
    await navigateTo('/')
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Impossible de delier AniList.' })
  } finally {
    isUnlinking.value = false
  }
}

/**
 * Enregistre theme.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif, effectue des appels réseau ou persistants.
 */
const saveTheme = async () => {
  if (isSavingTheme.value) return
  isSavingTheme.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Non authentifie.')

    // Le thème est stocké en base puis réappliqué localement après refresh auth.
    await pocketbaseStore.pb.collection('user').update(userId, { theme: selectedTheme.value })
    await myAuthStore.authRefresh()
    themeStore.setThemeByName(selectedTheme.value)
    toastStore.openToast({ type: 'success', message: 'Theme enregistre.' })
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible d'enregistrer le theme." })
  } finally {
    isSavingTheme.value = false
  }
}

/**
 * Bascule email change.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const toggleEmailChange = () => {
  showEmailChange.value = !showEmailChange.value
  if (showEmailChange.value) pendingEmail.value = String(authRecord.value.email ?? '')
}

/**
 * Calcule la valeur « submit email change ».
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const submitEmailChange = async () => {
  const nextEmail = pendingEmail.value.trim()
  if (!nextEmail) {
    toastStore.openToast({ type: 'error', message: 'Veuillez saisir une adresse e-mail valide.' })
    return
  }

  isChangingEmail.value = true
  try {
    // PocketBase envoie un email de confirmation, l'adresse active ne change pas immediatement.
    await myAuthStore.emailChange(nextEmail)
    toastStore.openToast({ type: 'success', message: "E-mail de confirmation envoyé pour le changement d'adresse." })
    showEmailChange.value = false
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible de demander le changement d'adresse e-mail." })
  } finally {
    isChangingEmail.value = false
  }
}

/**
 * Bascule password reset.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const togglePasswordReset = () => {
  showPasswordReset.value = !showPasswordReset.value
  if (!showPasswordReset.value) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

/**
 * Met à jour password directly.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif, effectue des appels réseau ou persistants.
 */
const updatePasswordDirectly = async () => {
  if (passwordChangeError.value) {
    toastStore.openToast({ type: 'error', message: passwordChangeError.value })
    return
  }

  isUpdatingPassword.value = true
  try {
    const userId = pocketbaseStore.pb.authStore.model?.id
    if (!userId) throw new Error('Non authentifie.')

    // PocketBase exige l'ancien mot de passe et la confirmation dans la même requête.
    await pocketbaseStore.pb.collection('user').update(userId, {
      oldPassword: currentPassword.value,
      password: newPassword.value,
      passwordConfirm: confirmPassword.value
    })

    await myAuthStore.authRefresh()
    toastStore.openToast({ type: 'success', message: 'Mot de passe mis à jour.' })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordReset.value = false
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Impossible de mettre à jour le mot de passe.' })
  } finally {
    isUpdatingPassword.value = false
  }
}

/**
 * Supprime account.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const deleteAccount = async () => {
  if (isDeleting.value) return
  // Suppression locale definitive; l'identite AniList externe n'est pas modifiee.
  const ok = await alertStore.openAlert({
    type: 'error',
    message: 'Supprimer votre compte definitivement ? Cette action est irreversible.'
  })
  if (!ok) return

  isDeleting.value = true
  try {
    await myAuthStore.deleteAccount()
    await myAuthStore.logout()
    toastStore.openToast({ type: 'success', message: 'Compte supprimé.' })
    await navigateTo('/')
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Impossible de supprimer le compte.' })
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
