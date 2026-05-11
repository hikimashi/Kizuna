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
                    <strong>{{ detail.animeVisibilityLimited ? 'Cache' : detail.animeCount }}</strong>
                    <span>Anime</span>
                  </div>
                  <div class="stat-chip">
                    <strong>{{ detail.membersVisibilityLimited ? 'Cache' : detail.memberCount }}</strong>
                    <span>Membres</span>
                  </div>
                  <div class="stat-chip">
                    <strong>{{ detail.animeVisibilityLimited ? 'Cache' : visibleAnimeCount }}</strong>
                    <span>Visibles</span>
                  </div>
                </div>

                <button
                  v-if="canAddAnime"
                  class="sidebar-primary"
                  type="button"
                  @click="isAnimePickerOpen = !isAnimePickerOpen"
                >
                  {{ isAnimePickerOpen ? 'Fermer le panneau d\'ajout' : 'Ajouter un anime' }}
                </button>
              </aside>
            </div>

            <section class="main">
              <div class="view-bar">
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

              <div v-if="canAddAnime && isAnimePickerOpen" class="panel-card add-anime-panel">
                <div class="panel-head">
                  <div>
                    <h2 class="panel-title">Ajouter un anime</h2>
                    <p class="panel-copy">Recherchez sur AniList et ajoutez un titre directement à cette liste partagée.</p>
                  </div>
                </div>

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
                      @click="addAnime(item)"
                    >
                      {{ item.alreadyAdded ? 'Ajoute' : pendingAnimeMediaId === String(item.mediaId) ? 'Ajout...' : 'Ajouter' }}
                    </button>
                  </article>
                </div>
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
                  Rejoint {{ member.joinedAt ? formatDateLabel(member.joinedAt) : 'recemment' }}
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
                  <span>Confidentialite</span>
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
                  <span>Confidentialite</span>
                  <strong>{{ privacyLabel(detail.privacy) }}</strong>
                </div>
                <div class="info-row">
                  <span>Propriétaire</span>
                  <strong>{{ detail.ownerName }}</strong>
                </div>
                <div class="info-row">
                  <span>Nombre d'animes</span>
                  <strong>{{ detail.animeVisibilityLimited ? 'Cache' : detail.animeCount }}</strong>
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
                <div class="anime-editor-kicker">Modifier l'entree partagee</div>
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
  settingsName.value = source.title
  settingsPrivacy.value = source.privacy
  resetSettingsMediaDrafts()
}

const settingsGroupImageDisplay = computed(() => settingsGroupImagePreview.value || detail.value?.imageUrl || '')
const settingsBannerDisplay = computed(() => settingsBannerPreview.value || detail.value?.bannerUrl || '')
const hasSettingsChanges = computed(() => {
  if (!detail.value) return false
  return settingsName.value.trim() !== detail.value.title
    || settingsPrivacy.value !== detail.value.privacy
    || Boolean(settingsGroupImageFile.value)
    || Boolean(settingsBannerImageFile.value)
})

const rawAnimeSections = computed<Record<SharedListAnimeStatus, SharedListAnimeEntry[]>>(() => {
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
  if (detail.value.membersVisibilityLimited) return 'Membres masques'
  return `${detail.value.memberCount} membre${detail.value.memberCount > 1 ? 's' : ''}`
})
const detailAnimeMetaText = computed(() => {
  if (!detail.value) return '0 anime'
  if (detail.value.animeVisibilityLimited) return 'Anime masques'
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
  editAnimeProgress.value = String(episodes)
})

watch(draftAddStatus, () => {
  if (draftAddStatus.value !== 'COMPLETED') return
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
    await removeMembership(membershipId)
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de retirer ce membre.'
  } finally {
    pendingMembershipActionId.value = ''
  }
}

const updateMemberPermission = async (membershipId: string, permissionRaw: string) => {
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
  if (typeof window !== 'undefined' && !window.confirm(`Supprimer "${detail.value.title}" ? Cette action est irréversible.`)) {
    return
  }

  isDeleting.value = true
  actionError.value = ''

  try {
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

const handleAnimeEditorKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isAnimeEditorOpen.value) return
  closeAnimeEditor()
}

watch(listId, () => {
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
  loadPage()
}, { immediate: true })

