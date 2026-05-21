<template>
  <div class="shared-list-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="shared-list-shell">
      <nav class="shared-breadcrumb" aria-label="Fil d'ariane">
        <NuxtLink to="/profilePage">Profil</NuxtLink>
        <span>/</span>
        <NuxtLink to="/sharedLists">Listes partagées</NuxtLink>
        <span>/</span>
        <span>{{ detail?.title || 'Liste partagée' }}</span>
      </nav>

      <div v-if="isLoading" class="status-card">
        Chargement de la liste partagée...
      </div>

      <div v-else-if="loadError" class="status-card error">
        {{ loadError }}
      </div>

      <template v-else-if="detail">
        <section class="group-hero" :style="heroBackgroundStyle">
          <div class="hero-overlay" :style="heroOverlayStyle"></div>
          <div class="hero-texture"></div>

          <div class="hero-top">
            <button class="back-btn" type="button" @click="navigateTo('/sharedLists')">
              <span aria-hidden="true">&lt;</span>
              Retour aux listes partagées
            </button>

            <div class="hero-actions">
              <button v-if="detail.isOwner || detail.isMember" class="ghost-btn settings-btn" type="button" @click="openSettings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" width="14" height="14" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.455 2.455 1.724 1.724 0 0 0 1.065 2.572 1.724 1.724 0 0 1 0 3.35 1.724 1.724 0 0 0-1.065 2.573 1.724 1.724 0 0 1-2.455 2.455 1.724 1.724 0 0 0-2.573 1.065 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.572-1.065 1.724 1.724 0 0 1-2.455-2.455 1.724 1.724 0 0 0-1.066-2.573 1.724 1.724 0 0 1 0-3.35 1.724 1.724 0 0 0 1.066-2.572 1.724 1.724 0 0 1 2.455-2.455 1.724 1.724 0 0 0 2.572-1.066Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Paramètres
              </button>

              <button
                v-if="detail.isMember && !detail.isOwner"
                class="danger-btn"
                type="button"
                :disabled="isLeaving"
                @click="leaveGroup"
              >
                {{ isLeaving ? 'Sortie...' : 'Quitter la liste partagée' }}
              </button>
            </div>
          </div>

          <div class="hero-head">
            <div class="group-cover" :style="detail.imageUrl ? undefined : { background: coverGradient }">
              <img :src="String(detail.imageUrl || '').trim() || DEFAULT_SHARED_LIST_IMAGE" :alt="detail.title" />
            </div>

            <div class="group-copy">
              <div class="group-title-row">
                <h1>{{ detail.title }}</h1>
              </div>

              <div class="group-meta">
                <span class="group-badge" :class="badgeClass(detail.privacy)">
                  {{ privacyLabel(detail.privacy) }}
                </span>
                <span>{{ createdLabel }}</span>
                <span>{{ detailMemberMetaText }}</span>
                <span>{{ detailAnimeMetaText }}</span>
                <span>{{ detail.updatedLabel }}</span>
                <span class="role-accent">{{ detailRoleLabel }}</span>
              </div>

              <p class="group-description">
                {{ detailDescriptionText }}
              </p>

              <div class="hero-members">
                <div
                  v-for="(member, index) in detail.members.slice(0, 6)"
                  :key="`${member.id}-${index}`"
                  class="hero-member-avatar"
                  :class="{ 'has-avatar': !!member.avatar, stacked: index > 0 }"
                  :style="memberAvatarStyle(member)"
                  :title="member.name"
                >
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <span v-else>{{ member.initials }}</span>
                </div>
                <span v-if="detail.memberCount > 6" class="hero-members-more">+{{ detail.memberCount - 6 }}</span>
              </div>
            </div>
          </div>
        </section>

        <div v-if="actionError" class="status-card error inline-error">{{ actionError }}</div>

        <section class="tabs-wrap">
          <div class="tabs-nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              type="button"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </section>

        <section v-if="activeTab === 'anime'" class="content-section">
          <div class="anime-browser">
            <div class="sidebar-slot">
              <aside class="sidebar">
                <label class="filter-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input v-model.trim="animeQuery" type="text" placeholder="Filtrer les animes">
                </label>

                <div>
                  <div class="sidebar-section">Listes</div>
                  <div class="list-links">
                    <button
                      v-for="item in animeFilterItems"
                      :key="item.key"
                      class="list-link"
                      :class="{ active: activeAnimeFilter === item.key }"
                      type="button"
                      @click="activeAnimeFilter = item.key"
                    >
                      {{ item.label }}
                      <span class="list-count">{{ item.count }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div class="sidebar-section">Tri</div>
                  <select v-model="animeSortBy" class="sort-select">
                    <option value="title">Titre</option>
                    <option value="score">Note</option>
                    <option value="progress">Progression</option>
                    <option value="updatedAt">Dernière mise à jour</option>
                  </select>
                </div>

                <div class="sidebar-stats">
                  <div class="stat-chip">
                    <strong>{{ detail.animeVisibilityLimited ? 'Caché' : detail.animeCount }}</strong>
                    <span>Anime</span>
                  </div>
                  <div class="stat-chip">
                    <strong>{{ detail.membersVisibilityLimited ? 'Caché' : detail.memberCount }}</strong>
                    <span>Membres</span>
                  </div>
                  <div class="stat-chip">
                    <strong>{{ detail.animeVisibilityLimited ? 'Caché' : visibleAnimeCount }}</strong>
                    <span>Visibles</span>
                  </div>
                </div>

              </aside>
            </div>

            <section class="main">
              <div class="view-bar">
                <div class="view-mode-group">
                  <button class="view-btn" :class="{ active: viewMode === 'grid' }" type="button" title="Grid" @click="viewMode = 'grid'">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
                  </button>
                  <button class="view-btn" :class="{ active: viewMode === 'list' }" type="button" title="List" @click="viewMode = 'list'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M9 6h13M9 12h13M9 18h13M4 6h.01M4 12h.01M4 18h.01" /></svg>
                  </button>
                  <button class="view-btn" :class="{ active: viewMode === 'compact' }" type="button" title="Compacte" @click="viewMode = 'compact'">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" /></svg>
                  </button>
                </div>

                <button
                  v-if="canAddAnime"
                  class="view-primary"
                  type="button"
                  @click="isAnimePickerOpen = !isAnimePickerOpen"
                >
                  {{ isAnimePickerOpen ? 'Fermer le panneau d\'ajout' : 'Ajouter un anime' }}
                </button>
              </div>

              <div v-if="canAddAnime && isAnimePickerOpen" class="add-anime-overlay" @click.self="isAnimePickerOpen = false">
                <aside class="add-anime-modal" role="dialog" aria-modal="true" aria-labelledby="add-anime-title">
                  <div class="add-anime-head">
                    <div>
                      <div class="add-anime-kicker">Ajouter un anime</div>
                      <h2 id="add-anime-title">Rechercher et ajouter un titre</h2>
                    </div>
                    <p class="panel-copy">Recherchez sur AniList et ajoutez un titre directement à cette liste partagée.</p>
                    <button class="add-anime-close" type="button" aria-label="Fermer l'ajout d'anime" @click="isAnimePickerOpen = false">x</button>
                  </div>

                  <div class="add-anime-body">
                    <div class="add-state-row">
                  <label class="add-state-field">
                    <span>Statut</span>
                    <select v-model="draftAddStatus" class="editor-input">
                      <option v-for="status in STATUS_ORDER" :key="status" :value="status">
                        {{ STATUS_LABELS[status] }}
                      </option>
                    </select>
                  </label>

                  <label class="add-state-field">
                    <span>Progression</span>
                    <input v-model="draftAddProgress" class="editor-input" type="number" min="0" inputmode="numeric" />
                  </label>

                  <label class="add-state-field">
                    <span>Note</span>
                    <input v-model="draftAddScore" class="editor-input" type="number" min="0" max="100" step="0.1" inputmode="decimal" />
                  </label>
                </div>

                <input
                  v-model.trim="animeSearchTerm"
                  type="text"
                  class="search-box full"
                  placeholder="Rechercher un anime AniList"
                  @input="handleAnimeSearchInput"
                />

                <div v-if="isSearchingAnime" class="search-status">Recherche AniList...</div>
                <div v-else-if="animeSearchTerm.length >= 2 && !animeResults.length" class="search-status">Aucun anime trouvé.</div>

                <div v-if="animeResults.length" class="anime-search-results">
                  <article
                    v-for="item in animeResults"
                    :key="item.mediaId"
                    class="anime-search-item"
                    role="link"
                    tabindex="0"
                    @click="navigateTo(item.fetchLink)"
                    @keydown.enter.prevent="navigateTo(item.fetchLink)"
                    @keydown.space.prevent="navigateTo(item.fetchLink)"
                  >
                    <div class="anime-search-cover">
                      <img v-if="item.cover" :src="item.cover" :alt="item.title" />
                      <span v-else>{{ animeCoverLabel(item.title) }}</span>
                    </div>

                    <div class="anime-search-copy">
                      <div class="anime-search-name">{{ item.title }}</div>
                      <div class="anime-search-secondary">
                        {{ item.formatLabel }}
                        <span v-if="item.seasonYear"> - {{ item.seasonYear }}</span>
                        <span> - AniList #{{ item.mediaId }}</span>
                      </div>
                    </div>

                    <button
                      class="search-result-action"
                      :class="{ 'is-disabled': item.alreadyAdded }"
                      type="button"
                      :disabled="item.alreadyAdded || pendingAnimeMediaId === String(item.mediaId)"
                      @click.stop="addAnime(item)"
                    >
                      {{ item.alreadyAdded ? 'Ajoute' : pendingAnimeMediaId === String(item.mediaId) ? 'Ajout...' : 'Ajouter' }}
                    </button>
                  </article>
                </div>
              </div>

                </aside>
              </div>

              <div v-if="!visibleAnimeSections.length" class="empty-state">
                <div class="empty-state-title">{{ detail.animeVisibilityLimited ? 'Les entrées anime sont masquées.' : 'Aucun anime trouvé pour ce filtre.' }}</div>
                <div class="empty-state-text">
                  {{ detail.animeVisibilityLimited ? 'Cette liste est visible, mais ses entrées anime ne sont pas encore exposées aux non-membres.' : canManageAnime ? 'Essayez un autre titre ou utilisez Ajouter un anime.' : 'Vous pouvez parcourir cette liste partagée, mais vous ne pouvez pas modifier ses entrées anime.' }}
                </div>
              </div>

              <div v-else class="content" :class="`view-${viewMode}`">
                <div v-for="section in visibleAnimeSections" :key="section.key" class="anime-section">
                  <div class="section-title">
                    {{ section.label }}
                    <span class="section-count">{{ section.items.length }}</span>
                  </div>
                  <div class="anime-grid">
                    <article
                      v-for="entry in section.items"
                      :key="entry.relationId"
                      class="anime-card"
                      :class="{ 'is-selected': selectedAnimeRelationId === entry.relationId, 'is-readonly': !canManageAnime }"
                      :tabindex="canManageAnime ? 0 : -1"
                      :role="canManageAnime ? 'button' : undefined"
                      @click="openAnimeEditor(entry)"
                      @keydown.enter.prevent="openAnimeEditor(entry)"
                      @keydown.space.prevent="openAnimeEditor(entry)"
                    >
                      <img
                        v-if="entryCoverSrc(entry)"
                        :src="entryCoverSrc(entry)"
                        :srcset="entryCoverSrcSet(entry)"
                        :alt="entry.title"
                        loading="lazy"
                        decoding="async"
                      >
                      <div v-else class="anime-card-placeholder">
                        <span>{{ animeCoverLabel(entry.title) }}</span>
                      </div>
                      <div class="status-dot" :class="statusDotClass(entry.status)"></div>
                      <div class="anime-card-score">{{ formatAnimeScore(entry.score) }}</div>
                      <div class="anime-card-overlay">
                        <div class="anime-card-title" :title="entry.title">{{ entry.title }}</div>
                        <div class="anime-card-progress">{{ entry.progress }} / {{ entryEpisodes(entry) ?? '?' }}</div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section v-else class="content-section">
          <div v-if="detail.membersVisibilityLimited" class="status-card limited-note">
            PocketBase limite encore la liste complète des membres pour les non-propriétaires. Vous pouvez voir une liste partielle ici.
          </div>

          <div class="members-grid">
            <article v-for="member in detail.members" :key="member.id" class="member-card">
              <div class="member-avatar" :class="{ 'has-avatar': !!member.avatar }" :style="memberAvatarStyle(member)">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <span v-else>{{ member.initials }}</span>
              </div>

              <div class="member-info">
                <div class="member-name">
                  {{ member.name }}
                  <span v-if="member.isCurrentUser" class="member-self">(vous)</span>
                </div>
                <div class="member-role">
                  Rejoint {{ member.joinedAt ? formatDateLabel(member.joinedAt) : 'récemment' }}
                </div>
              </div>

              <div class="member-badge" :class="{ owner: member.role === 'owner' }">
                {{ member.role === 'owner' ? 'Propriétaire' : 'Membre' }}
              </div>

              <button
                v-if="detail.canManageMembers && member.role !== 'owner' && member.membershipId && !member.isCurrentUser"
                class="remove-btn"
                type="button"
                :disabled="pendingMembershipActionId === member.membershipId"
                @click="removeMember(member.membershipId)"
              >
                {{ pendingMembershipActionId === member.membershipId ? 'Retrait...' : 'Retirer' }}
              </button>
            </article>
          </div>
        </section>
      </template>
    </div>

    <div v-if="isSettingsOpen && detail" class="settings-overlay" @click.self="closeSettings">
      <aside class="settings-drawer">
        <div class="settings-drawer-head">
          <div>
            <div class="settings-kicker">Paramètres de la liste partagée</div>
            <h2>{{ detail.title }}</h2>
          </div>
          <button class="icon-close" type="button" aria-label="Fermer les paramètres" @click="closeSettings">x</button>
        </div>

        <div class="settings-drawer-body">
          <div v-if="actionError" class="status-card error">{{ actionError }}</div>

          <template v-if="detail.isOwner || detail.canManageMembers">
            <section class="drawer-card">
              <div class="drawer-card-head">
                <div>
                  <h3>Apparence</h3>
                  <p>Modifiez le titre, la confidentialité, l'image de liste et la bannière. Ces valeurs sont enregistrées dans la collection `shared_list`.</p>
                </div>
              </div>

              <div class="settings-field-grid">
                <label class="settings-field">
                  <span>Nom</span>
                  <input v-model.trim="settingsName" class="settings-input" type="text" maxlength="20" />
                </label>

                <label class="settings-field">
                  <span>Confidentialité</span>
                  <select v-model="settingsPrivacy" class="settings-input">
                    <option value="friends">Amis uniquement</option>
                    <option value="private">Privée</option>
                    <option value="public">Publique</option>
                  </select>
                </label>
              </div>

              <div class="settings-media-grid">
                <label class="settings-media-field">
                  <span>Image de la liste</span>
                  <div class="settings-media-preview settings-media-square" :style="settingsGroupImageDisplay ? undefined : { background: coverGradient }">
                    <img v-if="settingsGroupImageDisplay" :src="settingsGroupImageDisplay" alt="Aperçu de l'image de liste" />
                    <img v-else :src="DEFAULT_SHARED_LIST_IMAGE" alt="Image de liste par défaut" />
                  </div>
                  <input class="media-input" type="file" accept="image/*" @change="handleSettingsGroupImageChange" />
                  <small>{{ settingsGroupImageFile?.name || 'Enregistree dans PocketBase comme `image`.' }}</small>
                </label>

                <label class="settings-media-field">
                  <span>Bannière</span>
                  <div class="settings-media-preview settings-media-banner" :style="heroBackgroundStyle">
                    <img v-if="settingsBannerDisplay" :src="settingsBannerDisplay" alt="Aperçu de la bannière" />
                    <span v-else>Aperçu de la bannière</span>
                  </div>
                  <input class="media-input" type="file" accept="image/*" @change="handleSettingsBannerChange" />
                  <small>{{ settingsBannerImageFile?.name || 'Enregistree dans PocketBase comme `banner`.' }}</small>
                </label>
              </div>

              <div class="drawer-actions">
                <button class="drawer-btn drawer-btn-muted" type="button" @click="closeSettings">
                  Annuler
                </button>
                <button class="drawer-btn drawer-btn-primary" type="button" :disabled="isSavingSettings || !hasSettingsChanges" @click="saveSettings">
                  {{ isSavingSettings ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </section>

            <section class="drawer-card">
              <div class="drawer-card-head">
                <div>
                  <h3>Membres</h3>
                  <p>Ajoutez ou retirez des membres. L'appartenance est stockée dans `user_shared_list`.</p>
                </div>
              </div>

              <div class="invite-box">
                <input
                  v-model.trim="memberQuery"
                  type="text"
                  class="search-box full"
                  placeholder="Rechercher un pseudo AniList"
                  @input="handleSearchInput"
                />

                <div v-if="isSearchingUsers" class="search-status">Recherche des utilisateurs...</div>
                <div v-else-if="memberQuery.length >= 2 && !userResults.length" class="search-status">Aucun utilisateur correspondant.</div>

                <div v-if="userResults.length" class="search-results">
                  <button
                    v-for="user in userResults"
                    :key="user.id"
                    class="search-result"
                    type="button"
                    :disabled="pendingAddUserId === user.id"
                    @click="addMember(user.id)"
                  >
                    <span class="member-avatar small" :class="{ 'has-avatar': !!user.avatar }" :style="memberAvatarStyle(user)">
                      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                      <span v-else>{{ user.initials }}</span>
                    </span>
                    <span class="search-name">{{ user.name }}</span>
                    <span class="search-action">{{ pendingAddUserId === user.id ? 'Ajout...' : 'Ajouter' }}</span>
                  </button>
                </div>
              </div>

              <div class="drawer-member-list">
                <article v-for="member in detail.members" :key="member.id" class="drawer-member-row">
                  <div class="member-avatar small" :class="{ 'has-avatar': !!member.avatar }" :style="memberAvatarStyle(member)">
                    <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                    <span v-else>{{ member.initials }}</span>
                  </div>
                  <div class="drawer-member-copy">
                    <strong>{{ member.name }}</strong>
                    <span>{{ member.role === 'owner' ? 'Propriétaire' : 'Membre' }}</span>
                  </div>
                  <select
                    v-if="member.role !== 'owner' && member.membershipId && !member.isCurrentUser"
                    class="member-perm"
                    :value="member.permission"
                    :disabled="pendingMembershipActionId === member.membershipId"
                    @change="updateMemberPermission(member.membershipId, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                    <option value="viewer">viewer</option>
                  </select>
                  <button
                    v-if="member.role !== 'owner' && member.membershipId && !member.isCurrentUser"
                    class="remove-btn"
                    type="button"
                    :disabled="pendingMembershipActionId === member.membershipId"
                    @click="removeMember(member.membershipId)"
                  >
                    {{ pendingMembershipActionId === member.membershipId ? 'Retrait...' : 'Retirer' }}
                  </button>
                </article>
              </div>
            </section>

            <section v-if="detail.isOwner" class="drawer-card danger-card">
              <div class="drawer-card-head">
                <div>
                  <h3>Zone de danger</h3>
                  <p>Supprimez la liste partagée et tous les accès associés pour les membres.</p>
                </div>
              </div>

              <button class="drawer-btn drawer-btn-danger" type="button" :disabled="isDeleting" @click="deleteGroup">
                {{ isDeleting ? 'Suppression...' : 'Supprimer la liste partagée' }}
              </button>
            </section>
          </template>

          <template v-else>
            <section class="drawer-card">
              <div class="drawer-card-head">
                <div>
                  <h3>Informations de la liste partagée</h3>
                  <p>Les membres peuvent consulter ici la configuration de la liste partagée.</p>
                </div>
              </div>

              <div class="info-list">
                <div class="info-row">
                  <span>Créée</span>
                  <strong>{{ formatDateLabel(detail.createdAt) }}</strong>
                </div>
                <div class="info-row">
                  <span>Confidentialité</span>
                  <strong>{{ privacyLabel(detail.privacy) }}</strong>
                </div>
                <div class="info-row">
                  <span>Propriétaire</span>
                  <strong>{{ detail.ownerName }}</strong>
                </div>
                <div class="info-row">
                  <span>Nombre d'animes</span>
                  <strong>{{ detail.animeVisibilityLimited ? 'Caché' : detail.animeCount }}</strong>
                </div>
              </div>
            </section>

            <section v-if="detail.isMember" class="drawer-card danger-card">
              <div class="drawer-card-head">
                <div>
                  <h3>Leave shared list</h3>
                  <p>Remove your membership from `user_shared_list`.</p>
                </div>
              </div>

              <button class="drawer-btn drawer-btn-danger" type="button" :disabled="isLeaving" @click="leaveGroup">
                {{ isLeaving ? 'Leaving...' : 'Leave shared list' }}
              </button>
            </section>
          </template>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div
        v-if="canManageAnime && selectedAnimeEntry"
        class="anime-editor-modal-layer"
        @click.self="closeAnimeEditor"
      >
        <div class="anime-editor-modal" role="dialog" aria-modal="true" aria-labelledby="anime-editor-title">
          <div class="anime-editor-head">
            <div class="anime-editor-media">
              <div class="anime-editor-thumb">
                <img
                  v-if="selectedAnimeCoverSrc"
                  :src="selectedAnimeCoverSrc"
                  :srcset="selectedAnimeCoverSrcSet"
                  :alt="selectedAnimeEntry.title"
                  loading="lazy"
                  decoding="async"
                >
                <div v-else class="anime-card-placeholder">
                  <span>{{ animeCoverLabel(selectedAnimeEntry.title) }}</span>
                </div>
              </div>
              <div class="anime-editor-copy">
                <div class="anime-editor-kicker">Modifier l'entrée partagée</div>
                <h2 id="anime-editor-title" class="anime-editor-title">{{ selectedAnimeEntry.title }}</h2>
                <div class="anime-editor-subtitle">
                  Progression {{ editAnimeProgress || '0' }} / {{ selectedAnimeEpisodes ?? '?' }}
                </div>
              </div>
            </div>
            <button class="anime-editor-close" type="button" aria-label="Fermer" @click="closeAnimeEditor">
              X
            </button>
          </div>

          <div v-if="actionError" class="anime-editor-inline-error">
            {{ actionError }}
          </div>

          <div class="anime-editor-fields">
            <label class="anime-editor-field">
              <span>Statut</span>
              <select v-model="editAnimeStatus" class="anime-editor-input">
                <option v-for="status in STATUS_ORDER" :key="status" :value="status">
                  {{ STATUS_LABELS[status] }}
                </option>
              </select>
            </label>

            <label class="anime-editor-field">
              <span>Progression</span>
              <input
                v-model="editAnimeProgress"
                class="anime-editor-input"
                type="number"
                min="0"
                :max="selectedAnimeEpisodes ?? undefined"
                inputmode="numeric"
              >
            </label>

            <label class="anime-editor-field">
              <span>Note</span>
              <input
                v-model="editAnimeScore"
                class="anime-editor-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Pas de note"
                inputmode="decimal"
              >
            </label>
          </div>

          <div class="anime-editor-actions">
            <button class="editor-btn editor-btn-muted" type="button" @click="closeAnimeEditor">
              Annuler
            </button>
            <button
              v-if="canDeleteAnime"
              class="editor-btn editor-btn-danger"
              type="button"
              :disabled="isDeletingAnime"
              @click="deleteAnimeEntry"
            >
              {{ isDeletingAnime ? 'Suppression...' : 'Supprimer' }}
            </button>
            <button class="editor-btn editor-btn-primary" type="button" :disabled="isSavingAnime" @click="saveAnimeEntry">
              {{ isSavingAnime ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import {
  useSharedLists,
  type SharedListAnimeEntry,
  type SharedListAnimeStatus,
  type SharedListDetail,
  type SharedListMember,
  type SharedListPrivacy
} from '~/composables/useSharedLists'

type DetailTab = 'anime' | 'members'
type ViewMode = 'grid' | 'list' | 'compact'
type AnimeSortKey = 'title' | 'score' | 'progress' | 'updatedAt'
type AnimeFilterKey = 'ALL' | SharedListAnimeStatus
type AniListGraphqlResponse<T> = { data?: T; errors?: Array<{ message?: string | null }> | null }
type AniListSearchMedia = {
  id?: number | null
  seasonYear?: number | null
  episodes?: number | null
  format?: string | null
  title?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  } | null
  coverImage?: {
    large?: string | null
    medium?: string | null
  } | null
}
type AnimeSearchResult = {
  mediaId: number
  title: string
  cover?: string
  seasonYear?: number
  episodes?: number
  formatLabel: string
  fetchLink: string
  alreadyAdded: boolean
}
type SharedAnimeMedia = {
  id?: number | null
  episodes?: number | null
  title?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  } | null
  coverImage?: AnilistCoverImage | null
}
type SearchableUser = { id: string; name: string; avatar?: string; initials: string; color: string }

const STATUS_LABELS: Record<SharedListAnimeStatus, string> = {
  PLANNING: 'À voir',
  CURRENT: 'En cours',
  PAUSED: 'En pause',
  DROPPED: 'Abandonné',
  REPEATING: 'Revisionnage',
  COMPLETED: 'Terminé'
}

const STATUS_ORDER: SharedListAnimeStatus[] = ['PLANNING', 'CURRENT', 'PAUSED', 'DROPPED', 'REPEATING', 'COMPLETED']

const route = useRoute()
const anilistGraphql = useAnilistGraphql()
const profileTabs = [
  { key: 'anime-list', label: 'Liste d\'animes', to: '/animeList' },
  { key: 'favorites', label: 'Favoris', to: '/favorites' },
  { key: 'friends', label: 'Amis', to: '/friends' },
  { key: 'shared-lists', label: 'Listes partagées', to: '/sharedLists', active: true }
]

const {
  currentUserId,
  formatDateLabel,
  loadDetail,
  updateSharedList,
  addMemberToList,
  addAnimeToList,
  updateAnimeListEntry,
  removeAnimeFromList,
  removeMembership,
  updateMembershipPermission,
  deleteSharedList,
  migrateLegacyMemberships,
  searchUsers
} = useSharedLists()

const isLoading = ref(true)
const isDeleting = ref(false)
const isLeaving = ref(false)
const isSearchingUsers = ref(false)
const isSearchingAnime = ref(false)
const isAnimePickerOpen = ref(false)
const isSavingAnime = ref(false)
const isDeletingAnime = ref(false)
const isSavingSettings = ref(false)
const isSettingsOpen = ref(false)
const loadError = ref('')
const actionError = ref('')
const pendingAddUserId = ref('')
const pendingMembershipActionId = ref('')
const pendingAnimeMediaId = ref('')
const detail = ref<SharedListDetail | null>(null)
const animeMediaMap = ref<Record<number, SharedAnimeMedia>>({})
const memberQuery = ref('')
const animeQuery = ref('')
const animeSearchTerm = ref('')
const animeSortBy = ref<AnimeSortKey>('title')
const activeAnimeFilter = ref<AnimeFilterKey>('ALL')
const selectedAnimeRelationId = ref('')
const editAnimeStatus = ref<SharedListAnimeStatus>('PLANNING')
const editAnimeProgress = ref('0')
const editAnimeScore = ref('')
const draftAddStatus = ref<SharedListAnimeStatus>('PLANNING')
const draftAddProgress = ref('0')
const draftAddScore = ref('')
const activeTab = ref<DetailTab>('anime')
const viewMode = ref<ViewMode>('grid')
const userResults = ref<SearchableUser[]>([])
const animeResults = ref<AnimeSearchResult[]>([])
const settingsName = ref('')
const settingsPrivacy = ref<SharedListPrivacy>('friends')
const settingsGroupImageFile = ref<File | null>(null)
const settingsBannerImageFile = ref<File | null>(null)
const settingsGroupImagePreview = ref('')
const settingsBannerPreview = ref('')

const listId = computed(() => String(route.params.id || ''))
const currentMember = computed(() => detail.value?.members.find(member => member.isCurrentUser) || null)
// Les permissions viennent du détail déjà normalisé par useSharedLists.
const canManageAnime = computed(() => {
  if (!detail.value) return false
  if (detail.value.isOwner) return true
  return Boolean(currentMember.value?.canEditAnime)
})
const canDeleteAnime = computed(() => {
  if (!detail.value) return false
  if (detail.value.isOwner) return true
  return Boolean(currentMember.value?.canDeleteAnime)
})
const canAddAnime = computed(() => {
  if (!detail.value) return false
  if (detail.value.isOwner) return true
  return Boolean(currentMember.value?.canAddAnime)
})
const existingAnimeIds = computed(() => new Set((detail.value?.animeEntries || []).map(entry => Number(entry.mediaId || 0)).filter(Boolean)))
const createdLabel = computed(() => detail.value?.createdAt ? `Créée ${formatDateLabel(detail.value.createdAt)}` : 'Créée récemment')

const tabs = [
  { key: 'anime' as DetailTab, label: 'Liste d\'animes' },
  { key: 'members' as DetailTab, label: 'Membres' }
]

const coverGradient = computed(() => {
  // Fallback déterministe: une même liste garde la même couleur même sans image.
  const gradients = [
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    'linear-gradient(135deg, #3db4f2 0%, #2e8bc0 100%)',
    'linear-gradient(135deg, #9256f3 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)'
  ]
  const title = String(detail.value?.title || '')
  let score = 0
  for (const char of title) score += char.charCodeAt(0)
  return gradients[score % gradients.length] || gradients[0]
})

const DEFAULT_SHARED_LIST_IMAGE = '/img/user.webp'

const heroBackgroundStyle = computed(() => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))'
}))

