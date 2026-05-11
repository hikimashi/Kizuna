<template>
  <div class="manual-doc-page">
    <div class="manual-doc-shell">
      <aside class="manual-doc-sidebar">
        <div class="manual-doc-sidebar-inner">
          <div class="manual-doc-toolbar">
            <p class="manual-doc-label">{{ currentContent.sidebarLabel }}</p>
            <button
              type="button"
              class="manual-doc-language-btn"
              @click="toggleLanguage"
            >
              {{ currentLanguage === 'fr' ? 'Português' : 'Français' }}
            </button>
          </div>

          <h1>{{ currentContent.sidebarTitle }}</h1>
          <p class="manual-doc-intro">{{ currentContent.sidebarIntro }}</p>

          <nav class="manual-doc-nav" aria-label="Sommaire du manuel">
            <a
              v-for="item in currentContent.navigationItems"
              :key="item.id"
              :href="`#${item.id}`"
              class="manual-doc-nav-link"
            >
              <span class="manual-doc-nav-index">{{ item.index }}</span>
              <span>{{ item.label }}</span>
            </a>
          </nav>
        </div>
      </aside>

      <main class="manual-doc-content">
        <section id="overview" class="manual-doc-section">
          <p class="manual-doc-kicker">{{ currentContent.overview.kicker }}</p>
          <h2>{{ currentContent.overview.title }}</h2>
          <p>{{ currentContent.overview.description }}</p>

          <div class="manual-doc-callout">
            <strong>{{ currentContent.overview.calloutTitle }}</strong>
            <p>{{ currentContent.overview.calloutText }}</p>
          </div>
        </section>

        <section
          v-for="section in currentContent.manualSections"
          :id="section.id"
          :key="section.id"
          class="manual-doc-section"
        >
          <div class="manual-doc-section-head">
            <p class="manual-doc-kicker">{{ section.kicker }}</p>
            <h2>{{ section.title }}</h2>
            <p>{{ section.description }}</p>
          </div>

          <div class="manual-doc-grid">
            <div class="manual-doc-text">
              <article
                v-for="step in section.steps"
                :key="`${section.id}-${step.number}`"
                class="manual-doc-step"
              >
                <div class="manual-doc-step-badge">{{ step.number }}</div>
                <div>
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.text }}</p>
                </div>
              </article>
            </div>

            <aside class="manual-doc-visual">
              <div class="manual-doc-visual-frame">
                <span>{{ section.imageTitle }}</span>
                <small>{{ section.imageHint }}</small>
              </div>
            </aside>
          </div>
        </section>

        <section id="images" class="manual-doc-section">
          <p class="manual-doc-kicker">{{ currentContent.images.kicker }}</p>
          <h2>{{ currentContent.images.title }}</h2>
          <p>{{ currentContent.images.description }}</p>

          <div class="manual-doc-note-grid">
            <div class="manual-doc-note-card">
              <h3>{{ currentContent.images.noteOneTitle }}</h3>
              <p>{{ currentContent.images.noteOneText }}</p>
            </div>
            <div class="manual-doc-note-card">
              <h3>{{ currentContent.images.noteTwoTitle }}</h3>
              <p>{{ currentContent.images.noteTwoText }}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type ManualStep = {
  number: string
  title: string
  text: string
}

type ManualSection = {
  id: string
  kicker: string
  title: string
  description: string
  imageTitle: string
  imageHint: string
  steps: ManualStep[]
}

type ManualContent = {
  sidebarLabel: string
  sidebarTitle: string
  sidebarIntro: string
  navigationItems: Array<{ id: string; index: string; label: string }>
  overview: {
    kicker: string
    title: string
    description: string
    calloutTitle: string
    calloutText: string
  }
  manualSections: ManualSection[]
  images: {
    kicker: string
    title: string
    description: string
    noteOneTitle: string
    noteOneText: string
    noteTwoTitle: string
    noteTwoText: string
  }
}