onBeforeUnmount(() => {
  if (memberSearchTimer) clearTimeout(memberSearchTimer)
  if (animeSearchTimer) clearTimeout(animeSearchTimer)
  revokePreviewUrl(settingsGroupImagePreview.value)
  revokePreviewUrl(settingsBannerPreview.value)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleAnimeEditorKeydown)
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleAnimeEditorKeydown)
}
</script>

<style scoped>
.shared-list-page {
  min-height: 100vh;
  color: var(--kz-text-primary);
  background:
    radial-gradient(circle at top, rgba(61,180,242,.08), transparent 38%),
    linear-gradient(180deg, rgba(4,10,22,.92) 0%, transparent 24%),
    transparent;
}

.shared-list-shell {
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 28px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.shared-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--kz-text-dim);
}

.shared-breadcrumb a {
  color: inherit;
  text-decoration: none;
}

.group-hero {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--kz-border);
  min-height: 290px;
  padding: 24px;
  color: #fff;
}

.hero-banner-image,
.hero-overlay,
.hero-texture {
  position: absolute;
  inset: 0;
}

.hero-banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  background: linear-gradient(180deg, rgba(11,22,34,.12) 0%, rgba(11,22,34,.72) 100%);
}

.hero-texture {
  background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.012) 20px, rgba(255,255,255,.012) 21px);
  pointer-events: none;
}

.hero-top {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.hero-head {
  position: relative;
  z-index: 1;
}

.back-btn,
.ghost-btn,
.danger-btn,
.search-result-action,
.sidebar-primary,
.drawer-btn {
  cursor: pointer;
}

.back-btn,
.ghost-btn,
.danger-btn,
.sidebar-primary,
.search-result-action,
.settings-input,
.search-box,
.sort-select {
  min-height: 38px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Overpass', sans-serif;
}

.back-btn {
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.12);
  color: #fff;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-actions {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.settings-btn {
  position: relative;
  z-index: 6;
}

.ghost-btn {
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  color: #fff;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ghost-btn:hover,
.back-btn:hover {
  background: rgba(255,255,255,.16);
}

.danger-btn {
  border: 1px solid rgba(248,113,113,.25);
  background: rgba(248,113,113,.14);
  color: #fff;
  padding: 0 14px;
}

.hero-head {
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.group-cover {
  width: 128px;
  height: 128px;
  border-radius: 16px;
  box-shadow: 0 16px 36px rgba(0,0,0,.34);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: .12em;
  flex-shrink: 0;
  overflow: hidden;
}

.group-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-copy {
  min-width: 0;
}

.group-title-row h1 {
  margin: 0 0 8px;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 700;
  color: #fff;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  font-size: 14px;
  color: rgba(255,255,255,.84);
}

.group-badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  border: 1px solid transparent;
}

.group-badge.private {
  background: rgba(248,113,113,.12);
  border-color: rgba(248,113,113,.2);
  color: #fecaca;
}

.group-badge.friends {
  background: rgba(251,191,36,.12);
  border-color: rgba(251,191,36,.22);
  color: #fde68a;
}

.group-badge.public {
  background: rgba(74,222,128,.12);
  border-color: rgba(74,222,128,.22);
  color: #bbf7d0;
}

.role-accent {
  color: #fde68a;
  font-weight: 700;
}

.group-description {
  margin: 12px 0 0;
  font-size: 14px;
  color: rgba(255,255,255,.78);
}

.hero-members {
  display: flex;
  align-items: center;
  margin-top: 14px;
}

.hero-member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid rgba(11,22,34,.42);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.hero-member-avatar.has-avatar {
  background: transparent !important;
}

.hero-member-avatar.stacked {
  margin-left: -8px;
}

.hero-member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-members-more {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,.74);
}

.tabs-wrap {
  border-bottom: 1px solid rgba(160,177,197,.15);
}

.tabs-nav {
  display: flex;
  gap: 28px;
}

.tab-btn {
  padding: 16px 0;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--kz-text-dim);
  font-size: 14px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--kz-accent);
  border-bottom-color: var(--kz-accent);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.anime-browser {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: clamp(16px, 1.8vw, 28px);
  align-items: start;
}

.sidebar-slot {
  position: static;
}

.sidebar {
  position: static;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #131d2a;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  padding: 7px 10px;
  transition: border-color 0.15s;
}