const heroOverlayStyle = computed(() => {
  const bannerUrl = String(detail.value?.bannerUrl || '').trim()
  const defaultBannerUrl = '/img/banner.webp'
  const resolvedBanner = bannerUrl || defaultBannerUrl
  if (resolvedBanner) {
    // La bannière reste dans l'overlay pour conserver le dégradé lisible au-dessus.
    return {
      backgroundImage: `linear-gradient(180deg, rgba(11,22,34,.12) 0%, rgba(11,22,34,.72) 100%), url("${resolvedBanner}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }
  }

  return {
    background: `linear-gradient(180deg, rgba(11,22,34,.12) 0%, rgba(11,22,34,.72) 100%), ${coverGradient.value}`
  }
})

const coverLabel = computed(() => String(detail.value?.title || 'SL').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'SL')

const badgeClass = (privacy: SharedListPrivacy) => ({
  private: privacy === 'private',
  friends: privacy === 'friends',
  public: privacy === 'public'
})

const memberAvatarStyle = (member: Pick<SharedListMember, 'avatar' | 'color'> | SearchableUser) =>
  member.avatar ? undefined : { background: member.color }

const revokePreviewUrl = (value: string) => {
  // Les previews fichier créent des blob: URLs; on les libère pour éviter les fuites mémoire.
  if (value.startsWith('blob:')) URL.revokeObjectURL(value)
}

const setPreview = (target: typeof settingsGroupImagePreview, file: File | null) => {
  revokePreviewUrl(target.value)
  target.value = file ? URL.createObjectURL(file) : ''
}

const resetSettingsMediaDrafts = () => {
  settingsGroupImageFile.value = null
  settingsBannerImageFile.value = null
  setPreview(settingsGroupImagePreview, null)
  setPreview(settingsBannerPreview, null)
}

const syncSettingsDraft = (source: SharedListDetail) => {
  // Les champs du drawer sont des brouillons; fermer le drawer remet l'état serveur.
  settingsName.value = source.title
  settingsPrivacy.value = source.privacy
  resetSettingsMediaDrafts()
}

const settingsGroupImageDisplay = computed(() => settingsGroupImagePreview.value || detail.value?.imageUrl || '')
const settingsBannerDisplay = computed(() => settingsBannerPreview.value || detail.value?.bannerUrl || '')
const hasSettingsChanges = computed(() => {
  if (!detail.value) return false
  // Les fichiers sont compares par presence car leur contenu n'est pas relu depuis PocketBase.
  return settingsName.value.trim() !== detail.value.title
    || settingsPrivacy.value !== detail.value.privacy
    || Boolean(settingsGroupImageFile.value)
    || Boolean(settingsBannerImageFile.value)
})

const rawAnimeSections = computed<Record<SharedListAnimeStatus, SharedListAnimeEntry[]>>(() => {
  // Les entrées PocketBase sont groupées par statut pour réutiliser l'affichage de liste AniList.
  const sections = {
    PLANNING: [],
    CURRENT: [],
    PAUSED: [],
    DROPPED: [],
    REPEATING: [],
    COMPLETED: []
  } as Record<SharedListAnimeStatus, SharedListAnimeEntry[]>

  for (const entry of detail.value?.animeEntries || []) {
    const key = STATUS_ORDER.includes(entry.status) ? entry.status : 'PLANNING'
    sections[key].push(entry)
  }

  return sections
})

const animeFilterItems = computed(() => {
  // Les compteurs restent bases sur les sections non filtrees par recherche texte.
  const allCount = STATUS_ORDER.reduce((sum, key) => sum + rawAnimeSections.value[key].length, 0)
  return [
    { key: 'ALL' as AnimeFilterKey, label: 'Tout', count: allCount },
    ...STATUS_ORDER.map((key) => ({
      key: key as AnimeFilterKey,
      label: STATUS_LABELS[key],
      count: rawAnimeSections.value[key].length
    }))
  ]
})

const sortedAnimeSections = computed(() => {
  const needle = animeQuery.value.trim().toLowerCase()

  // Filtre texte puis tri local: aucune requête PocketBase supplémentaire pendant la saisie.
  return STATUS_ORDER.map((status) => {
    const filtered = (rawAnimeSections.value[status] || []).filter((entry) => {
      if (!needle) return true
      return entry.title.toLowerCase().includes(needle)
    })

    const items = [...filtered].sort((a, b) => {
      if (animeSortBy.value === 'title') return a.title.localeCompare(b.title)
      if (animeSortBy.value === 'score') return (b.score || 0) - (a.score || 0)
      if (animeSortBy.value === 'progress') return (b.progress || 0) - (a.progress || 0)
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    })

    return {
      key: status,
      label: STATUS_LABELS[status],
      items
    }
  })
})

const visibleAnimeSections = computed(() => {
  // En vue globale, les statuts vides disparaissent pour garder une lecture plus dense.
  if (activeAnimeFilter.value === 'ALL') {
    return sortedAnimeSections.value.filter(section => section.items.length > 0)
  }

  const selected = sortedAnimeSections.value.find(section => section.key === activeAnimeFilter.value)
  if (!selected || !selected.items.length) return []
  return [selected]
})

const visibleAnimeCount = computed(() => visibleAnimeSections.value.reduce((sum, section) => sum + section.items.length, 0))
const selectedAnimeEntry = computed(() =>
  detail.value?.animeEntries.find(entry => entry.relationId === selectedAnimeRelationId.value) || null
)
const detailRoleLabel = computed(() => {
  if (!detail.value) return ''
  if (detail.value.isOwner) return 'Propriétaire'
  if (detail.value.isMember) return 'Membre'
  return 'Visiteur'
})
const detailMemberMetaText = computed(() => {
  if (!detail.value) return '0 membre'
  if (detail.value.membersVisibilityLimited) return 'Membres masqués'
  return `${detail.value.memberCount} membre${detail.value.memberCount > 1 ? 's' : ''}`
})
const detailAnimeMetaText = computed(() => {
  if (!detail.value) return '0 anime'
  if (detail.value.animeVisibilityLimited) return 'Anime masqués'
  return `${detail.value.animeCount} anime`
})
const detailDescriptionText = computed(() => {
  if (!detail.value) return ''
  if (detail.value.animeVisibilityLimited) {
    return `Créée par ${detail.value.ownerName}. Les entrées anime sont masquées pour ce niveau de visibilité.`
  }
  return `Créée par ${detail.value.ownerName}. ${detail.value.animeCount} anime actuellement dans la liste partagée.`
})

const selectedAnimeMedia = computed(() => {
  const mediaId = Number(selectedAnimeEntry.value?.mediaId || 0)
  return mediaId ? animeMediaMap.value[mediaId] || null : null
})

const selectedAnimeEpisodes = computed(() => selectedAnimeMedia.value?.episodes ?? null)
const selectedAnimeCoverSrc = computed(() => getAnilistCoverSrc(selectedAnimeMedia.value?.coverImage, 'thumb') || undefined)
const selectedAnimeCoverSrcSet = computed(() => getAnilistCoverSrcSet(selectedAnimeMedia.value?.coverImage, 'thumb'))

const loadAnimeMedia = async (entries: SharedListAnimeEntry[]) => {
  const ids = Array.from(new Set(entries.map(entry => Number(entry.mediaId || 0)).filter(Boolean)))
  if (!ids.length) {
    animeMediaMap.value = {}
    return
  }

  try {
    // Les records PocketBase gardent l'id AniList; on récupère les métadonnées fraîches en une requête groupée.
    const response = await anilistGraphql.request<AniListGraphqlResponse<{
      Page?: {
        media?: SharedAnimeMedia[] | null
      } | null
    }>>(
      `
        query ($ids: [Int]) {
          Page(page: 1, perPage: 50) {
            media(id_in: $ids, type: ANIME) {
              id
              episodes
              title {
                romaji
                english
                native
              }
              coverImage {
                medium
                large
                extraLarge
              }
            }
          }
        }
      `,
      { ids },
      { cacheTtlMs: 60_000 }
    )

    if (response?.errors?.length) {
      animeMediaMap.value = {}
      return
    }

    const media = Array.isArray(response?.data?.Page?.media) ? response.data.Page.media : []
    animeMediaMap.value = Object.fromEntries(
      media
        .map(item => [Number(item.id || 0), item] as const)
        .filter(([id]) => id > 0)
    )
  } catch {
    animeMediaMap.value = {}
  }
}

const loadPage = async () => {
  if (!listId.value) return
  if (!currentUserId.value) {
    detail.value = null
    animeMediaMap.value = {}
    loadError.value = ''
    actionError.value = ''
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''
  actionError.value = ''

  try {
    let result = await loadDetail(listId.value)

    if (result.isOwner) {
      // Le propriétaire peut réparer à l'ouverture les memberships créés avant le modèle de permissions actuel.
      const migration = await migrateLegacyMemberships(listId.value)
      if (!result.ownMembershipId || migration.changed) {
        result = await loadDetail(listId.value)
      }
      if (migration.failedMembershipIds.length) {
        actionError.value = 'Certaines anciennes permissions de membres n\'ont pas pu être migrées automatiquement.'
      }
    }

    detail.value = result
    if (!isSettingsOpen.value) {
      syncSettingsDraft(result)
    } else {
      settingsName.value = result.title
      settingsPrivacy.value = result.privacy
    }
    await loadAnimeMedia(result.animeEntries)

    if (animeResults.value.length) {
      const existingIds = new Set(result.animeEntries.map(entry => Number(entry.mediaId || 0)).filter(Boolean))
      animeResults.value = animeResults.value.map(item => ({
        ...item,
        alreadyAdded: existingIds.has(item.mediaId)
      }))
    }
  } catch (error: any) {
    detail.value = null
    animeMediaMap.value = {}
    loadError.value = error?.message || 'Impossible de charger cette liste partagée.'
  } finally {
    isLoading.value = false
  }
}

const privacyLabel = (privacy: SharedListPrivacy) => privacy === 'private' ? 'Privée' : privacy === 'friends' ? 'Amis uniquement' : 'Publique'

const openSettings = () => {
  if (!detail.value || (!detail.value.isOwner && !detail.value.isMember)) return
  // Ouvrir les paramètres recopie toujours l'état courant pour éviter un ancien brouillon.
  syncSettingsDraft(detail.value)
  isSettingsOpen.value = true
}

const closeSettings = () => {
  if (detail.value) {
    syncSettingsDraft(detail.value)
  } else {
    resetSettingsMediaDrafts()
  }
  memberQuery.value = ''
  userResults.value = []
  isSettingsOpen.value = false
}

const handleSettingsGroupImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null
  settingsGroupImageFile.value = file
  setPreview(settingsGroupImagePreview, file)
}

const handleSettingsBannerChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null
  settingsBannerImageFile.value = file
  setPreview(settingsBannerPreview, file)
}

const saveSettings = async () => {
  if (!detail.value || (!detail.value.isOwner && !detail.value.canManageMembers)) return
  if (!settingsName.value.trim()) {
    actionError.value = 'Le nom de la liste est obligatoire.'
    return
  }

  isSavingSettings.value = true
  actionError.value = ''

  try {
    // updateSharedList gère FormData et les champs fichiers optionnels côté composable.
    await updateSharedList(detail.value.id, {
      name: settingsName.value,
      privacy: settingsPrivacy.value,
      groupImageFile: settingsGroupImageFile.value,
      bannerImageFile: settingsBannerImageFile.value
    })
    await loadPage()
    closeSettings()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de mettre à jour cette liste partagée.'
  } finally {
    isSavingSettings.value = false
  }
}

let memberSearchTimer: ReturnType<typeof setTimeout> | null = null
let animeSearchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = () => {
  if (!detail.value) return
  if (!detail.value.canManageMembers) return
  if (memberSearchTimer) clearTimeout(memberSearchTimer)

  if (memberQuery.value.trim().length < 2) {
    userResults.value = []
    isSearchingUsers.value = false
    return
  }

  // Debounce pour éviter de frapper PocketBase à chaque caractère dans le drawer membres.
  memberSearchTimer = setTimeout(async () => {
    if (!detail.value) return
    isSearchingUsers.value = true

    try {
      userResults.value = await searchUsers(
        memberQuery.value,
        detail.value.members.map(member => member.id)
      )
    } catch {
      userResults.value = []
    } finally {
      isSearchingUsers.value = false
    }
  }, 200)
}

const addMember = async (userId: string) => {
  if (!detail.value) return
  if (!detail.value.canManageMembers) {
    actionError.value = 'Vous n\'avez pas la permission d\'ajouter des membres à cette liste partagée.'
    return
  }

  pendingAddUserId.value = userId
  actionError.value = ''

  try {
    // Après ajout, on recharge pour récupérer permission, membershipId et avatar normalisés.
    await addMemberToList(detail.value.id, userId)
    memberQuery.value = ''
    userResults.value = []
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible d\'ajouter ce membre.'
  } finally {
    pendingAddUserId.value = ''
  }
}

const formatAnimeSearchTitle = (media: AniListSearchMedia) => {
  return String(media.title?.romaji || media.title?.english || media.title?.native || '').trim() || `AniList #${media.id || 0}`
}

const formatMediaFormat = (value?: string | null) => {
  const label = String(value || '').trim().toLowerCase()
  if (!label) return 'Anime'
  return label
    .split('_')
    .map(part => {
      const normalizedPart = part || ''
      return normalizedPart ? `${normalizedPart[0]?.toUpperCase() || ''}${normalizedPart.slice(1)}` : ''
    })
    .join(' ')
}

const searchAnime = async (query: string) => {
  // Recherche AniList publique: la liste partagée garde seulement l'id media et les champs d'état locaux.
  const response = await anilistGraphql.request<AniListGraphqlResponse<{
    Page?: {
      media?: AniListSearchMedia[] | null
    } | null
  }>>(
    `
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(search: $search, type: ANIME, isAdult: false) {
            id
            seasonYear
            episodes
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
          }
        }
      }
    `,
    { search: query },
    { cacheTtlMs: 60_000 }
  )

  if (response?.errors?.length) {
    throw new Error(response.errors[0]?.message || 'Impossible de rechercher sur AniList.')
  }

  const items = Array.isArray(response?.data?.Page?.media) ? response.data.Page.media : []
  return items
    .map((media) => {
      const mediaId = Number(media.id || 0)
      // alreadyAdded désactive le bouton avant même d'appeler PocketBase.
      return {
        mediaId,
        title: formatAnimeSearchTitle(media),
        cover: String(media.coverImage?.large || media.coverImage?.medium || '').trim() || undefined,
        seasonYear: Number(media.seasonYear || 0) || undefined,
        episodes: Number(media.episodes || 0) || undefined,
        formatLabel: formatMediaFormat(media.format),
        fetchLink: `/anime/${mediaId}`,
        alreadyAdded: existingAnimeIds.value.has(mediaId)
      } satisfies AnimeSearchResult
    })
    .filter(item => item.mediaId > 0)
}

const handleAnimeSearchInput = () => {
  if (animeSearchTimer) clearTimeout(animeSearchTimer)

  if (animeSearchTerm.value.trim().length < 2) {
    animeResults.value = []
    isSearchingAnime.value = false
    return
  }

  // Debounce séparé de la recherche membres: les deux panneaux peuvent évoluer indépendamment.
  animeSearchTimer = setTimeout(async () => {
    isSearchingAnime.value = true

    try {
      animeResults.value = await searchAnime(animeSearchTerm.value)
    } catch (error: any) {
      animeResults.value = []
      actionError.value = error?.message || 'Impossible de rechercher sur AniList.'
    } finally {
      isSearchingAnime.value = false
    }
  }, 220)
}

const addAnime = async (item: AnimeSearchResult) => {
  if (!detail.value) return
  if (!canAddAnime.value) {
    actionError.value = 'Vous n\'avez pas la permission d\'ajouter des animes à cette liste partagée.'
    return
  }

  const resolvedEpisodes = Number(item.episodes || 0) || null
  const resolvedStatus = draftAddStatus.value
  // Si l'utilisateur ajoute directement en "terminé", la progression suit le nombre d'épisodes connu.
  const resolvedProgress = resolvedStatus === 'COMPLETED' && resolvedEpisodes
    ? resolvedEpisodes
    : Number(draftAddProgress.value || 0) || 0
  const resolvedScore = Number(draftAddScore.value || 0) || 0

  pendingAnimeMediaId.value = String(item.mediaId)
  actionError.value = ''

  try {
    await addAnimeToList(detail.value.id, {
      mediaId: item.mediaId,
      title: item.title,
      fetchLink: item.fetchLink,
      status: resolvedStatus,
      progress: resolvedProgress,
      score: resolvedScore
    })
    animeSearchTerm.value = ''
    animeResults.value = []
    isAnimePickerOpen.value = false
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible d\'ajouter cet anime.'
  } finally {
    pendingAnimeMediaId.value = ''
  }
}

const formatAnimeScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const statusDotClass = (status: SharedListAnimeStatus) => {
  if (status === 'CURRENT') return 'dot-watching'
  if (status === 'COMPLETED') return 'dot-completed'
  if (status === 'PAUSED') return 'dot-paused'
  if (status === 'DROPPED') return 'dot-dropped'
  if (status === 'REPEATING') return 'dot-rewatching'
  return 'dot-planned'
}

const entryCoverSrc = (entry: SharedListAnimeEntry) =>
  getAnilistCoverSrc(animeMediaMap.value[Number(entry.mediaId || 0)]?.coverImage, viewMode.value === 'grid' ? 'card' : 'thumb') || undefined

const entryCoverSrcSet = (entry: SharedListAnimeEntry) =>
  getAnilistCoverSrcSet(animeMediaMap.value[Number(entry.mediaId || 0)]?.coverImage, viewMode.value === 'grid' ? 'card' : 'thumb')

const entryEpisodes = (entry: SharedListAnimeEntry) =>
  animeMediaMap.value[Number(entry.mediaId || 0)]?.episodes ?? null

const openAnimeEditor = (entry: SharedListAnimeEntry) => {
  if (!canManageAnime.value) return
  // Copie l'entrée sélectionnée dans le formulaire pour pouvoir annuler sans modifier l'affichage.
  selectedAnimeRelationId.value = entry.relationId
  editAnimeStatus.value = entry.status
  editAnimeProgress.value = String(entry.progress ?? 0)
  editAnimeScore.value = entry.score ? String(entry.score) : ''
}

const closeAnimeEditor = () => {
  selectedAnimeRelationId.value = ''
  editAnimeStatus.value = 'PLANNING'
  editAnimeProgress.value = '0'
  editAnimeScore.value = ''
}

const saveAnimeEntry = async () => {
  if (!selectedAnimeEntry.value) return
  if (!canManageAnime.value) {
    actionError.value = 'Vous n\'avez pas la permission de modifier les entrées anime de cette liste partagée.'
    return
  }

  isSavingAnime.value = true
  actionError.value = ''

  try {
    const nextProgressRaw = Number(editAnimeProgress.value)
    const nextScore = Number(editAnimeScore.value)
    // En statut terminé, l'épisode total connu l'emporte sur une saisie manuelle plus basse.
    const completedEpisodes = editAnimeStatus.value === 'COMPLETED'
      ? Number(selectedAnimeEpisodes.value || 0) || 0
      : 0
    const resolvedProgress = completedEpisodes > 0 ? completedEpisodes : (Number.isFinite(nextProgressRaw) ? nextProgressRaw : 0)
    await updateAnimeListEntry(selectedAnimeEntry.value.relationId, {
      status: editAnimeStatus.value,
      progress: editAnimeProgress.value === '' ? 0 : resolvedProgress,
      score: editAnimeScore.value === '' || !Number.isFinite(nextScore) ? 0 : nextScore
    })
    await loadPage()
    closeAnimeEditor()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de mettre à jour cette entrée anime.'
  } finally {
    isSavingAnime.value = false
  }
}

watch([editAnimeStatus, selectedAnimeEpisodes], () => {
  if (editAnimeStatus.value !== 'COMPLETED') return
  const episodes = Number(selectedAnimeEpisodes.value || 0) || 0
  if (!episodes) return
  // Même comportement que la liste AniList personnelle: "terminé" remplit la progression.
  editAnimeProgress.value = String(episodes)
})

watch(draftAddStatus, () => {
  if (draftAddStatus.value !== 'COMPLETED') return
  // Lors de l'ajout, on attend de connaître les épisodes du résultat choisi avant de remplir vraiment.
  draftAddProgress.value = '0'
})

const deleteAnimeEntry = async () => {
  if (!selectedAnimeEntry.value) return
  if (!canDeleteAnime.value) {
    actionError.value = 'Vous n\'avez pas la permission de retirer des animes de cette liste partagée.'
    return
  }
  if (typeof window !== 'undefined' && !window.confirm(`Supprimer "${selectedAnimeEntry.value.title}" de cette liste partagée ?`)) {
    return
  }

  isDeletingAnime.value = true
  actionError.value = ''

  try {
    await removeAnimeFromList(selectedAnimeEntry.value.relationId)
    await loadPage()
    closeAnimeEditor()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de supprimer cette entrée anime.'
  } finally {
    isDeletingAnime.value = false
  }
}

const removeMember = async (membershipId: string) => {
  if (!detail.value?.canManageMembers) {
    actionError.value = 'Vous n\'avez pas la permission de retirer des membres de cette liste partagée.'
    return
  }

  pendingMembershipActionId.value = membershipId
  actionError.value = ''

  try {
    // removeMembership refait les checks d'autorisation dans le composable avant suppression.
    await removeMembership(membershipId)
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de retirer ce membre.'
  } finally {
    pendingMembershipActionId.value = ''
  }
}

const updateMemberPermission = async (membershipId: string, permissionRaw: string) => {
  // Le select vient du DOM: on le resserre sur les trois permissions supportees.
  const permission = (permissionRaw === 'admin' || permissionRaw === 'editor' || permissionRaw === 'viewer')
    ? permissionRaw
    : 'viewer'

  if (!detail.value?.canManageMembers) {
    actionError.value = "Vous n'avez pas la permission de modifier les rôles des membres de cette liste partagée."
    return
  }

  pendingMembershipActionId.value = membershipId
  actionError.value = ''

  try {
    await updateMembershipPermission(membershipId, permission)
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de mettre à jour les permissions du membre.'
  } finally {
    pendingMembershipActionId.value = ''
  }
}

const leaveGroup = async () => {
  if (!detail.value?.ownMembershipId) {
    actionError.value = 'Votre fiche d\'appartenance est introuvable.'
    return
  }

  isLeaving.value = true
  actionError.value = ''

  try {
    // Quitter une liste revient à supprimer son propre record user_shared_list.
    await removeMembership(detail.value.ownMembershipId)
    closeSettings()
    await navigateTo('/sharedLists')
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de quitter cette liste partagée.'
  } finally {
    isLeaving.value = false
  }
}

const deleteGroup = async () => {
  if (!detail.value) return
  // Suppression complete: le composable nettoie les relations anime/membres avant shared_list.
  if (typeof window !== 'undefined' && !window.confirm(`Supprimer "${detail.value.title}" ? Cette action est irréversible.`)) {
    return
  }

  isDeleting.value = true
  actionError.value = ''

  try {
    // deleteSharedList vérifie le propriétaire puis supprime les dépendances PocketBase.
    await deleteSharedList(detail.value.id)
    closeSettings()
    await navigateTo('/sharedLists')
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de supprimer cette liste partagée.'
  } finally {
    isDeleting.value = false
  }
}

const animeCoverLabel = (title: string) => title.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'AN'
const isAnimeEditorOpen = computed(() => canManageAnime.value && Boolean(selectedAnimeEntry.value))
const isAnimePickerModalOpen = computed(() => canAddAnime.value && isAnimePickerOpen.value)

const handleAnimeEditorKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isAnimeEditorOpen.value) return
  closeAnimeEditor()
}

const handleAnimePickerKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isAnimePickerModalOpen.value) return
  isAnimePickerOpen.value = false
}