const frenchContent: ManualContent = {
  sidebarLabel: 'Documentation',
  sidebarTitle: "Manuel d'utilisation",
  sidebarIntro: "Guide complet des principales fonctions de Kizuna, de la connexion jusqu'aux listes partagées.",
  navigationItems: [
    { id: 'overview', index: '01', label: "Vue d'ensemble" },
    { id: 'account', index: '02', label: 'Compte Kizuna' },
    { id: 'anilist', index: '03', label: 'Connexion AniList' },
    { id: 'dashboard', index: '04', label: 'Tableau de bord' },
    { id: 'search', index: '05', label: 'Recherche' },
    { id: 'anime-list', index: '06', label: "Liste d'animes" },
    { id: 'anime-page', index: '07', label: 'Page anime' },
    { id: 'social', index: '08', label: 'Amis et social' },
    { id: 'shared-lists', index: '09', label: 'Shared lists' },
    { id: 'profile-settings', index: '10', label: 'Profil et paramètres' },
    { id: 'notifications', index: '11', label: 'Notifications' },
    { id: 'images', index: '12', label: 'Captures' }
  ],
  overview: {
    kicker: "Vue d'ensemble",
    title: 'Comment fonctionne Kizuna',
    description: "Kizuna combine un compte local, une connexion AniList et plusieurs outils autour des animes partagés. Une fois connecté, vous pouvez rechercher des utilisateurs, consulter des profils, gérer votre liste, créer des listes partagées et suivre l'activité sociale.",
    calloutTitle: 'Parcours recommandé',
    calloutText: "Commencez par créer un compte, liez AniList, explorez votre tableau de bord, puis passez à la recherche, aux amis et aux listes partagées."
  },
  manualSections: [
    {
      id: 'account',
      kicker: 'Étape 1',
      title: 'Créer et ouvrir son compte Kizuna',
      description: "Le compte Kizuna sert de base à toute l'application. Il permet d'ouvrir une session locale avant de connecter AniList.",
      imageTitle: 'Capture à placer ici',
      imageHint: "Exemple : bouton Connexion, drawer d'accès ou formulaire d'inscription.",
      steps: [
        { number: '01', title: 'Ouvrir la connexion', text: "Depuis l'accueil, utilisez Connexion ou Inscription pour ouvrir l'interface d'accès." },
        { number: '02', title: 'Créer un compte', text: "Renseignez les informations demandées puis validez pour créer votre compte Kizuna." },
        { number: '03', title: 'Se connecter', text: "Connectez-vous avec votre compte local pour accéder à votre session." },
        { number: '04', title: "Vérifier l'état du compte", text: "Même sans AniList lié, votre session locale vous permet déjà d'accéder à certaines parties du site." }
      ]
    },
    {
      id: 'anilist',
      kicker: 'Étape 2',
      title: 'Lier son compte AniList',
      description: "La liaison AniList permet à Kizuna de récupérer l'identité, l'avatar, les données anime, les suivis et les informations sociales.",
      imageTitle: 'Capture à placer ici',
      imageHint: "Exemple : écran de liaison AniList, autorisation AniList ou retour sur Kizuna.",
      steps: [
        { number: '01', title: 'Lancer la connexion AniList', text: "Si votre compte n'est pas encore relié, Kizuna affiche un écran ou un bouton pour démarrer la liaison." },
        { number: '02', title: 'Autoriser Kizuna', text: "Validez la demande côté AniList pour partager votre identité et vos données anime avec Kizuna." },
        { number: '03', title: "Revenir sur l'application", text: "Après le callback, votre profil AniList est synchronisé dans Kizuna." },
        { number: '04', title: 'Débloquer les fonctions', text: "Une fois lié, vous pouvez utiliser la recherche, le social, les profils anime et les listes partagées." }
      ]
    },
    {
      id: 'dashboard',
      kicker: 'Étape 3',
      title: 'Utiliser le tableau de bord',
      description: 'Le tableau de bord centralise les raccourcis de navigation, les shared lists et les amis suivis.',
      imageTitle: 'Capture à placer ici',
      imageHint: "Exemple : vue d'ensemble de la page d'accueil connectée.",
      steps: [
        { number: '01', title: 'Voir les shared lists', text: 'Le premier panneau met en avant les listes partagées disponibles et donne accès à leur détail.' },
        { number: '02', title: 'Rechercher une liste', text: 'Le champ de recherche du panneau permet de retrouver une liste existante plus rapidement.' },
        { number: '03', title: 'Voir les amis', text: 'Le second panneau affiche les utilisateurs suivis et les accès rapides à leur profil.' },
        { number: '04', title: 'Accéder au reste du site', text: "Le header et les liens de navigation permettent de passer vers le social, la liste anime, l'exploration et les paramètres." }
      ]
    },
    {
      id: 'search',
      kicker: 'Fonction',
      title: 'Rechercher un anime ou un utilisateur',
      description: 'La recherche globale permet de trouver rapidement un anime AniList ou un utilisateur sans changer de page.',
      imageTitle: 'Capture à placer ici',
      imageHint: 'Exemple : modal de recherche avec onglets anime et utilisateurs.',
      steps: [
        { number: '01', title: 'Ouvrir la recherche', text: "Utilisez l'icône de recherche dans le header pour ouvrir la fenêtre de recherche." },
        { number: '02', title: 'Saisir une requête', text: "Entrez le nom d'un anime ou d'un utilisateur AniList." },
        { number: '03', title: 'Basculer entre les onglets', text: "Choisissez l'onglet Anime ou Utilisateurs selon ce que vous cherchez." },
        { number: '04', title: 'Ouvrir un résultat', text: 'Cliquez sur un résultat pour aller vers la page anime ou la fiche sociale correspondante.' }
      ]
    },
    {
      id: 'anime-list',
      kicker: 'Fonction',
      title: "Gérer sa liste d'animes",
      description: "La page de liste anime permet de consulter votre bibliothèque AniList synchronisée et d'interagir avec votre suivi.",
      imageTitle: 'Capture à placer ici',
      imageHint: 'Exemple : page animeList avec filtres, cartes ou statuts.',
      steps: [
        { number: '01', title: "Ouvrir la liste d'animes", text: 'Passez par la navigation principale pour accéder à votre liste synchronisée.' },
        { number: '02', title: 'Filtrer les entrées', text: 'Utilisez les catégories, statuts ou recherches disponibles pour réduire les résultats.' },
        { number: '03', title: 'Ajouter un anime à sa liste', text: "Depuis une fiche anime ou les résultats d'exploration, ajoutez un anime à votre suivi AniList." },
        { number: '04', title: 'Changer le statut', text: 'Mettez à jour un anime en regardé, en cours, planifié ou autre selon votre progression.' },
        { number: '05', title: 'Mettre à jour la progression', text: "Augmentez le nombre d'épisodes vus lorsque vous avancez dans une série." }
      ]
    },
    {
      id: 'anime-page',
      kicker: 'Fonction',
      title: 'Consulter une page anime',
      description: "Chaque page anime sert de point d'entrée détaillé pour consulter les informations, l'activité et les interactions autour d'une œuvre.",
      imageTitle: 'Capture à placer ici',
      imageHint: 'Exemple : page détail anime avec visuel, boutons et activité sociale.',
      steps: [
        { number: '01', title: "Ouvrir la fiche d'un anime", text: 'Accédez-y depuis la recherche, la navigation ou votre liste personnelle.' },
        { number: '02', title: 'Lire les informations', text: 'Consultez le synopsis, les genres, le format, le score et les autres données disponibles.' },
        { number: '03', title: 'Ajouter ou modifier dans sa liste', text: "Utilisez les actions disponibles pour ajouter l'anime à votre liste ou mettre à jour son statut." },
        { number: '04', title: "Regarder l'activité autour de l'anime", text: "La page permet aussi de voir l'activité sociale, des fils ou des éléments liés à AniList." }
      ]
    },
    {
      id: 'social',
      kicker: 'Fonction',
      title: 'Ajouter des amis et utiliser le social',
      description: 'Kizuna permet de retrouver des utilisateurs AniList, de les suivre et de comparer vos habitudes de visionnage.',
      imageTitle: 'Capture à placer ici',
      imageHint: "Exemple : page Social, fiche utilisateur, résultats de recherche ou liste d'amis.",
      steps: [
        { number: '01', title: 'Trouver un utilisateur', text: 'Cherchez un utilisateur via la recherche globale ou les pages sociales.' },
        { number: '02', title: 'Ouvrir sa fiche', text: 'Consultez son profil social pour voir son identité, ses données et ses informations visibles.' },
        { number: '03', title: 'Ajouter un ami ou suivre un profil', text: 'Depuis les résultats ou une fiche sociale, ajoutez la relation pour enrichir votre réseau.' },
        { number: '04', title: 'Comparer les goûts', text: 'Les pages sociales permettent de comparer vos points communs, vos scores et vos habitudes anime.' },
        { number: '05', title: 'Consulter la page Friends', text: 'La page dédiée aux amis regroupe les relations suivies et facilite la navigation entre profils.' }
      ]
    },
    {
      id: 'shared-lists',
      kicker: 'Fonction',
      title: 'Créer et gérer une shared list',
      description: "Les shared lists permettent à plusieurs utilisateurs de se réunir autour d'une sélection commune d'animes.",
      imageTitle: 'Capture à placer ici',
      imageHint: "Exemple : index des shared lists, formulaire de création ou détail d'une liste.",
      steps: [
        { number: '01', title: 'Ouvrir la section Shared Lists', text: 'Depuis le tableau de bord ou la page dédiée, ouvrez la liste des espaces partagés.' },
        { number: '02', title: 'Créer une shared list', text: 'Donnez un titre, choisissez les options disponibles et validez la création de la liste.' },
        { number: '03', title: 'Ajouter des membres', text: 'Invitez ou rattachez des amis pour construire une liste commune.' },
        { number: '04', title: 'Ajouter des animes à la liste', text: 'Sélectionnez les œuvres à partager pour constituer la base de suivi du groupe.' },
        { number: '05', title: 'Suivre la progression du groupe', text: "Consultez qui regarde quoi, les avancées de chacun et l'état global de la liste." }
      ]
    },
    {
      id: 'profile-settings',
      kicker: 'Fonction',
      title: 'Modifier son profil et ses paramètres',
      description: "La zone de profil et de paramètres permet de gérer l'apparence, les données synchronisées et l'état du compte.",
      imageTitle: 'Capture à placer ici',
      imageHint: 'Exemple : page profil, page paramètres ou options de thème.',
      steps: [
        { number: '01', title: 'Ouvrir son profil', text: 'La page profil centralise vos informations, vos statistiques et certaines données liées à AniList.' },
        { number: '02', title: 'Accéder aux paramètres', text: "Depuis l'avatar dans le header, ouvrez la page des paramètres." },
        { number: '03', title: 'Changer le thème', text: "Utilisez les contrôles disponibles pour modifier l'apparence générale de l'application." },
        { number: '04', title: 'Vérifier les données du compte', text: "Les paramètres permettent aussi de voir l'état du compte local et de la liaison AniList." },
        { number: '05', title: 'Se déconnecter', text: 'Depuis le menu utilisateur, vous pouvez fermer la session en cours.' }
      ]
    },
    {
      id: 'notifications',
      kicker: 'Fonction',
      title: 'Consulter les notifications',
      description: "La page des notifications regroupe les événements récents liés à votre activité AniList ou sociale dans Kizuna.",
      imageTitle: 'Capture à placer ici',
      imageHint: 'Exemple : cloche du header ou page notifications.',
      steps: [
        { number: '01', title: 'Ouvrir la cloche', text: "Depuis le header, utilisez l'icône de notification pour accéder aux nouveautés." },
        { number: '02', title: 'Lire les éléments non lus', text: 'Les notifications mettent en avant les événements importants à consulter en priorité.' },
        { number: '03', title: 'Naviguer depuis une notification', text: 'Selon le contenu, une notification peut rediriger vers une page sociale ou un autre écran utile.' }
      ]
    }
  ],
  images: {
    kicker: 'Captures',
    title: 'Ajouter des images au manuel',
    description: "Chaque zone visuelle peut accueillir une capture d'écran correspondant à la fonction décrite : connexion, profil, recherche, fiche anime, shared list ou paramètres.",
    noteOneTitle: 'Captures utiles',
    noteOneText: 'Connexion, dashboard, recherche, page anime, création de shared list, paramètres.',
    noteTwoTitle: 'Présentation simple',
    noteTwoText: 'Une image claire par section suffit, avec éventuellement une courte légende.'
  }
}