.filter-search:focus-within {
  border-color: rgba(61, 180, 242, 0.35);
}

.filter-search svg {
  color: #3d5570;
  flex-shrink: 0;
}

.filter-search input {
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: #e8f0ff;
  width: 100%;
}

.filter-search input::placeholder {
  color: #3d5570;
}

.sidebar-section {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: #3d5570;
  margin-bottom: 5px;
}

.list-links {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.list-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #7a9ab8;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  position: relative;
}

.list-link:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e8f0ff;
}

.list-link.active {
  background: rgba(61, 180, 242, 0.08);
  color: #3db4f2;
  font-weight: 600;
}

.list-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 999px;
  background: #3db4f2;
}

.list-count {
  color: #4a6480;
  font-family: 'Overpass Mono', monospace;
}

.sort-select {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  padding: 0 34px 0 10px;
  background: #131d2a;
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #e8f0ff;
  appearance: none;
  outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237a9ab8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.sidebar-stats {
  display: grid;
  gap: 8px;
}

.stat-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.06);
  background: #131d2a;
}

.stat-chip strong {
  color: #e8f0ff;
  font-size: 16px;
  font-weight: 700;
}

.stat-chip span {
  color: #7a9ab8;
  font-size: 11px;
}

.sidebar-primary {
  border: 1px solid rgba(61,180,242,.3);
  background: rgba(61,180,242,.14);
  color: #3db4f2;
  padding: 0 14px;
}

.main {
  min-width: 0;
}

.view-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.view-btn {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d5570;
  transition: all 0.12s;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #7a9ab8;
}

.view-btn.active {
  background: rgba(61, 180, 242, 0.1);
  border-color: rgba(61, 180, 242, 0.3);
  color: #3db4f2;
}

.panel-card,
.editor-panel,
.member-card,
.drawer-card,
.status-card,
.search-box,
.settings-input {
  background: var(--kz-card-bg);
  border: 1px solid rgba(160,177,197,.08);
  border-radius: 12px;
}

.add-anime-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: var(--kz-text-primary);
}

.panel-copy {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--kz-text-dim);
}

.search-box {
  width: 100%;
  color: var(--kz-text-primary);
  padding: 0 14px;
}

.search-box.full {
  width: 100%;
}

.search-box:focus,
.settings-input:focus {
  outline: none;
}

.search-status,
.empty-state-text {
  font-size: 13px;
  color: var(--kz-text-dim);
}

.anime-search-results,
.search-results,
.drawer-member-list {
  display: grid;
  gap: 10px;
}

.anime-search-item,
.search-result,
.drawer-member-row {
  border: 1px solid rgba(160,177,197,.08);
  background: rgba(255,255,255,.02);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.anime-search-cover {
  width: 46px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(61,180,242,.3), rgba(146,86,243,.3));
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.anime-search-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.add-state-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.add-state-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.add-state-field span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: #4a6480;
}

.anime-search-copy,
.drawer-member-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anime-search-name,
.drawer-member-copy strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.anime-search-secondary,
.drawer-member-copy span,
.search-action {
  font-size: 11px;
  color: var(--kz-text-dim);
}

.search-result-action {
  border: 1px solid rgba(61,180,242,.24);
  background: rgba(61,180,242,.12);
  color: var(--kz-accent);
  padding: 0 12px;
  flex-shrink: 0;
}

.search-result-action.is-disabled,
.search-result-action:disabled {
  border-color: rgba(160,177,197,.1);
  background: rgba(255,255,255,.04);
  color: var(--kz-text-dim);
  cursor: default;
}

.search-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.search-action {
  font-weight: 700;
  color: var(--kz-accent);
}

.editor-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.editor-panel-media {
  display: flex;
  align-items: center;
  gap: 14px;
}

.editor-panel-thumb {
  width: 72px;
  height: 98px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255,255,255,.03);
}

.editor-panel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-card-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a2a3a 0%, #0d1a27 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
}

.editor-panel-copy {
  min-width: 0;
}

.editor-panel-label {
  font-size: 11px;
  color: var(--kz-text-dim);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.editor-panel-title {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.editor-panel-subtitle {
  margin-top: 5px;
  font-size: 12px;
  color: #7a9ab8;
  font-family: 'Overpass Mono', monospace;
}

.editor-panel-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-field span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: #4a6480;
}

.editor-input {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 12, 18, 0.4);
  color: #e8f0ff;
  padding: 0 10px;
  outline: none;
}