watch(listId, () => {
  // Changement de route dynamique: tous les panneaux et recherches reviennent à leur état initial.
  memberQuery.value = ''
  animeQuery.value = ''
  animeSearchTerm.value = ''
  animeSortBy.value = 'title'
  activeAnimeFilter.value = 'ALL'
  userResults.value = []
  animeResults.value = []
  isAnimePickerOpen.value = false
  isSettingsOpen.value = false
  viewMode.value = 'grid'
  closeAnimeEditor()
  activeTab.value = 'anime'
  loadPage()
})

watch(currentUserId, () => {
  // Le detail depend de l'utilisateur courant car les droits et visibilites changent avec la session.
  loadPage()
}, { immediate: true })

onBeforeUnmount(() => {
  // Nettoyage des timers et previews creees par les recherches/drawers.
  if (memberSearchTimer) clearTimeout(memberSearchTimer)
  if (animeSearchTimer) clearTimeout(animeSearchTimer)
  revokePreviewUrl(settingsGroupImagePreview.value)
  revokePreviewUrl(settingsBannerPreview.value)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleAnimeEditorKeydown)
    window.removeEventListener('keydown', handleAnimePickerKeydown)
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleAnimeEditorKeydown)
  window.addEventListener('keydown', handleAnimePickerKeydown)
}
</script>

<style scoped src="~/assets/css/pages/sharedListDetail.css"></style>
