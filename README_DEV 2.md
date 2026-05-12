# README_DEV — Français Master 🥖

## Vue d'ensemble
Quiz d'apprentissage du français quotidien pour **anglophones de 40+ ans** vivant en France.  
Architecture : 4 fichiers HTML autonomes + 2 fichiers JS de données/moteur.

---

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil |
| `quiz.html` | Moteur de quiz principal |
| `dashboard.html` | Espace personnel (stats, badges, Caméléon) |
| `lexique.html` | Lexique interactif 150 mots |
| `BDDlexique.js` | Base de données lexique (100+ mots, format JSON) |
| `lexique-engine.js` | Moteur de surlignement lexique dans les questions |

---

## Clés localStorage

| Clé | Contenu |
|---|---|
| `francaisMaster_v1` | Données de session actuelle |
| `francaisMaster_players` | Profils joueurs (progression, scores, erreurs) |

---

## Spécificités Français Master

### Phonétique intuitive pour anglophones
- Chaque mot du lexique a un champ `phon` : `*bon-ZHOOR*`
- Rendu visuel via `.phon` CSS (violet, curseur help)
- Auto-wrap dans les leçons : `*mot*` → `<span class="phon">*mot*</span>`
- Activé 600ms après DOMContentLoaded

### Surlignement lexique dans les questions
- `BDDlexique.js` contient `LEXIQUE_BDD[]`
- `lexique-engine.js` expose `highlightLexiqueWords(text)`
- Les mots reconnus reçoivent `.lex-highlight` avec tooltip au hover
- Clic sur un mot → popup modal `#lexique-popup-modal` avec définition complète
- Fallback sécurisé : si `LEXIQUE_BDD` absent, affichage texte normal

### Hint par niveau
- Chaque niveau dans `QUESTIONS_DB` a un champ `hint`
- Affiché sur la carte niveau dans renderLevels (en italique violet)
- Affiché dans la `hintBox` pendant le jeu

### Caméléon — erreurs typiques anglophones
10 exercices ciblant les erreurs de traduction mot à mot :
- `Je suis fini` → `J'ai fini`
- `Je suis 60 ans` → `J'ai 60 ans`
- `Je suis faim` → `J'ai faim`
- `C'est du soleil` → `Il fait du soleil`
- `J'ai envie de to manger` → `J'ai envie de manger`
- `Je connais que c'est vrai` → `Je sais que c'est vrai`
- etc.

---

## Architecture technique

### SUBJECT_CONFIG
```javascript
const SUBJECT_CONFIG = {
  name: "Français Master",
  emoji: "🥖",
  storageKey: "francaisMaster_v1",
  playersKey: "francaisMaster_players",
  dashboardFile: "dashboard.html",
  lexiqueFile: "lexique.html"
};
```

### QUESTIONS_DB — structure par niveau
```javascript
{
  1: {
    title: "Salutations 🙋",
    objective: "Dire bonjour, se présenter",
    hint: "Pensez au vouvoiement (vous) pour les inconnus !",
    qcm: [ {q, options[], correct, explanation}, ... ],  // 10 questions
    libre: [ {q, answer, alternatives[], explanation}, ... ]  // 10 questions
  }
}
```

### Système joueur
- Pas de création automatique de "Joueur 1"
- Au premier lancement : toast + `showNewPlayerModal()` après 800ms
- QCM : sélection par **index** (pas par texte) → évite les bugs apostrophes

---

## Niveaux de contenu

| Niveau | Thème | Cible |
|---|---|---|
| 1 | Salutations & Présentations | Tu/vous, enchanté, se présenter |
| 2 | Au marché & Les courses | Je voudrais, unités, prix |
| 3 | Au jardin & La nature | Noms, actions, saisons |
| 4 | Les voisins & La vie de quartier | Voisinage, services, politesse |
| 5 | Goûts & envies | J'adore/déteste, envie de, préférer |
| 6 | Chez le commerçant | Commerces, formules d'achat |
| 7 | Les amis & Les sorties | Proposer, accepter, rendez-vous |
| 8 | Le temps & La météo | Il fait..., saisons, jours |
| 9 | Les verbes essentiels | Irréguliers, savoir/connaître |
| 10 | Politesse & expressions | Excuses, comprendre, demander |

---

## Bugs connus / résolus

| Bug | Statut | Solution |
|---|---|---|
| Backticks ``` dans HTML/CSS | ✅ Résolu | Supprimés manuellement |
| QCM options avec apostrophes | ✅ Résolu | Sélection par index, pas par texte |
| Joueur 1 auto-créé | ✅ Résolu | Modal au démarrage |
| Double DOMContentLoaded | ✅ Résolu | Un seul handler |
| Em-dashes CSS `var(–` | ✅ Résolu | Vérification systématique |

---

## Pour ajouter du contenu

### Ajouter un mot au lexique
Dans `BDDlexique.js` → ajouter un objet :
```javascript
{fr:"mot", en:"translation", phon:"*pro-NON*", def:"définition", ex:"Exemple.", level:N, cat:"catégorie"}
```

### Ajouter des questions
Dans `QUESTIONS_DB` → ajouter dans `qcm[]` ou `libre[]` :
```javascript
{q:"Question ?", options:["A","B","C","D"], correct:"A", explanation:"Explication.", hint:"Indice optionnel."}
```

---

## Checklist avant push GitHub

```bash
grep -c '```' quiz.html        # → 0
grep -c 'var(–' quiz.html     # → 0
grep -c 'DOMContentLoaded' quiz.html  # → 1
```

---

## Roadmap future

- [ ] Questions audio (Web Speech API pour la prononciation)
- [ ] Fichier questions externe (`if(!QUESTIONS_DB) fetch('./questions.json')`)
- [ ] Mode découpage par contexte de vie (au restaurant, chez le médecin, etc.)
- [ ] Version anglophones débutants vs intermédiaires
- [ ] Normalisation automatique accents/apostrophes dans les réponses libres