.editor-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-btn {
  height: 36px;
  border-radius: 6px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
  transition: transform 0.12s, background 0.12s, border-color 0.12s, color 0.12s;
}

.editor-btn-muted {
  background: transparent;
  color: #7a9ab8;
}

.editor-btn-danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.editor-btn-primary {
  background: rgba(61, 180, 242, 0.14);
  border-color: rgba(61, 180, 242, 0.3);
  color: #3db4f2;
}

.content {
  min-width: 0;
}

.anime-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #e8f0ff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.section-count {
  font-size: 11px;
  font-weight: 600;
  color: #3d5570;
  font-family: 'Overpass Mono', monospace;
}

.status-dot {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.6);
}

.dot-watching { background: #3db4f2; }
.dot-completed { background: #4ade80; }
.dot-paused { background: #ffbe0b; }
.dot-dropped { background: #ef4444; }
.dot-planned { background: #9256f3; }
.dot-rewatching { background: #c084fc; }

.view-grid .anime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 12px;
}

.view-grid .anime-card {
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: #131d2a;
  transition: transform 0.15s, box-shadow 0.15s;
  aspect-ratio: 2 / 3;
  cursor: pointer;
}

.view-grid .anime-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.view-grid .anime-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.view-grid .anime-card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.74);
  min-height: 60px;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.anime-card-title {
  color: #e8f0ff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-grid .anime-card-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 3px;
}

.view-grid .anime-card-progress {
  font-size: 10px;
  font-weight: 600;
  color: #3db4f2;
  font-family: 'Overpass Mono', monospace;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.75);
}

.anime-card-score {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 3px;
  padding: 2px 5px;
  font-size: 9px;
  font-weight: 700;
  color: #3db4f2;
  font-family: 'Overpass Mono', monospace;
}

.view-list .anime-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.view-list .anime-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #131d2a;
  border-radius: 5px;
  padding: 8px 12px;
  transition: background 0.12s;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.view-list .anime-card:hover {
  background: #192638;
}

.view-list .anime-card img,
.view-list .anime-card-placeholder {
  width: 36px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.view-list .anime-card-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 7px;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(2px);
  border-radius: 4px;
}

.view-list .anime-card-title {
  font-size: 14px;
  font-weight: 600;
}

.view-list .anime-card-progress {
  font-size: 12px;
  color: #7a9ab8;
  font-family: 'Overpass Mono', monospace;
}

.view-list .anime-card-score {
  margin-left: auto;
  font-size: 13px;
  top: auto;
  right: auto;
  background: transparent;
  padding: 0;
}

.view-list .status-dot {
  position: static;
  width: 8px;
  height: 8px;
  border: none;
}

.view-compact .anime-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.view-compact .anime-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border-radius: 4px;
  padding: 5px 10px;
  transition: background 0.1s;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
}

.view-compact .anime-card:hover {
  background: rgba(255, 255, 255, 0.03);
}

.view-compact .anime-card img,
.view-compact .anime-card-placeholder {
  width: 24px;
  height: 32px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.view-compact .anime-card-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 3px 7px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(2px);
  border-radius: 4px;
}

.view-compact .anime-card-title {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-compact .anime-card-progress {
  font-size: 11px;
  color: #4a6480;
  font-family: 'Overpass Mono', monospace;
  white-space: nowrap;
}

.view-compact .anime-card-score {
  font-size: 11px;
  top: auto;
  right: auto;
  background: transparent;
  padding: 0;
  white-space: nowrap;
}

.view-compact .status-dot {
  position: static;
  width: 6px;
  height: 6px;
  border: none;
}

.anime-card.is-selected {
  outline: 1px solid rgba(61, 180, 242, 0.55);
  outline-offset: 0;
}

.anime-card.is-readonly {
  cursor: default;
}

.anime-card:focus-visible {
  outline: 1px solid rgba(61, 180, 242, 0.65);
  outline-offset: 1px;
}

.members-grid {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.member-card {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: background .16s ease, transform .16s ease;
}

.member-card:hover {
  background: rgba(255,255,255,.025);
  transform: translateX(4px);
}

.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.member-avatar.has-avatar {
  background: transparent !important;
}

.member-avatar.small {
  width: 34px;
  height: 34px;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--kz-text-primary);
}

.member-self {
  color: var(--kz-accent);
}

.member-role {
  margin-top: 4px;
  font-size: 11px;
  color: var(--kz-text-dim);
}

.member-badge {
  background: rgba(247,154,99,.15);
  color: #f79a63;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
}

.member-badge.owner {
  background: rgba(247,154,99,.2);
}

.remove-btn {
  border: 0;
  background: transparent;
  color: #f87171;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.member-perm {
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(160,177,197,.12);
  background: rgba(255,255,255,.02);
  color: var(--kz-text-secondary);
  padding: 0 10px;
  font-size: 12px;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 54px 20px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--kz-text-primary);
  margin-bottom: 10px;
}

.status-card {
  padding: 16px 18px;
  color: var(--kz-text-secondary);
  font-size: 12px;
}

.status-card.error {
  color: #f87171;
  border-color: rgba(248,113,113,.25);
  background: rgba(248,113,113,.05);
}

.limited-note {
  background: rgba(251,191,36,.06);
  border-color: rgba(251,191,36,.18);
  color: #f5c14d;
}

.inline-error {
  margin-top: -2px;
}

.anime-editor-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(7, 12, 20, 0.72);
  backdrop-filter: blur(14px);
}

.anime-editor-modal {
  width: min(760px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(13, 18, 31, 0.98) 0%, rgba(8, 12, 22, 0.98) 100%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  padding: 24px;
}

.anime-editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.anime-editor-media {
  display: flex;
  gap: 18px;
  min-width: 0;
}

.anime-editor-thumb {
  width: 92px;
  height: 128px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  flex: 0 0 auto;
}

.anime-editor-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-editor-copy {
  min-width: 0;
}

.anime-editor-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(173, 216, 255, 0.72);
  margin-bottom: 8px;
}

.anime-editor-title {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.15;
  color: #f8fbff;
}

.anime-editor-subtitle {
  margin-top: 10px;
  color: rgba(224, 233, 245, 0.78);
}

.anime-editor-close {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
  cursor: pointer;
  flex: 0 0 auto;
}

.anime-editor-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.anime-editor-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(232, 239, 248, 0.92);
}

