<template>
  <div class="journal-page">
    <section class="journal-hero">
      <p class="hero-kicker">Journal de developpement</p>
      <h1 class="hero-title">
        Tout ce que j'ai du corriger pour faire tenir Kizuna debout.
      </h1>
      <p class="hero-copy">
        J'ai ecrit cette page comme un vrai retour de dev. Je raconte ce que
        j'ai mal anticipe, les bugs que j'ai introduits en branchant AniList et
        PocketBase, les moments ou l'interface donnait l'illusion que tout
        marchait alors que le fond etait encore fragile, et la facon dont j'ai
        fini par remettre chaque morceau en place.
      </p>

      <div class="hero-stats">
        <article
          v-for="stat in scopeStats"
          :key="stat.label"
          class="hero-stat"
        >
          <span class="hero-stat-label">{{ stat.label }}</span>
          <span class="hero-stat-value">{{ stat.value }}</span>
        </article>
      </div>
    </section>

    <div class="journal-layout">
      <aside class="journal-sidebar">
        <section class="sidebar-card">
          <span class="sidebar-title">Angle</span>
          <p class="sidebar-copy">
            Je pars de l'historique git visible entre le 24 fevrier 2026 et le
            18 mars 2026, puis je reformule les problemes comme si je les avais
            notes pendant le developpement. Quand un commit ne raconte pas tout,
            je complete avec ce que le code actuel laisse voir des vrais points
            de friction.
          </p>
        </section>

        <nav class="sidebar-card" aria-label="Sommaire du journal">
          <span class="sidebar-title">Sommaire</span>
          <a href="#timeline" class="sidebar-link">Chronologie</a>
          <a
            v-for="chapter in chapters"
            :key="chapter.id"
            :href="`#${chapter.id}`"
            class="sidebar-link"
          >
            {{ chapter.title }}
          </a>
          <a href="#adjustments" class="sidebar-link">Retours arriere</a>
          <a href="#watchpoints" class="sidebar-link">Ce que je surveille</a>
        </nav>
      </aside>

      <main class="journal-main">
        <section id="timeline" class="journal-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Vue d'ensemble</p>
              <h2 class="panel-title">Chronologie complete</h2>
            </div>
            <p class="panel-copy">
              J'ai commence par essayer de stabiliser l'auth et la liaison
              AniList. Ensuite j'ai deplace la logique reseau vers le serveur,
              branche les vraies pages de profil et de social, puis je suis
              revenu sur plusieurs ecrans parce qu'ils etaient presentables
              visuellement mais pas encore assez fiables techniquement.
            </p>
          </div>

          <div class="timeline">
            <article
              v-for="item in timeline"
              :key="`${item.date}-${item.title}`"
              class="timeline-item"
            >
              <span class="timeline-date">{{ item.date }}</span>
              <div class="timeline-body">
                <h3>{{ item.title }}</h3>
                <p>{{ item.summary }}</p>
              </div>
            </article>
          </div>
        </section>

        <section
          v-for="chapter in chapters"
          :id="chapter.id"
          :key="chapter.id"
          class="journal-panel chapter-panel"
        >
          <div class="panel-head">
            <div>
              <p class="panel-kicker">{{ chapter.period }}</p>
              <h2 class="panel-title">{{ chapter.title }}</h2>
            </div>
            <p class="panel-copy">{{ chapter.summary }}</p>
          </div>

          <div class="chapter-grid">
            <div class="chapter-column">
              <div class="chapter-block">
                <span class="block-title">Fichiers que j'ai touches</span>
                <div class="file-chips">
                  <span
                    v-for="file in chapter.files"
                    :key="`${chapter.id}-${file}`"
                    class="file-chip"
                  >
                    {{ file }}
                  </span>
                </div>
              </div>

              <div class="chapter-block">
                <span class="block-title">Erreurs et blocages reels</span>
                <article
                  v-for="issue in chapter.issues"
                  :key="`${chapter.id}-${issue}`"
                  class="issue-card"
                >
                  {{ issue }}
                </article>
              </div>
            </div>

            <div class="chapter-column">
              <div class="chapter-block">
                <span class="block-title">Comment je m'en suis sorti</span>
                <ol class="steps-list">
                  <li
                    v-for="step in chapter.steps"
                    :key="`${chapter.id}-${step}`"
                  >
                    {{ step }}
                  </li>
                </ol>
              </div>

              <div class="result-card">
                <span class="result-title">Ce que j'ai obtenu</span>
                <p>{{ chapter.result }}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="adjustments" class="journal-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Retours arriere</p>
              <h2 class="panel-title">Erreurs concretes que j'ai du reprendre</h2>
            </div>
            <p class="panel-copy">
              Le projet n'a pas avance en ligne droite. J'ai aussi du revenir
              sur des choix trop rapides, des hypotheses fausses et des morceaux
              d'interface qui avaient l'air termines alors qu'ils ne tenaient
              pas encore la charge, la session ou les cas limites.
            </p>
          </div>

          <div class="adjustments-grid">
            <article
              v-for="item in adjustments"
              :key="`${item.date}-${item.title}`"
              class="adjustment-card"
            >
              <span class="adjustment-date">{{ item.date }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </section>

        <section id="watchpoints" class="journal-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Etat reel du projet</p>
              <h2 class="panel-title">Ce que je n'ai pas fini proprement</h2>
            </div>
            <p class="panel-copy">
              Pour que cette page reste honnete, je note aussi ce qui tient
              encore avec des bouts de simulation, ce qui manque de
              consolidation et les endroits ou je sais que je devrai revenir si
              je veux une version vraiment propre de bout en bout.
            </p>
          </div>

          <div class="watch-grid">
            <article
              v-for="item in watchpoints"
              :key="item.file"
              class="watch-card"
            >
              <span class="watch-file">{{ item.file }}</span>
              <p class="watch-text">{{ item.note }}</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
type TimelineItem = {
  date: string
  title: string
  summary: string
}

type Chapter = {
  id: string
  period: string
  title: string
  summary: string
  files: string[]
  issues: string[]
  steps: string[]
  result: string
}

type Adjustment = {
  date: string
  title: string
  detail: string
}

type Watchpoint = {
  file: string
  note: string
}

const timeline: TimelineItem[] = [
  {
    date: '24 fevrier 2026',
    title: 'Mise en place du socle',
    summary:
      "J'ai pose Nuxt, PocketBase, les stores, les middlewares et le callback AniList, mais le vrai travail a commence quand j'ai vu que l'auth ne tenait pas proprement apres reload."
  },
  {
    date: '26 fevrier 2026',
    title: 'Liaison AniList plus sure',
    summary:
      "Je me suis rendu compte qu'un compte AniList deja connecte dans le navigateur pouvait lier le mauvais profil. J'ai du ajouter des garde-fous avant de laisser partir l'utilisateur vers OAuth."
  },
  {
    date: '4 mars 2026',
    title: 'Stabilisation de la session',
    summary:
      "Je suis revenu sur les guards et sur le refresh de session parce que j'avais encore des faux redirects et des comportements incoherents apres actualisation."
  },
  {
    date: '5 mars 2026',
    title: 'Profil, settings et social',
    summary:
      "J'ai commence a brancher les vraies donnees AniList dans le profil, puis j'ai vu qu'il fallait aussi mieux gerer les favoris, les stats, les followers et les profils publics."
  },
  {
    date: '6 mars 2026',
    title: 'Gateway AniList, anime list et compare',
    summary:
      "J'ai arrete de laisser le client gerer seul AniList. Les requetes devenaient trop repetees, trop fragiles et trop difficiles a faire evoluer sans un passage serveur."
  },
  {
    date: '9 au 12 mars 2026',
    title: 'Edition de liste et harmonisation UI',
    summary:
      "J'ai ouvert la voie aux mutations AniList, puis je suis revenu sur plusieurs pages parce que leurs sous-onglets et leurs compteurs ne racontaient pas toujours la meme chose."
  },
  {
    date: '16 mars 2026',
    title: 'Cache Valkey et shared lists',
    summary:
      "Le cache memoire me suffisait pour prototyper, mais il etait trop limite pour une logique AniList centralisee. J'ai donc migre vers Valkey avec fallback."
  },
  {
    date: '18 mars 2026',
    title: 'Derniers renommages et page anime',
    summary:
      "J'ai termine par des corrections de lisibilite technique et visuelle: renommage du store de sync et construction d'une page anime plus proche de ce que j'attendais d'une lecture AniList."
  }
]

const chapters: Chapter[] = [
  {
    id: 'foundation',
    period: '24 fevrier 2026 -> 4 mars 2026',
    title: 'Session PocketBase et routes protegees',
    summary:
      "Le premier vrai mur n'etait pas l'UI mais la session. Je pensais regler l'auth rapidement, puis je me suis retrouve avec des redirects absurdes des qu'on rechargeait une page protegee.",
    files: [
      'app/composables/usePocketbaseStore.ts',
      'app/composables/useMyAuthStore.ts',
      'app/middleware/auth.ts',
      'app/middleware/requireAuth.global.ts'
    ],
    issues: [
      "Mes guards lisaient l'etat auth trop tot. En SSR, le navigateur n'avait pas encore relu le localStorage, donc certaines pages me renvoyaient vers la connexion alors que le token etait toujours present.",
      "Quand authRefresh() echouait a cause d'un souci reseau, mon code reagissait comme si le compte etait vraiment invalide. Je nettoyais trop vite une session qui pouvait encore etre bonne.",
      "Le resultat cote interface etait franchement mauvais: faux logout, flash de redirection, puis parfois retour a la normale. Meme quand ca finissait par marcher, l'application donnait une impression d'instabilite."
    ],
    steps: [
      "J'ai branche un store PocketBase reactif sur pb.authStore.onChange() pour arreter de dupliquer l'etat auth dans plusieurs coins de l'application.",
      "J'ai ajoute une vraie sequence de restauration dans useMyAuthStore.ts au lieu de supposer que la session serait deja prete au premier rendu.",
      "J'ai introduit un bypass cote serveur dans les guards pour laisser le client relire le stockage local avant de conclure que l'utilisateur est hors session.",
      "J'ai separe plus clairement les routes publiques et les routes protegees avec requireAuth.global.ts, pour que les cas publics ne subissent pas le meme traitement que le reste.",
      "J'ai arrete de purger la session au premier echec qui ressemble a un incident reseau temporaire plutot qu'a un vrai token mort."
    ],
    result:
      "J'ai fini avec une auth beaucoup moins nerveuse: moins de faux redirects, moins de pertes de session percues et un comportement bien plus propre apres refresh."
  },
  {
    id: 'oauth',
    period: '24 fevrier 2026 -> 5 mars 2026',
    title: 'Liaison AniList, callback OAuth et anti-doublon',
    summary:
      "La liaison AniList m'a oblige a traiter un cas que j'avais sous-estime: si AniList etait deja connecte dans le navigateur, je pouvais lier le mauvais compte presque sans m'en rendre compte.",
    files: [
      'app/composables/useAnilistAuthStore.ts',
      'app/pages/auth/callback.vue',
      'server/api/anilist/exchangeToken.post.ts',
      'app/pages/settings.vue'
    ],
    issues: [
      "Au debut, mon flux etait trop confiant. Je partais du principe que l'utilisateur choisirait toujours le bon compte AniList, alors que le navigateur pouvait reutiliser une session deja ouverte.",
      "Je devais aussi empecher qu'un meme compte AniList soit attache a deux comptes Kizuna differents. Sans ce verrou, je creais une incoherence de donnees impossible a justifier ensuite.",
      "Le callback OAuth restait trop opaque en cas d'erreur. Si le state etait faux ou si le code manquait, l'utilisateur se retrouvait avec un echec peu lisible."
    ],
    steps: [
      "J'ai ajoute une alerte avant la redirection vers AniList pour prevenir clairement que le navigateur pouvait reutiliser un compte deja ouvert.",
      "J'ai genere un state cote client, je l'ai stocke localement, puis je l'ai verifie au retour dans le callback pour eliminer les retours invalides ou suspects.",
      "J'ai force l'echange du code OAuth a passer par server/api/anilist/exchangeToken.post.ts afin de garder le secret AniList hors du client.",
      "Apres l'echange, j'ai relu le Viewer AniList pour recuperer les identifiants et les infos de profil qui me servent vraiment cote Kizuna.",
      "J'ai interroge PocketBase avant l'ecriture pour bloquer tout anilist_user_id deja pris par un autre compte.",
      "J'ai ajoute dans settings des actions explicites pour rafraichir les donnees AniList ou delier completement le compte quand quelque chose part de travers."
    ],
    result:
      "La liaison AniList est devenue beaucoup plus defendable: je previens le mauvais compte, je valide le retour OAuth, je bloque les doublons et je garde un point de reprise dans les settings."
  },
  {
    id: 'gateway',
    period: '5 mars 2026 -> 16 mars 2026',
    title: 'Proxy GraphQL AniList, cache et resilience',
    summary:
      "J'ai fini par admettre que laisser les appels AniList vivre dans le client etait une mauvaise base. Je repetais trop de requetes et je n'avais pas de point central pour encaisser les 429 ou controler le cache.",
    files: [
      'app/composables/useAnilistGraphql.ts',
      'server/api/anilist/graphql.post.ts',
      'app/composables/useAnilistSocialStore.ts'
    ],
    issues: [
      "En restant cote client, je me compliquais la vie sur plusieurs fronts a la fois: logique reseau dispersee, requetes dupliquees, exposition plus directe du token utilisateur et moins de marge pour amortir les erreurs AniList.",
      "Certaines pages comme social, profil ou favorites redemandaient les memes donnees plusieurs fois. Meme quand l'interface paraissait fluide, je savais que le cout reseau etait mal maitrise.",
      "Le cache etait un autre piege: je devais imperativement eviter qu'une mutation AniList ressorte une vieille reponse ou qu'un cache authentifie se melange avec un cache anonyme."
    ],
    steps: [
      "J'ai cree useAnilistGraphql.ts comme point d'entree unique cote frontend pour arreter de disperser les appels AniList dans plusieurs stores.",
      "J'ai ajoute un endpoint serveur qui recoit la query, les variables, le token et les options de cache pour reprendre la main sur tout le trafic AniList.",
      "J'ai mis en place un cache memoire avec TTL puis une deduplication des requetes en vol pour couper les doublons simultanes.",
      "J'ai ajoute du rate limiting, des retries avec backoff et jitter sur les 429, parce que sans ca certaines pages devenaient juste aleatoires sous charge.",
      "J'ai separe les cles de cache selon le token afin de ne pas confondre les donnees publiques avec les donnees issues d'une session liee.",
      "Quand Valkey est devenu disponible, j'ai migre vers ce stockage tout en gardant un fallback memoire pour ne pas casser l'API si le service externe tombe.",
      "J'ai impose un bypass du cache pour toutes les mutations et pour les cas ou j'ai explicitement besoin d'une reponse fraiche."
    ],
    result:
      "J'ai gagne une architecture beaucoup plus solide: les appels AniList sont centralises, les 429 sont mieux absorbes et le cache ne travaille plus contre moi."
  },
  {
    id: 'profile',
    period: '5 mars 2026 -> 12 mars 2026',
    title: 'Profil AniList, favoris et activite',
    summary:
      "Le profil a vite montre ses limites. Visuellement ca pouvait passer, mais des qu'il a fallu afficher de vraies stats, les favoris complets et une activite lisible, ma premiere version n'etait plus suffisante.",
    files: [
      'app/composables/useAnilistProfileStore.ts',
      'app/pages/profilePage.vue',
      'app/pages/favorites.vue'
    ],
    issues: [
      "Le profil initial etait trop pauvre pour porter l'identite AniList. Je montrais quelques infos, mais pas assez pour que la page ressemble a un vrai profil utilisateur.",
      "Les favoris AniList sont pagines. Si je me contentais d'une seule page de reponse, je donnais une image tronquee du compte et je savais que l'utilisateur finirait par le remarquer.",
      "Mes reperes visuels pour les stats etaient trop figes. Des barres ou des marqueurs calcules sur de mauvaises bornes rendent vite une page plus jolie que juste."
    ],
    steps: [
      "J'ai sorti la logique profile dans useAnilistProfileStore.ts pour isoler les requetes stats, activite et favoris au lieu de tout empiler dans la page.",
      "J'ai charge les favoris anime et personnages sur plusieurs pages pour reconstituer une vue complete au lieu d'afficher seulement le premier paquet disponible.",
      "J'ai retrie les genres par volume reel pour construire une lecture qui suit les vraies donnees du compte et pas des seuils fixes.",
      "J'ai refait profilePage.vue avec une structure plus responsive, des skeletons et une meilleure mise en avant du banner et de l'avatar.",
      "J'ai decoupe l'activite en pages via fetchActivityPage() pour ne plus bloquer tout l'ecran sur un seul chargement massif.",
      "J'ai ensuite ouvert une vraie page favorites.vue avec lazy loading et sentinel d'infinite scroll pour garder l'experience exploitable."
    ],
    result:
      "Le profil raconte enfin quelque chose de credible: stats dynamiques, favoris plus complets, activite chargee par paliers et rendu visuel plus coherent avec AniList."
  },
  {
    id: 'social',
    period: '5 mars 2026 -> 12 mars 2026',
    title: 'Social AniList, amis mutuels et profils publics',
    summary:
      "La couche sociale m'a force a traiter des cas tordus que je n'avais pas dans les autres pages: donnees privees, erreurs liees au token et reconstruction des amis a partir de listes qui ne disent pas la meme chose.",
    files: [
      'app/composables/useAnilistSocialStore.ts',
      'app/pages/social.vue',
      'app/pages/socialUser/_id.vue',
      'app/pages/friends.vue'
    ],
    issues: [
      "AniList ne me donne pas un etat ami tout pret. Je devais fusionner following et followers proprement, puis recalculer moi-meme ce qui compte comme relation mutuelle.",
      "Certaines erreurs ne veulent pas dire la meme chose: token invalide, profil prive, requete rejetee ou utilisateur inaccessible. Sans tri correct, j'affichais vite le mauvais message.",
      "Je voulais rendre la page d'un ami consultable sans ouvrir toutes les routes au public. C'etait un petit detail produit, mais un vrai point de securite dans les middlewares."
    ],
    steps: [
      "J'ai separe les requetes followings et followers, puis je les ai chargees jusqu'a epuisement pour ne pas me retrouver avec un graphe social coupe en plein milieu.",
      "J'ai normalise chaque resultat dans un type SocialUser avec des drapeaux calcules pour following, isFollower et isFriend.",
      "J'ai ajoute une logique de retry sans token quand AniList renvoyait un message qui ressemblait plus a un probleme d'autorisation qu'a une vraie absence de donnees.",
      "J'ai construit social.vue autour de trois vues distinctes pour ne plus melanger suivis, followers et amis dans la meme liste confuse.",
      "J'ai explicitement autorise la route /social/user/:id dans requireAuth.global.ts pour garder cette page publique sans detendre tout le reste."
    ],
    result:
      "La partie sociale est devenue nettement plus propre: les amis mutuels sont calcules correctement, les erreurs AniList sont moins trompeuses et le profil public d'un ami ne casse pas la logique de protection globale."
  },
  {
    id: 'compare',
    period: '6 mars 2026 -> 12 mars 2026',
    title: 'Compare list et compteurs stabilises',
    summary:
      "La page compare a d'abord ressemble a une jolie maquette. Le probleme, c'est qu'une comparaison qui affiche de faux chiffres est pire qu'une page vide, donc j'ai du reprendre la logique beaucoup plus serieusement.",
    files: [
      'app/pages/compareList.vue',
      'server/api/social/compare/[id].get.ts'
    ],
    issues: [
      "Ma premiere version reposait surtout sur la presentation. Des que j'ai branche les vraies listes AniList, j'ai vu que les compteurs communs et exclusifs pouvaient diverger selon l'endroit ou je les calculais.",
      "Si je laissais le client faire trop de travail, j'obtenais vite des chiffres incoherents entre les cartes de synthese et les listes detaillees.",
      "AniList pouvait aussi echouer sur un userId pourtant valide. Sans fallback, une simple reponse capricieuse suffisait a donner l'impression que la compare ne marchait pas."
    ],
    steps: [
      "J'ai garde la structure visuelle de compareList.vue, mais j'ai deplace le coeur du calcul dans server/api/social/compare/[id].get.ts pour centraliser l'intersection.",
      "J'ai limite la comparaison aux statuts CURRENT et COMPLETED pour eviter de melanger des listes moins utiles et fausser la lecture du recouvrement.",
      "J'ai ajoute un fallback par userName quand la resolution par userId echoue, parce que l'API AniList ne se comporte pas toujours comme je l'aurais voulu.",
      "J'ai normalise les compteurs derives pour eviter les valeurs negatives, les doubles comptes et les ecarts entre les differents blocs de l'interface.",
      "J'ai branche des etats vides, des placeholders et de vrais messages d'erreur pour que l'ecran reste lisible meme quand AniList repond mal."
    ],
    result:
      "La compare est sortie du stade decoratif. Les chiffres sont mieux centralises, les cas limites sont moins cassants et la page supporte mieux les reponses capricieuses d'AniList."
  },
  {
    id: 'sync',
    period: '6 mars 2026 -> 18 mars 2026',
    title: 'Anime list editable et synchronisation AniList',
    summary:
      "Lire AniList etait une chose. Ecrire dedans proprement en etait une autre. C'est la partie ou j'ai du etre le plus defensif pour ne pas afficher une UI a jour alors que les donnees distantes ne l'etaient pas.",
    files: [
      'app/pages/animeList.vue',
      'app/composables/useAnilistSync.ts'
    ],
    issues: [
      "Une mutation AniList mal nettoyee pouvait envoyer des IDs invalides, une progression incoherente ou un score hors borne. Je n'avais pas le droit de faire confiance a l'etat brut de l'interface.",
      "Le cache etait un danger direct sur cette partie. Si je laissais une mutation repasser par une reponse mise en cache, l'utilisateur pouvait voir l'ancien etat et croire que sa sauvegarde avait echoue.",
      "Le composable s'appelait useAnilistListEditor, mais il faisait deja plus que de l'edition. Le nom commencait a masquer la vraie responsabilite du module."
    ],
    steps: [
      "J'ai cree un wrapper de mutation pour SaveMediaListEntry et DeleteMediaListEntry en relisant le token depuis la session PocketBase.",
      "J'ai normalise entryId, mediaId, progress et score avant envoi pour couper les valeurs absurdes directement a la source.",
      "J'ai impose skipCache sur toutes les mutations pour etre certain de ne jamais relire une ancienne reponse au pire moment.",
      "J'ai ajoute dans animeList.vue un panneau d'edition pilote par l'entree selectionnee avec statut, score, progression et suppression.",
      "Apres chaque sauvegarde ou suppression, j'ai relance un refetch complet de la liste pour recaler l'interface sur AniList plutot que d'inventer un etat local optimiste fragile.",
      "J'ai renomme le composable en useAnilistSync.ts parce que sa mission reelle est de synchroniser Kizuna et AniList, pas seulement d'ouvrir un petit editeur."
    ],
    result:
      "La liste anime est devenue vraiment interactive sans sacrifier la fiabilite: validations plus strictes, mutations mieux cadrees et architecture plus lisible."
  },
  {
    id: 'shared',
    period: '11 mars 2026 -> 16 mars 2026',
    title: 'Shared lists, donnees PocketBase et page detail',
    summary:
      "Les shared lists m'ont pris plus de temps que prevu parce que je suis passe d'une vitrine visuelle a une vraie lecture de donnees PocketBase, avec toute la salete habituelle des relations et des formats heterogenes.",
    files: [
      'app/pages/sharedLists.vue',
      'app/pages/sharedLists/[id].vue',
      'app/components/userHeaderTabs.vue'
    ],
    issues: [
      "Au debut, le hub shared lists ressemblait davantage a une demo d'interface qu'a un ecran branche sur de vraies donnees. Il a fallu remplacer cette illusion par un modele exploitable.",
      "Les relations PocketBase pouvaient me revenir sous forme de chaine, de tableau ou d'objet partiel. Tant que je ne normalisais pas ca, le mapping restait fragile.",
      "J'avais aussi trop de variantes locales pour les sous-onglets et les headers. A force, les pages du meme univers ne donnaient pas l'impression d'appartenir au meme produit."
    ],
    steps: [
      "J'ai commence par poser une version visuelle des shared lists pour valider l'intention, puis j'ai remplace progressivement les donnees factices par les collections PocketBase.",
      "J'ai charge shared_list, user_shared_list et anime_shared_list ensemble pour reconstituer les cartes, les membres, les roles et les compteurs.",
      "J'ai ecrit normalizeRelationValue() pour absorber les formes de relations PocketBase qui variaient trop selon le contexte.",
      "J'ai reclasse les listes entre owned et shared afin que l'ecran raconte enfin quelque chose d'utile au lieu d'afficher un melange peu lisible.",
      "J'ai extrait userHeaderTabs.vue pour unifier le bandeau, l'avatar et la sous-navigation sur plusieurs pages du profil.",
      "J'ai ensuite separe le hub shared lists de la page detail avec sharedLists/[id].vue pour clarifier la navigation."
    ],
    result:
      "Les shared lists ont enfin une base de donnees et une navigation credibles. Ce n'est plus juste une belle coquille, meme si tout n'est pas encore termine."
  },
  {
    id: 'polish',
    period: '10 mars 2026 -> 18 mars 2026',
    title: 'Polish UI, cohesion visuelle et page anime',
    summary:
      "Les derniers jours m'ont surtout servi a corriger la sensation generale du produit. Plusieurs pages fonctionnaient, mais elles donnaient encore une impression d'assemblage fait morceau par morceau.",
    files: [
      'app/pages/browse.vue',
      'app/pages/favorites.vue',
      'app/pages/friends.vue',
      'app/pages/anime/[id].vue',
      'app/components/header.vue'
    ],
    issues: [
      "Certaines pages parlaient des memes donnees mais avec des headers, des cartes et des alignements trop differents. Le produit manquait de langage visuel commun.",
      "La page detail anime etait le cas le plus visible. Je voulais retrouver une lecture proche d'AniList, mais ma premiere approche restait trop generique.",
      "Meme de petits details comme des liens de header, des banners ou des textes de cartes cassaient la coherence globale quand ils n'etaient pas alignes."
    ],
    steps: [
      "J'ai repris la page browse et le header du profil ami pour rapprocher les vues principales au lieu de laisser chaque ecran vivre sa propre logique.",
      "J'ai corrige plusieurs details de banners, d'avatars, de textes et de classes de liens dans le header pour enlever les petites cassures visuelles les plus visibles.",
      "J'ai aligne la page compare avec l'anime list sur le plan des cartes et des sections afin de reduire les ruptures entre deux ecrans pourtant proches.",
      "J'ai ajoute favorites.vue et friends.vue dans la meme logique de sous-navigation que le reste du profil.",
      "J'ai termine par app/pages/anime/[id].vue pour donner a la page detail un rendu plus proche de la lecture AniList que j'avais en tete."
    ],
    result:
      "Le produit est ressorti plus coherent. Ce n'est pas juste une couche cosmetique: cette harmonisation m'a aide a rendre les parcours plus lisibles et moins bricoles."
  }
]

const adjustments: Adjustment[] = [
  {
    date: '26 fevrier 2026',
    title: "Je me suis fait pieger par la connexion automatique AniList",
    detail:
      "Au premier essai, je laissais partir l'utilisateur vers AniList sans assez de contexte. Si un autre compte etait deja ouvert dans le navigateur, la redirection pouvait rattacher le mauvais profil. J'ai du rajouter un avertissement clair avant la liaison."
  },
  {
    date: '26 fevrier 2026',
    title: "J'avais sous-estime le probleme du doublon de compte",
    detail:
      "Sans verification, un meme compte AniList pouvait potentiellement etre associe a plusieurs comptes Kizuna. J'ai ajoute un controle PocketBase sur anilist_user_id avant toute ecriture pour couper ce cas proprement."
  },
  {
    date: '4 mars 2026',
    title: "Mes routes protegees concluaient trop vite que l'utilisateur etait hors session",
    detail:
      "Je lisais l'etat auth avant que le client n'ait relu le stockage local. Le resultat etait frustrant: page rechargee, redirect inutile, puis parfois retour normal juste apres. J'ai revu le timing des guards et le restore de session."
  },
  {
    date: '5 mars 2026',
    title: "Le profil avait l'air rempli mais racontait encore un compte incomplet",
    detail:
      "Ma premiere version affichait quelques informations AniList, mais pas assez pour donner une vraie photo du compte. Les favoris etaient tronques, les stats trop statiques et l'activite trop lourde a charger d'un coup."
  },
  {
    date: '5 au 6 mars 2026',
    title: "J'ai du sortir AniList du client pour reprendre le controle",
    detail:
      "Tant que les appels restaient disperses dans le frontend, je subissais les doublons, les 429 et les comportements difficiles a tracer. Le passage par un proxy serveur m'a permis de centraliser le cache, les retries et la logique de token."
  },
  {
    date: '6 mars 2026',
    title: "La compare etait jolie avant d'etre fiable",
    detail:
      "J'avais une page qui donnait bien visuellement, mais les chiffres pouvaient diverger entre les blocs si je laissais le calcul se faire a plusieurs endroits. J'ai fini par tout recentraliser cote serveur."
  },
  {
    date: '9 au 12 mars 2026',
    title: "Les sous-onglets du profil etaient devenus trop incoherents",
    detail:
      "A force de construire page par page, j'avais plusieurs variantes de header et de navigation secondaire. Rien de catastrophique en isolation, mais mis cote a cote le produit donnait une impression de bricolage. J'ai extrait un composant commun pour remettre de l'ordre."
  },
  {
    date: '12 mars 2026',
    title: "J'ai choisi le refetch complet apres mutation au lieu de tricher avec l'etat local",
    detail:
      "J'aurais pu forcer une mise a jour optimiste partout, mais sur une synchro AniList ca me paraissait trop fragile. Quand une mutation reussit, je recharge la liste pour m'assurer que l'UI raconte exactement ce qu'AniList a retenu."
  },
  {
    date: '16 mars 2026',
    title: "Le cache memoire ne suffisait plus pour le gateway AniList",
    detail:
      "Pour prototyper, ca passait. Pour une couche centrale appelee par plusieurs vues, je savais que je finirais par me heurter aux limites d'un simple process memoire. Le passage a Valkey m'a servi a rendre ce bloc plus serieux."
  },
  {
    date: '18 mars 2026',
    title: "J'ai renomme un module parce que son nom me trompait moi-meme",
    detail:
      "Le nom useAnilistListEditor me faisait penser a un petit outil d'edition local, alors qu'il s'agissait deja d'un vrai point de synchronisation entre Kizuna et AniList. Le renommage en useAnilistSync clarifie mieux ce que le code est devenu."
  }
]

const watchpoints: Watchpoint[] = [
  {
    file: 'app/pages/sharedLists/[id].vue',
    note:
      "La page detail shared list est forte visuellement, mais je sais qu'une partie importante du contenu repose encore sur des donnees locales simulees plutot que sur un CRUD complet branche a PocketBase."
  },
  {
    file: 'app/pages/social.vue et app/pages/friends.vue',
    note:
      "Le bouton Follow modifie surtout l'etat local de l'interface. Je n'ai pas encore pousse une vraie mutation persistante vers AniList pour rendre ce comportement totalement honnete."
  },
  {
    file: 'server/api/social/compare/[id].get.ts',
    note:
      "L'API de comparaison appelle encore AniList directement au lieu de repasser par le gateway /api/anilist/graphql. Ca fonctionne, mais je sais que je peux mieux consolider cette partie."
  }
]

const referencedFileCount = new Set(chapters.flatMap((chapter) => chapter.files)).size

const scopeStats = [
  { label: 'Periode visible', value: '24 fev. 2026 -> 18 mars 2026' },
  { label: 'Chantiers detailles', value: String(chapters.length) },
  { label: 'Fichiers cites', value: String(referencedFileCount) },
  { label: 'Corrections racontees', value: String(adjustments.length) }
]

useHead({
  title: 'Journal de developpement - Kizuna'
})
</script>

<style scoped src="~/assets/css/pages/journalDev.css"></style>