const portugueseContent: ManualContent = {
  sidebarLabel: 'Documentação',
  sidebarTitle: 'Manual de utilização',
  sidebarIntro: 'Guia completo das principais funções do Kizuna, desde a ligação da conta até às listas partilhadas.',
  navigationItems: [
    { id: 'overview', index: '01', label: 'Visão geral' },
    { id: 'account', index: '02', label: 'Conta Kizuna' },
    { id: 'anilist', index: '03', label: 'Ligação AniList' },
    { id: 'dashboard', index: '04', label: 'Painel principal' },
    { id: 'search', index: '05', label: 'Pesquisa' },
    { id: 'anime-list', index: '06', label: 'Lista de anime' },
    { id: 'anime-page', index: '07', label: 'Página do anime' },
    { id: 'social', index: '08', label: 'Amigos e social' },
    { id: 'shared-lists', index: '09', label: 'Shared lists' },
    { id: 'profile-settings', index: '10', label: 'Perfil e definições' },
    { id: 'notifications', index: '11', label: 'Notificações' },
    { id: 'images', index: '12', label: 'Capturas' }
  ],
  overview: {
    kicker: 'Visão geral',
    title: 'Como funciona o Kizuna',
    description: 'O Kizuna combina uma conta local, uma ligação AniList e várias ferramentas à volta de animes partilhados. Depois de entrar, pode pesquisar utilizadores, consultar perfis, gerir a sua lista, criar listas partilhadas e acompanhar a atividade social.',
    calloutTitle: 'Percurso recomendado',
    calloutText: 'Comece por criar uma conta, ligue o AniList, explore o painel principal e depois avance para a pesquisa, amigos e listas partilhadas.'
  },
  manualSections: [
    {
      id: 'account',
      kicker: 'Passo 1',
      title: 'Criar e abrir a conta Kizuna',
      description: 'A conta Kizuna é a base de toda a aplicação. Permite abrir uma sessão local antes de ligar o AniList.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: botão de entrada, drawer de acesso ou formulário de registo.',
      steps: [
        { number: '01', title: 'Abrir a ligação', text: 'Na página inicial, use Entrar ou Registar para abrir a interface de acesso.' },
        { number: '02', title: 'Criar a conta', text: 'Preencha os dados pedidos e valide para criar a sua conta Kizuna.' },
        { number: '03', title: 'Entrar na sessão', text: 'Entre com a conta local para aceder ao seu espaço.' },
        { number: '04', title: 'Confirmar o estado da conta', text: 'Mesmo sem AniList ligado, a sessão local já permite aceder a certas partes do site.' }
      ]
    },
    {
      id: 'anilist',
      kicker: 'Passo 2',
      title: 'Ligar a conta AniList',
      description: 'A ligação AniList permite ao Kizuna recuperar identidade, avatar, dados de anime, seguimentos e informação social.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: ecrã de ligação AniList, autorização ou regresso ao Kizuna.',
      steps: [
        { number: '01', title: 'Iniciar a ligação AniList', text: 'Se a conta ainda não estiver ligada, o Kizuna mostra um ecrã ou botão para iniciar o processo.' },
        { number: '02', title: 'Autorizar o Kizuna', text: 'Valide o pedido no AniList para partilhar a sua identidade e os seus dados de anime com o Kizuna.' },
        { number: '03', title: 'Voltar à aplicação', text: 'Depois do callback, o seu perfil AniList fica sincronizado no Kizuna.' },
        { number: '04', title: 'Desbloquear as funções', text: 'Depois da ligação, pode usar a pesquisa, o social, os perfis de anime e as listas partilhadas.' }
      ]
    },
    {
      id: 'dashboard',
      kicker: 'Passo 3',
      title: 'Utilizar o painel principal',
      description: 'O painel principal centraliza os atalhos de navegação, as shared lists e os amigos seguidos.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: visão completa da página inicial já ligada.',
      steps: [
        { number: '01', title: 'Ver as shared lists', text: 'O primeiro painel destaca as listas partilhadas disponíveis e dá acesso direto ao detalhe.' },
        { number: '02', title: 'Pesquisar uma lista', text: 'O campo de pesquisa do painel permite encontrar uma lista existente com mais rapidez.' },
        { number: '03', title: 'Ver os amigos', text: 'O segundo painel mostra os utilizadores seguidos e os atalhos para os respetivos perfis.' },
        { number: '04', title: 'Aceder ao resto do site', text: 'O header e os links de navegação permitem abrir o social, a lista de anime, a exploração e as definições.' }
      ]
    },
    {
      id: 'search',
      kicker: 'Função',
      title: 'Pesquisar um anime ou utilizador',
      description: 'A pesquisa global permite encontrar rapidamente um anime AniList ou um utilizador sem mudar de página.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: modal de pesquisa com separadores de anime e utilizadores.',
      steps: [
        { number: '01', title: 'Abrir a pesquisa', text: 'Use o ícone de pesquisa no header para abrir a janela de pesquisa.' },
        { number: '02', title: 'Escrever a pesquisa', text: 'Introduza o nome de um anime ou de um utilizador AniList.' },
        { number: '03', title: 'Mudar de separador', text: 'Escolha o separador Anime ou Utilizadores conforme o que procura.' },
        { number: '04', title: 'Abrir um resultado', text: 'Clique num resultado para abrir a página do anime ou a ficha social correspondente.' }
      ]
    },
    {
      id: 'anime-list',
      kicker: 'Função',
      title: 'Gerir a sua lista de anime',
      description: 'A página da lista de anime permite consultar a biblioteca AniList sincronizada e interagir com o seu acompanhamento.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: página animeList com filtros, cartões ou estados.',
      steps: [
        { number: '01', title: 'Abrir a lista de anime', text: 'Use a navegação principal para abrir a sua lista sincronizada.' },
        { number: '02', title: 'Filtrar entradas', text: 'Utilize categorias, estados ou pesquisas para reduzir os resultados.' },
        { number: '03', title: 'Adicionar um anime à lista', text: 'A partir de uma ficha de anime ou da exploração, adicione um anime ao seu acompanhamento AniList.' },
        { number: '04', title: 'Mudar o estado', text: 'Atualize um anime para visto, em curso, planeado ou outro estado conforme a progressão.' },
        { number: '05', title: 'Atualizar o progresso', text: 'Aumente o número de episódios vistos à medida que avança na série.' }
      ]
    },
    {
      id: 'anime-page',
      kicker: 'Função',
      title: 'Consultar a página de um anime',
      description: 'Cada página de anime funciona como ponto de entrada detalhado para consultar informações, atividade e interações.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: página de detalhe com visual, botões e atividade social.',
      steps: [
        { number: '01', title: 'Abrir a ficha do anime', text: 'Pode aceder pela pesquisa, pela navegação ou pela sua lista pessoal.' },
        { number: '02', title: 'Ler as informações', text: 'Consulte sinopse, géneros, formato, pontuação e outros dados disponíveis.' },
        { number: '03', title: 'Adicionar ou alterar na lista', text: 'Use as ações disponíveis para adicionar o anime à lista ou mudar o seu estado.' },
        { number: '04', title: 'Ver a atividade à volta do anime', text: 'A página também permite consultar atividade social, tópicos e elementos ligados ao AniList.' }
      ]
    },
    {
      id: 'social',
      kicker: 'Função',
      title: 'Adicionar amigos e usar o social',
      description: 'O Kizuna permite encontrar utilizadores AniList, segui-los e comparar hábitos de visualização.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: página Social, ficha de utilizador, resultados de pesquisa ou lista de amigos.',
      steps: [
        { number: '01', title: 'Encontrar um utilizador', text: 'Pesquise um utilizador através da pesquisa global ou das páginas sociais.' },
        { number: '02', title: 'Abrir a ficha', text: 'Consulte o perfil social para ver identidade, dados e informações visíveis.' },
        { number: '03', title: 'Adicionar amigo ou seguir perfil', text: 'A partir dos resultados ou da ficha social, adicione a relação ao seu espaço social.' },
        { number: '04', title: 'Comparar gostos', text: 'As páginas sociais permitem comparar pontos em comum, pontuações e hábitos anime.' },
        { number: '05', title: 'Consultar a página Friends', text: 'A página dedicada aos amigos reúne as relações seguidas e facilita a navegação entre perfis.' }
      ]
    },
    {
      id: 'shared-lists',
      kicker: 'Função',
      title: 'Criar e gerir uma shared list',
      description: 'As shared lists permitem reunir vários utilizadores à volta de uma seleção comum de animes.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: índice das shared lists, formulário de criação ou detalhe de uma lista.',
      steps: [
        { number: '01', title: 'Abrir a secção Shared Lists', text: 'A partir do painel principal ou da página dedicada, abra a lista dos espaços partilhados.' },
        { number: '02', title: 'Criar uma shared list', text: 'Defina um título, escolha as opções disponíveis e valide a criação da lista.' },
        { number: '03', title: 'Adicionar membros', text: 'Convide ou associe amigos para construir uma lista comum.' },
        { number: '04', title: 'Adicionar animes à lista', text: 'Selecione as obras a partilhar para constituir a base de acompanhamento do grupo.' },
        { number: '05', title: 'Seguir o progresso do grupo', text: 'Consulte quem está a ver o quê, o avanço de cada membro e o estado global da lista.' }
      ]
    },
    {
      id: 'profile-settings',
      kicker: 'Função',
      title: 'Modificar o perfil e as definições',
      description: 'A zona de perfil e definições permite gerir a aparência, os dados sincronizados e o estado da conta.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: página de perfil, página de definições ou opções de tema.',
      steps: [
        { number: '01', title: 'Abrir o perfil', text: 'A página de perfil centraliza informações, estatísticas e alguns dados ligados ao AniList.' },
        { number: '02', title: 'Abrir as definições', text: 'A partir do avatar no header, abra a página de definições.' },
        { number: '03', title: 'Mudar o tema', text: 'Use os controlos disponíveis para alterar a aparência geral da aplicação.' },
        { number: '04', title: 'Verificar os dados da conta', text: 'As definições também mostram o estado da conta local e da ligação AniList.' },
        { number: '05', title: 'Terminar sessão', text: 'A partir do menu do utilizador, pode fechar a sessão atual.' }
      ]
    },
    {
      id: 'notifications',
      kicker: 'Função',
      title: 'Consultar notificações',
      description: 'A página de notificações reúne os eventos récentes ligados à sua atividade AniList ou social no Kizuna.',
      imageTitle: 'Inserir captura aqui',
      imageHint: 'Exemplo: sino no header ou página de notificações.',
      steps: [
        { number: '01', title: 'Abrir o sino', text: 'No header, use o ícone de notificações para aceder às novidades.' },
        { number: '02', title: 'Ler os elementos não lidos', text: 'As notificações destacam os eventos mais importantes a consultar primeiro.' },
        { number: '03', title: 'Navegar a partir de uma notificação', text: 'Consoante o conteúdo, a notificação pode redirecionar para uma página social ou outro ecrã útil.' }
      ]
    }
  ],
  images: {
    kicker: 'Capturas',
    title: 'Adicionar imagens ao manual',
    description: 'Cada zona visual pode receber uma captura correspondente à função descrita: ligação, perfil, pesquisa, ficha de anime, shared list ou definições.',
    noteOneTitle: 'Capturas úteis',
    noteOneText: 'Ligação, dashboard, pesquisa, página de anime, criação de shared list e definições.',
    noteTwoTitle: 'Apresentação simples',
    noteTwoText: 'Uma imagem clara por secção é suficiente, com uma pequena legenda se necessário.'
  }
}

const currentLanguage = ref<'fr' | 'pt'>('fr')

const currentContent = computed(() =>
  currentLanguage.value === 'fr' ? frenchContent : portugueseContent
)

const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'fr' ? 'pt' : 'fr'
}
</script>

<style scoped src="~/assets/css/pages/manual.css"></style>