.anime-editor-input {
  width: 100%;
  min-height: 46px;
  appearance: none;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(19, 28, 44, 0.92);
  color: #f8fbff;
  padding: 0 14px;
}

.anime-editor-input option {
  background: #0f1724;
  color: #f8fbff;
}

.anime-editor-inline-error {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.24);
  color: #ffd7d7;
}

.anime-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 24, 0.72);
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  backdrop-filter: blur(14px);
}

.settings-drawer {
  width: min(760px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  background: linear-gradient(180deg, rgba(13, 18, 31, 0.98) 0%, rgba(8, 12, 22, 0.98) 100%);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 28px;
  box-shadow: 0 30px 80px rgba(0,0,0,.4);
  display: flex;
  flex-direction: column;
}

.settings-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 0;
}

.settings-kicker {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(173, 216, 255, 0.72);
}

.settings-drawer-head h2 {
  margin: 8px 0 0;
  font-size: 1.6rem;
  line-height: 1.15;
  color: #f8fbff;
}

.icon-close {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
  cursor: pointer;
}

.settings-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.drawer-card {
  padding: 0;
  background: transparent;
  border: 0;
}

.drawer-card-head h3 {
  margin: 0;
  font-size: 16px;
  color: #f8fbff;
}

.drawer-card-head p {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(224, 233, 245, 0.76);
  line-height: 1.55;
}

.settings-field-grid,
.settings-media-grid {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.settings-field-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(180px, .8fr);
}

.settings-media-grid {
  grid-template-columns: 160px minmax(0, 1fr);
}

.settings-field,
.settings-media-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-field span,
.settings-media-field span {
  font-size: 11px;
  font-weight: 700;
  color: rgba(232, 239, 248, 0.92);
}

.settings-input {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fbff;
  padding: 0 14px;
  background: rgba(19, 28, 44, 0.92);
  appearance: none;
}

.settings-input option {
  background: #0f1724;
  color: #f8fbff;
}

.settings-media-preview {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.04);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,.88);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}

.settings-media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.settings-media-square {
  aspect-ratio: 1 / 1;
}

