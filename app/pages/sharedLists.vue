<template>
  <div class="shared-list-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="shared-list-shell">
      <nav class="shared-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/profilePage">Profile</NuxtLink>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
        </svg>
        <NuxtLink to="/">Shared Lists</NuxtLink>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
        </svg>
        <span>{{ listTitle }}</span>
      </nav>

      <section class="shared-hero">
        <div class="shared-hero-banner">
          <div ref="privacyRootRef" class="privacy-slot">
            <button class="privacy-badge" type="button" @click.stop="togglePrivacyMenu">
              <span class="privacy-dot" :class="activePrivacyMeta.dotClass"></span>
              {{ activePrivacyMeta.label }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="privacyMenuOpen" class="privacy-menu" @click.stop>
              <button
                v-for="option in privacyOptions"
                :key="option.value"
                class="privacy-opt"
                :class="{ selected: privacy === option.value }"
                type="button"
                @click="setPrivacy(option.value)"
              >
                <span class="privacy-opt-dot" :class="option.dotClass"></span>
                <span>
                  {{ option.label }}
                  <small>{{ option.hint }}</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="shared-hero-body">
          <div class="members-row">
            <div v-for="member in members" :key="member.id" class="member-av-wrap">
              <button class="member-av" :style="avatarToneStyle(member.id)" type="button" :title="memberTitle(member)">
                <img v-if="memberAvatar(member.id)" :src="memberAvatar(member.id)" :alt="memberDisplayName(member.id, 'panel')" />
                <span v-else>{{ memberInitials(member.id) }}</span>
              </button>
              <span class="perm-dot" :class="roleDotClass(member.role)" :title="roleLabel(member.role)">
                {{ roleSymbol(member.role) }}
              </span>
            </div>

            <button class="add-member-btn" type="button" title="Inviter quelqu'un">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                <path stroke-linecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div class="hero-main">
            <div class="hero-copy">
              <div class="list-title-row">
                <span class="list-emoji">🎬</span>
                <h1 class="list-title">{{ listTitle }}</h1>
                <button class="edit-title-btn" type="button" aria-label="Modifier le titre">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>

              <p class="list-desc">
                Anime qu'on veut regarder ensemble. Chacun peut ajouter ou suggérer des titres.
                Les suggestions doivent être approuvées par un modérateur.
              </p>

              <div class="hero-meta">
                <div class="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Créée le {{ createdLabel }}
                </div>
                <div class="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                    <path stroke-linecap="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                  </svg>
                  {{ members.length }} membres
                </div>
                <div class="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5M3.75 12h16.5M3.75 18.75h16.5" />
                  </svg>
                  {{ mainEntries.length }} anime · {{ suggestions.length }} suggestion<span v-if="suggestions.length > 1">s</span> en attente
                </div>
              </div>

              <div class="progress-section">
                <div class="prog-top">
                  <span>Progression du groupe</span>
                  <span>{{ totalWatchedMarks }} / {{ groupProgressTarget }} vues cumulées</span>
                </div>

                <div class="prog-bar">
                  <span
                    v-for="item in progressStats"
                    :key="item.memberId"
                    class="pb-seg"
                    :style="progressSegmentStyle(item)"
                  />
                  <span class="pb-rest" />
                </div>

                <div class="progress-legend">
                  <div v-for="item in progressStats" :key="`${item.memberId}-legend`" class="meta-chip">
                    <span class="legend-dot" :style="avatarToneStyle(item.memberId)"></span>
                    {{ memberDisplayName(item.memberId, 'short') }} — {{ item.count }} vu<span v-if="item.count > 1">s</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="hero-actions">
              <button class="sl-btn sl-btn-primary" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Ajouter un anime
              </button>
              <button class="sl-btn sl-btn-ghost" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684z" />
                </svg>
                Partager le lien
              </button>
              <button class="sl-btn sl-btn-ghost" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z" />
                </svg>
                Modifier
              </button>
              <button class="sl-btn sl-btn-danger" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25V9m-3 0h12M5.25 9 6 20.25A2.25 2.25 0 0 0 8.25 22.5h7.5A2.25 2.25 0 0 0 18 20.25L18.75 9" />
                </svg>
                Quitter
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="member-panel">
        <button class="panel-header" type="button" @click="membersPanelOpen = !membersPanelOpen">
          <span class="panel-header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0z" />
            </svg>
            Membres ({{ members.length }})
          </span>
          <span class="panel-toggle" :class="{ open: membersPanelOpen }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        <div v-show="membersPanelOpen" class="panel-body">
          <div v-for="member in members" :key="`${member.id}-panel`" class="member-row">
            <div class="member-row-av" :style="avatarToneStyle(member.id)">
              <img v-if="memberAvatar(member.id)" :src="memberAvatar(member.id)" :alt="memberDisplayName(member.id, 'panel')" />
              <span v-else>{{ memberInitials(member.id) }}</span>
            </div>

            <div class="member-info">
              <div class="member-name">
                {{ memberDisplayName(member.id, 'panel') }}
                <span v-if="member.id === 'you'" class="member-self">(vous)</span>
              </div>
              <div class="member-sub">{{ member.summary }}</div>
            </div>

            <select
              v-if="member.role !== 'owner'"
              v-model="member.role"
              class="perm-select"
              :class="roleSelectClass(member.role)"
            >
              <option v-for="role in assignableRoles" :key="`${member.id}-${role}`" :value="role">
                {{ roleLabel(role) }}
              </option>
            </select>

            <select v-else class="perm-select perm-select-owner" disabled>
              <option>{{ roleLabel('owner') }}</option>
            </select>

            <div class="member-actions">
              <button class="icon-btn" type="button" title="Voir profil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
              <button v-if="member.role !== 'owner'" class="icon-btn danger" type="button" title="Retirer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="invite-row">
            <input v-model="inviteQuery" class="invite-input" placeholder="Inviter par nom d'utilisateur ou lien..." />
            <button class="sl-btn sl-btn-primary invite-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                <path stroke-linecap="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Inviter
            </button>
          </div>
        </div>
      </section>

      <div class="tabs-bar" role="tablist" aria-label="Shared list sections">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          <span>{{ tab.label }}</span>
          <span class="tab-badge" :class="{ attention: tab.key === 'suggestions' && tab.count > 0 }">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <section v-if="activeTab === 'anime'" class="tab-panel">
        <div class="add-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchTerm" class="add-bar-input" placeholder="Rechercher un anime à ajouter..." />
          <div class="add-bar-divider"></div>
          <button class="suggest-toggle" :class="{ on: suggestionMode }" type="button" @click="suggestionMode = !suggestionMode">
            <span class="toggle-knob"></span>
            Mode suggestion
          </button>
          <button class="sl-btn sl-btn-primary add-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Ajouter
          </button>
        </div>

        <div class="list-table-wrap">
          <div class="list-table-scroll">
            <div class="list-header">
              <div></div>
              <div></div>
              <div>Titre</div>
              <div>Ajouté par</div>
              <div>Statuts</div>
              <div>Scores</div>
              <div></div>
            </div>

            <div
              v-for="entry in visibleMainEntries"
              :key="entry.id"
              class="anime-row"
              :class="{ current: entry.isCurrent }"
            >
              <div class="row-drag" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div class="row-thumb">
                <img v-if="entry.coverUrl" :src="entry.coverUrl" :alt="entry.title" />
                <div v-else class="row-thumb-ph">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
              </div>

              <div class="row-info">
                <div class="row-title">{{ entry.title }}</div>
                <div class="row-sub">
                  <span class="format-tag">{{ entry.format }}</span>
                  {{ entry.meta }}
                  <span v-if="entry.isCurrent" class="row-current-pill">● En cours</span>
                </div>
              </div>

              <div class="row-added">
                <div
                  v-for="(memberId, index) in entry.addedBy.slice(0, 2)"
                  :key="`${entry.id}-${memberId}`"
                  class="added-av"
                  :class="{ stacked: index > 0 }"
                  :style="avatarToneStyle(memberId)"
                >
                  <img v-if="memberAvatar(memberId)" :src="memberAvatar(memberId)" :alt="memberDisplayName(memberId, 'short')" />
                  <span v-else>{{ memberInitials(memberId) }}</span>
                </div>
                <span class="added-name" :style="{ color: memberTone(primaryAddedBy(entry)) }">
                  {{ addedByLabel(entry) }}
                </span>
              </div>

              <div class="row-status">
                <div v-for="status in entry.statuses" :key="`${entry.id}-${status.memberId}`" class="status-line">
                  <span class="s-dot" :class="statusDotClass(status.state)"></span>
                  <span class="s-name" :style="{ color: memberTone(status.memberId) }">
                    {{ memberDisplayName(status.memberId, 'short') }}
                  </span>
                  <span class="s-text">{{ status.text }}</span>
                </div>
              </div>

              <div class="row-scores">
                <span
                  v-for="(score, index) in entry.scores"
                  :key="`${entry.id}-score-${index}`"
                  class="score-chip"
                  :class="score.variant"
                >
                  {{ score.value }}
                </span>
              </div>

              <button class="row-menu-btn" type="button" aria-label="Plus d'options">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>

            <div v-if="visibleMainEntries.length === 0" class="table-empty">
              Aucun anime ne correspond à cette recherche.
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'suggestions'" class="tab-panel">
        <div class="panel-note">
          Les suggestions doivent être approuvées par un modérateur avant d'apparaître dans la liste principale.
        </div>

        <div class="list-table-wrap">
          <div class="list-table-scroll">
            <div class="list-header">
              <div></div>
              <div></div>
              <div>Titre</div>
              <div>Suggéré par</div>
              <div>Statuts</div>
              <div>Action</div>
              <div></div>
            </div>

            <div v-for="entry in visibleSuggestions" :key="entry.id" class="anime-row suggestion">
              <div class="row-drag visible" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div class="row-thumb">
                <img v-if="entry.coverUrl" :src="entry.coverUrl" :alt="entry.title" />
                <div v-else class="row-thumb-ph">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
              </div>

              <div class="row-info">
                <div class="row-title">{{ entry.title }}</div>
                <div class="row-sub">
                  <span class="format-tag">{{ entry.format }}</span>
                  {{ entry.meta }}
                </div>
              </div>

              <div class="row-added">
                <div class="added-av" :style="avatarToneStyle(primaryAddedBy(entry))">
                  <img v-if="memberAvatar(primaryAddedBy(entry))" :src="memberAvatar(primaryAddedBy(entry))" :alt="memberDisplayName(primaryAddedBy(entry), 'short')" />
                  <span v-else>{{ memberInitials(primaryAddedBy(entry)) }}</span>
                </div>
                <span class="added-name" :style="{ color: memberTone(primaryAddedBy(entry)) }">
                  {{ memberDisplayName(primaryAddedBy(entry), 'panel') }}
                </span>
                <span class="suggestion-badge">Suggestion</span>
              </div>

              <div class="row-status">
                <div v-for="status in entry.statuses" :key="`${entry.id}-${status.memberId}`" class="status-line">
                  <span class="s-dot" :class="statusDotClass(status.state)"></span>
                  <span class="s-name" :style="{ color: memberTone(status.memberId) }">
                    {{ memberDisplayName(status.memberId, 'short') }}
                  </span>
                  <span class="s-text">{{ status.text }}</span>
                </div>
              </div>

              <div class="row-scores">
                <div class="suggest-actions">
                  <button class="btn-accept" type="button" @click="acceptSuggestion(entry.id)">✓ Accepter</button>
                  <button class="btn-reject" type="button" @click="rejectSuggestion(entry.id)">✕ Refuser</button>
                </div>
              </div>

              <button class="row-menu-btn" type="button" aria-label="Plus d'options">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>

            <div v-if="visibleSuggestions.length === 0" class="table-empty">
              Aucune suggestion en attente.
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'permissions'" class="tab-panel">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Tableau des permissions par rôle
            </div>
          </div>

          <div class="panel-inner panel-flush">
            <table class="perms-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th><span class="role-badge owner">★ Owner</span></th>
                  <th><span class="role-badge moderator">✦ Modérateur</span></th>
                  <th><span class="role-badge member">Membre</span></th>
                  <th><span class="role-badge reader">Lecteur</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="permission in permissionRows" :key="permission.label">
                  <td>{{ permission.label }}</td>
                  <td><span :class="permission.owner ? 'check' : 'cross'">{{ permission.owner ? '✓' : '—' }}</span></td>
                  <td><span :class="permission.moderator ? 'check' : 'cross'">{{ permission.moderator ? '✓' : '—' }}</span></td>
                  <td><span :class="permission.member ? 'check' : 'cross'">{{ permission.member ? '✓' : '—' }}</span></td>
                  <td><span :class="permission.reader ? 'check' : 'cross'">{{ permission.reader ? '✓' : '—' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-else class="tab-panel">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              Activité récente
            </div>
          </div>

          <div class="panel-inner">
            <div class="activity-list">
              <div v-for="item in activityItems" :key="item.id" class="activity-item">
                <div class="act-av" :style="avatarToneStyle(item.actorId)">
                  <img v-if="memberAvatar(item.actorId)" :src="memberAvatar(item.actorId)" :alt="memberDisplayName(item.actorId, 'short')" />
                  <span v-else>{{ memberInitials(item.actorId) }}</span>
                </div>
                <div class="act-text">
                  <b>{{ memberDisplayName(item.actorId, 'panel') }}</b>
                  {{ item.action }}
                  <span v-if="item.target" class="anime-ref">{{ item.target }}</span>
                  <template v-if="item.detail"> {{ item.detail }}</template>
                </div>
                <div class="act-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({ middleware: ['auth'] })

type Role = 'owner' | 'moderator' | 'member' | 'reader'
type Privacy = 'private' | 'friends' | 'public'
type TabKey = 'anime' | 'suggestions' | 'permissions' | 'activity'
type WatchState = 'watched' | 'watching' | 'planned' | 'none'

type Member = {
  id: string
  name: string
  shortName: string
  initials: string
  role: Role
  color: string
  summary: string
}

type EntryScore = {
  value: string
  variant: 'you' | 'friend' | 'none'
}

type EntryStatus = {
  memberId: string
  state: WatchState
  text: string
}

type AnimeEntry = {
  id: string
  title: string
  format: string
  meta: string
  addedBy: string[]
  statuses: EntryStatus[]
  scores: EntryScore[]
  coverUrl?: string
  isCurrent?: boolean
}

type ActivityItem = {
  id: string
  actorId: string
  action: string
  target?: string
  detail?: string
  time: string
}

const pocketbaseStore = usePocketbaseStore()
const privacyRootRef = ref<HTMLElement | null>(null)

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const currentUsername = computed(() => String(authRecord.value.anilist_username || authRecord.value.username || 'Toi'))
const currentAvatarUrl = computed(() => String(authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || ''))

const listTitle = 'À regarder ensemble'
const createdLabel = '4 mars 2026'
const groupProgressTarget = 14

const members = ref<Member[]>([
  {
    id: 'you',
    name: 'Toi',
    shortName: 'Toi',
    initials: 'TO',
    role: 'owner',
    color: '#3db4f2',
    summary: 'Membre depuis le 4 mars'
  },
  {
    id: 'daz',
    name: 'DaZaixzv',
    shortName: 'Daz',
    initials: 'DZ',
    role: 'moderator',
    color: '#9256f3',
    summary: 'Membre depuis le 4 mars · 2 ajoutés'
  },
  {
    id: 'sakura',
    name: 'SakuraMoon',
    shortName: 'Saku',
    initials: 'SM',
    role: 'member',
    color: '#f77f00',
    summary: 'Membre depuis le 6 mars · 1 ajouté'
  },
  {
    id: 'kaze',
    name: 'KazeWatcher',
    shortName: 'Kaze',
    initials: 'KW',
    role: 'reader',
    color: '#06d6a0',
    summary: 'Membre depuis le 7 mars · lecture seule'
  }
])

const mainEntries = ref<AnimeEntry[]>([
  {
    id: 'frieren',
    title: "Frieren: Beyond Journey's End",
    format: 'TV',
    meta: '28 eps · 2023',
    addedBy: ['you'],
    statuses: [
      { memberId: 'you', state: 'watched', text: 'Vu ✓' },
      { memberId: 'daz', state: 'watched', text: 'Vu ✓' }
    ],
    scores: [
      { value: '9.5', variant: 'you' },
      { value: '9.3', variant: 'friend' }
    ]
  },
  {
    id: 'apothecary',
    title: 'The Apothecary Diaries S2',
    format: 'TV',
    meta: '24 eps · En cours',
    addedBy: ['you', 'daz'],
    statuses: [
      { memberId: 'you', state: 'watching', text: 'Ep 16/24' },
      { memberId: 'daz', state: 'watching', text: 'Ep 14/24' }
    ],
    scores: [
      { value: '—', variant: 'none' },
      { value: '—', variant: 'none' }
    ],
    isCurrent: true
  },
  {
    id: 'houseki',
    title: 'Houseki no Kuni',
    format: 'TV',
    meta: '12 eps · 2017',
    addedBy: ['daz'],
    statuses: [
      { memberId: 'you', state: 'none', text: 'Pas encore' },
      { memberId: 'daz', state: 'watched', text: 'Vu ✓' }
    ],
    scores: [
      { value: '—', variant: 'none' },
      { value: '9.4', variant: 'friend' }
    ]
  },
  {
    id: 'dungeon-meshi',
    title: 'Dungeon Meshi',
    format: 'TV',
    meta: '24 eps · 2024',
    addedBy: ['you'],
    statuses: [
      { memberId: 'you', state: 'watched', text: 'Vu ✓' },
      { memberId: 'sakura', state: 'watched', text: 'Vu ✓' }
    ],
    scores: [
      { value: '8.7', variant: 'you' },
      { value: '8.5', variant: 'friend' }
    ]
  },
  {
    id: 'vinland',
    title: 'Vinland Saga S1',
    format: 'TV',
    meta: '24 eps · 2019',
    addedBy: ['sakura'],
    statuses: [
      { memberId: 'you', state: 'watched', text: 'Vu ✓' },
      { memberId: 'kaze', state: 'watched', text: 'Vu ✓' }
    ],
    scores: [
      { value: '9.0', variant: 'you' },
      { value: '8.8', variant: 'friend' }
    ]
  }
])

const suggestions = ref<AnimeEntry[]>([
  {
    id: 'ping-pong',
    title: 'Ping Pong The Animation',
    format: 'TV',
    meta: '11 eps · 2014',
    addedBy: ['daz'],
    statuses: [
      { memberId: 'you', state: 'none', text: 'Pas encore' },
      { memberId: 'daz', state: 'watched', text: 'Vu ✓ 8.9' }
    ],
    scores: []
  }
])

const activityItems = ref<ActivityItem[]>([
  { id: 'act-1', actorId: 'daz', action: 'a suggéré', target: 'Ping Pong The Animation', time: 'Il y a 1h' },
  { id: 'act-2', actorId: 'you', action: 'a marqué', target: 'Frieren', detail: 'comme vu · score 9.5', time: 'Il y a 3h' },
  { id: 'act-3', actorId: 'daz', action: "est passé à l'épisode 14 de", target: 'Apothecary Diaries', time: 'Il y a 5h' },
  { id: 'act-4', actorId: 'sakura', action: 'a ajouté', target: 'Vinland Saga', detail: 'à la liste', time: 'Hier · 21h14' },
  { id: 'act-5', actorId: 'you', action: 'a invité', target: 'KazeWatcher', detail: 'en tant que lecteur', time: 'Hier · 18h02' },
  { id: 'act-6', actorId: 'you', action: 'a changé la confidentialité en', target: 'Friends Only', time: 'Il y a 2 jours' }
])

const permissionRows = [
  { label: 'Voir la liste', owner: true, moderator: true, member: true, reader: true },
  { label: 'Ajouter un anime directement', owner: true, moderator: true, member: true, reader: false },
  { label: 'Suggérer un anime', owner: true, moderator: true, member: true, reader: true },
  { label: 'Accepter / refuser suggestions', owner: true, moderator: true, member: false, reader: false },
  { label: 'Supprimer un anime', owner: true, moderator: true, member: false, reader: false },
  { label: 'Modifier titre / description', owner: true, moderator: true, member: false, reader: false },
  { label: 'Inviter des membres', owner: true, moderator: true, member: false, reader: false },
  { label: 'Gérer les permissions', owner: true, moderator: false, member: false, reader: false },
  { label: 'Modifier la confidentialité', owner: true, moderator: false, member: false, reader: false },
  { label: 'Supprimer la liste', owner: true, moderator: false, member: false, reader: false }
]

const privacyOptions = [
  { value: 'private' as Privacy, label: 'Privée', hint: 'Seulement les membres', dotClass: 'dot-private' },
  { value: 'friends' as Privacy, label: 'Friends Only', hint: 'Vos amis mutuels', dotClass: 'dot-friends' },
  { value: 'public' as Privacy, label: 'Publique', hint: 'Tout le monde peut voir', dotClass: 'dot-public' }
]

const assignableRoles: Role[] = ['moderator', 'member', 'reader']
const activeTab = ref<TabKey>('anime')
const privacy = ref<Privacy>('friends')
const privacyMenuOpen = ref(false)
const membersPanelOpen = ref(true)
const searchTerm = ref('')
const inviteQuery = ref('')
const suggestionMode = ref(true)
const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites' },
  { key: 'friends', label: 'Friends', to: '/friends' },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists', active: true }
]

const activePrivacyMeta = computed<(typeof privacyOptions)[number]>(() => {
  return privacyOptions.find((option) => option.value === privacy.value) ?? privacyOptions[0]!
})

const tabs = computed(() => [
  { key: 'anime' as TabKey, label: 'Anime', count: mainEntries.value.length },
  { key: 'suggestions' as TabKey, label: 'Suggestions', count: suggestions.value.length },
  { key: 'permissions' as TabKey, label: 'Permissions', count: permissionRows.length },
  { key: 'activity' as TabKey, label: 'Activité', count: activityItems.value.length }
])

const filteredNeedle = computed(() => searchTerm.value.trim().toLowerCase())

const visibleMainEntries = computed(() => {
  if (!filteredNeedle.value) return mainEntries.value
  return mainEntries.value.filter((entry) => entry.title.toLowerCase().includes(filteredNeedle.value))
})

const visibleSuggestions = computed(() => {
  if (!filteredNeedle.value) return suggestions.value
  return suggestions.value.filter((entry) => entry.title.toLowerCase().includes(filteredNeedle.value))
})

const progressStats = computed(() => {
  return [
    { memberId: 'you', count: 3 },
    { memberId: 'daz', count: 2 },
    { memberId: 'sakura', count: 1 },
    { memberId: 'kaze', count: 1 }
  ]
})

const totalWatchedMarks = computed(() => progressStats.value.reduce((sum, item) => sum + item.count, 0))

const memberMap = computed(() => {
  const map = new Map<string, Member>()
  for (const member of members.value) {
    map.set(member.id, member)
  }
  return map
})

const getInitials = (value: string) => {
  const letters = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return letters || 'KZ'
}

const memberRecord = (memberId: string) => memberMap.value.get(memberId)

const memberDisplayName = (memberId: string, mode: 'short' | 'panel' = 'panel') => {
  if (memberId === 'you') {
    if (mode === 'short') return 'Toi'
    return currentUsername.value || 'Toi'
  }

  const member = memberRecord(memberId)
  if (!member) return 'Membre'
  return mode === 'short' ? member.shortName : member.name
}

const memberInitials = (memberId: string) => {
  if (memberId === 'you') {
    return getInitials(currentUsername.value || 'Toi')
  }

  return memberRecord(memberId)?.initials || 'KZ'
}

const memberAvatar = (memberId: string) => {
  if (memberId === 'you') return currentAvatarUrl.value || ''
  return ''
}

const memberTone = (memberId: string) => {
  if (memberId === 'you') return '#3db4f2'
  return memberRecord(memberId)?.color || '#3db4f2'
}

const avatarToneStyle = (memberId: string) => ({
  '--member-accent': memberTone(memberId)
})

const roleLabel = (role: Role) => {
  if (role === 'owner') return '★ Owner'
  if (role === 'moderator') return '✦ Modérateur'
  if (role === 'reader') return 'Lecteur'
  return 'Membre'
}

const roleSymbol = (role: Role) => {
  if (role === 'owner') return '★'
  if (role === 'moderator') return '✦'
  if (role === 'reader') return '○'
  return '·'
}

const roleDotClass = (role: Role) => ({
  owner: role === 'owner',
  moderator: role === 'moderator',
  member: role === 'member',
  reader: role === 'reader'
})

const roleSelectClass = (role: Role) => ({
  'perm-select-owner': role === 'owner',
  'perm-select-moderator': role === 'moderator',
  'perm-select-member': role === 'member',
  'perm-select-reader': role === 'reader'
})

const statusDotClass = (state: WatchState) => ({
  watched: state === 'watched',
  watching: state === 'watching',
  planned: state === 'planned',
  none: state === 'none'
})

const primaryAddedBy = (entry: AnimeEntry) => entry.addedBy[0] ?? 'you'

const addedByLabel = (entry: AnimeEntry) => {
  const firstLabel = memberDisplayName(primaryAddedBy(entry), 'panel')
  const extraCount = Math.max(entry.addedBy.length - 1, 0)
  if (!extraCount) return firstLabel
  return `${firstLabel} + ${extraCount}`
}

const memberTitle = (member: Member) => `${memberDisplayName(member.id, 'panel')} — ${roleLabel(member.role)}`

const progressSegmentStyle = (item: { memberId: string; count: number }) => ({
  width: `${(item.count / groupProgressTarget) * 100}%`,
  background: memberTone(item.memberId)
})


const setPrivacy = (value: Privacy) => {
  privacy.value = value
  privacyMenuOpen.value = false
}

const togglePrivacyMenu = () => {
  privacyMenuOpen.value = !privacyMenuOpen.value
}

const acceptSuggestion = (entryId: string) => {
  const index = suggestions.value.findIndex((entry) => entry.id === entryId)
  if (index === -1) return
  const [entry] = suggestions.value.splice(index, 1)
  if (!entry) return
  mainEntries.value.unshift(entry)
  activeTab.value = 'anime'
}

const rejectSuggestion = (entryId: string) => {
  suggestions.value = suggestions.value.filter((entry) => entry.id !== entryId)
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!privacyMenuOpen.value) return
  const target = event.target as Node | null
  if (!target) return
  if (privacyRootRef.value?.contains(target)) return
  privacyMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped src="~/assets/css/pages/sharedLists.css"></style>