.settings-media-banner {
  min-height: 140px;
}

.media-input {
  width: 100%;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,.16);
  background: rgba(255,255,255,.03);
  padding: 10px;
  color: rgba(224, 233, 245, 0.76);
  font-family: 'Overpass', sans-serif;
}

.settings-media-field small {
  color: rgba(224, 233, 245, 0.72);
  font-size: 11px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.drawer-btn {
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
}

.drawer-btn-muted {
  border-color: rgba(255,255,255,.12);
  background: transparent;
  color: rgba(224, 233, 245, 0.82);
}

.drawer-btn-primary {
  border-color: rgba(61,180,242,.28);
  background: rgba(61,180,242,.12);
  color: #3db4f2;
}

.drawer-btn-danger {
  border-color: rgba(248,113,113,.24);
  background: rgba(248,113,113,.12);
  color: #f87171;
}

.danger-card {
  border-color: rgba(248,113,113,.14);
}

.info-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--kz-text-dim);
  font-size: 13px;
}

.info-row strong {
  color: var(--kz-text-primary);
}

[data-theme='winter'] .shared-list-page {
  background:
    radial-gradient(circle at top, rgba(61,180,242,.12), transparent 40%),
    linear-gradient(180deg, rgba(222,236,248,.9) 0%, transparent 28%),
    transparent;
}

[data-theme='winter'] .group-hero,
[data-theme='winter'] .member-card,
[data-theme='winter'] .panel-card,
[data-theme='winter'] .editor-panel,
[data-theme='winter'] .status-card,
[data-theme='winter'] .settings-drawer,
[data-theme='winter'] .search-box,
[data-theme='winter'] .settings-input,
[data-theme='winter'] .media-input,
[data-theme='winter'] .search-result,
[data-theme='winter'] .anime-search-item {
  border-color: rgba(23,52,78,.14);
}

[data-theme='winter'] .sidebar .filter-search,
[data-theme='winter'] .sidebar .sort-select,
[data-theme='winter'] .sidebar .stat-chip,
[data-theme='winter'] .view-list .anime-card,
[data-theme='winter'] .drawer-member-row {
  background: rgba(244,249,254,.9);
  border-color: rgba(23,52,78,.18);
}

[data-theme='winter'] .sidebar .filter-search input,
[data-theme='winter'] .sidebar .sort-select,
[data-theme='winter'] .settings-drawer-head h2,
[data-theme='winter'] .drawer-card-head h3,
[data-theme='winter'] .anime-editor-title,
[data-theme='winter'] .sidebar .stat-chip strong,
[data-theme='winter'] .info-row strong,
[data-theme='winter'] .member-name,
[data-theme='winter'] .search-name,
[data-theme='winter'] .anime-search-name {
  color: #96b6d3
}

[data-theme='winter'] .sidebar .stat-chip span {
  color: #5a7693;
}

[data-theme='winter'] .anime-editor-kicker,
[data-theme='winter'] .anime-editor-subtitle,
[data-theme='winter'] .anime-editor-field span,
[data-theme='winter'] .anime-editor-inline-error,
[data-theme='winter'] .anime-editor-input,
[data-theme='winter'] .anime-editor-input option {
  color: #96b6d3;
}

[data-theme='winter'] .anime-editor-input {
  background: rgba(25, 27, 37, 0.96);
  border-color: rgba(23,52,78,.18);
}

[data-theme='winter'] .anime-editor-input option {
  background: 090d17;
}

[data-theme='winter'] .anime-editor-modal {
  border-color: rgba(253, 253, 253, 0.141);
}

[data-theme='winter'] .settings-kicker,
[data-theme='winter'] .drawer-card-head p,
[data-theme='winter'] .settings-field span,
[data-theme='winter'] .settings-media-field span,
[data-theme='winter'] .settings-media-field small,
[data-theme='winter'] .drawer-btn-muted,
[data-theme='winter'] .info-row {
  color: #5a7693;
}

[data-theme='winter'] .settings-input,
[data-theme='winter'] .media-input {
  background: rgba(244,249,254,.96);
  border-color: rgba(23,52,78,.18);
  color: #17344e;
}

[data-theme='winter'] .settings-input option {
  background: #f4f9fe;
  color: #17344e;
}

[data-theme='winter'] .settings-media-preview {
  background: rgba(244,249,254,.9);
  border-color: rgba(23,52,78,.14);
  color: #17344e;
}

[data-theme='winter'] .icon-close {
  background: rgba(23,52,78,.08);
  color: #17344e;
}

[data-theme='winter'] .shared-list-page .group-hero {
  color: #fff;
}

[data-theme='winter'] .section-title::after {
  background: rgba(23,52,78,.12);
}

[data-theme='winter'] .view-grid .anime-card {
  background: rgba(236,245,253,.9);
}

[data-theme='winter'] .view-grid .anime-card-overlay,
[data-theme='winter'] .view-list .anime-card-overlay,
[data-theme='winter'] .view-compact .anime-card-overlay {
  background: rgba(20,44,66,.72);
}

[data-theme='winter'] .anime-card-placeholder {
  background: linear-gradient(180deg, #e6f1fb 0%, #d4e6f7 100%);
  color: rgba(23,52,78,.22);
}

@media (max-width: 1024px) {
  .shared-list-shell {
    padding-left: 16px;
    padding-right: 16px;
  }

  .anime-browser {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .sidebar > :last-child {
    grid-column: span 2;
  }

  .sidebar-slot { position: static; }
}

@media (max-width: 900px) {
  .hero-top {
    gap: 12px;
  }

  .hero-actions,
  .view-bar {
    flex-wrap: wrap;
  }

  .hero-actions .sl-btn {
    flex: 1 1 160px;
  }

  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 820px) {
  .hero-top,
  .hero-head {
    flex-direction: column;
    align-items: stretch;
  }

  .group-cover {
    width: 110px;
    height: 110px;
  }

  .settings-field-grid,
  .settings-media-grid,
  .editor-panel-fields,
  .add-state-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .shared-list-shell {
    padding: 18px 12px 56px;
  }

  .shared-breadcrumb {
    justify-content: center;
    text-align: center;
  }

  .group-hero {
    padding: 16px;
    text-align: center;
  }

  .hero-top,
  .hero-head,
  .group-copy {
    align-items: center;
  }

  .group-copy {
    display: flex;
    flex-direction: column;
  }

  .back-btn,
  .hero-actions,
  .group-meta,
  .hero-members,
  .view-bar,
  .tabs-nav {
    justify-content: center;
  }

  .group-title-row h1 {
    font-size: clamp(22px, 7vw, 28px);
  }

  .group-meta,
  .group-description {
    font-size: 12px;
  }

  .tabs-nav {
    gap: 20px;
    overflow-x: auto;
  }

  .sidebar {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
    width: 100%;
  }

  .sidebar > :last-child {
    grid-column: auto;
  }

  .group-hero {
    padding: 18px;
  }

  .settings-drawer {
    width: 100%;
    max-height: min(92vh, 100%);
    border-radius: 22px;
  }

  .anime-editor-modal-layer {
    padding: 12px;
  }

  .anime-editor-modal {
    padding: 18px;
    border-radius: 22px;
  }

  .view-bar,
  .editor-panel-actions,
  .drawer-actions {
    flex-wrap: wrap;
  }

  .editor-panel-actions,
  .drawer-actions {
    flex-direction: column-reverse;
  }

  .sidebar-primary {
    width: 100%;
    justify-content: center;
  }

  .panel-card,
  .add-anime-panel,
  .editor-panel,
  .member-card,
  .empty-state {
    text-align: center;
  }

  .editor-panel-media {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .anime-editor-media,
  .anime-editor-actions {
    flex-direction: column;
  }

  .anime-editor-fields {
    grid-template-columns: 1fr;
  }

  .section-title {
    justify-content: center;
    text-align: center;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .settings-drawer-head {
    padding: 18px 18px 0;
  }

  .settings-drawer-body {
    padding: 18px;
  }
}

@media (max-width: 480px) {
  .back-btn,
  .ghost-btn,
  .danger-btn,
  .drawer-btn,
  .sidebar-primary {
    font-size: 12px;
  }

  .group-cover {
    width: 92px;
    height: 92px;
    font-size: 20px;
  }

  .member-card {
    flex-wrap: wrap;
  }

  .member-badge,
  .member-perm,
  .remove-btn {
    width: 100%;
  }

  .editor-panel-title {
    font-size: 18px;
  }
}
</style>
