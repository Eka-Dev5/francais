// ═══════════════════════════════════════════════════════════════════
// LEXIQUE ENGINE — Moteur complet de surlignement, recherche et filtres
// Réutilisable par lexiqueFR.html et quizFR.html
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// PARTIE 1 : INDEXATION ET SURLIGNEMENT (pour le quiz)
// ═══════════════════════════════════════════════════════════════════

/**
 * Construit un index rapide du lexique pour la recherche
 * @returns {Object} Index {motNormalise: Set(indicesLexique)}
 */
function buildLexiqueIndex() {
  if (typeof LEXIQUE === 'undefined') {
    console.warn('[LexiqueEngine] LEXIQUE non chargé');
    return {};
  }
  const index = {};
  LEXIQUE.forEach((w, idx) => {
    // Indexer le mot français complet
    const frClean = normalizeText(w.fr);
    addToIndex(index, frClean, idx);

    // Indexer chaque mot individuel (pour les expressions)
    const words = frClean.split(/[\s\-']/);
    words.forEach(word => {
      if (word.length >= 3) {
        addToIndex(index, word, idx);
      }
    });

    // Indexer aussi la traduction anglaise
    const enClean = normalizeText(w.en);
    addToIndex(index, enClean, idx);
  });
  return index;
}

function addToIndex(index, key, idx) {
  if (!index[key]) index[key] = new Set();
  index[key].add(idx);
}

function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[ïî]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9\s\-']/g, '');
}

/**
 * Surligne les mots du lexique dans un texte HTML
 * @param {string} text - Texte brut
 * @param {Object} index - Index du lexique (optionnel)
 * @returns {string} HTML avec surlignement
 */
function highlightLexiqueWords(text, index) {
  if (!index || Object.keys(index).length === 0) {
    index = window._lexiqueIndex || buildLexiqueIndex();
    window._lexiqueIndex = index;
  }
  if (Object.keys(index).length === 0) return escapeHtml(text);

  const tokens = text.split(/([\s.,;:!?'"()\[\]{}]+)/);

  return tokens.map(token => {
    if (/^[\s.,;:!?'"()\[\]{}]+$/.test(token)) {
      return escapeHtml(token);
    }

    const clean = normalizeText(token);
    if (index[clean] && index[clean].size > 0) {
      const idx = Array.from(index[clean])[0];
      const word = LEXIQUE[idx];
      return buildHighlightSpan(token, word, idx);
    }
    return escapeHtml(token);
  }).join('');
}

function buildHighlightSpan(originalText, wordData, index) {
  const phon = wordData.phon ? `<span class="lex-phon">${escapeHtml(wordData.phon)}</span>` : '';
  return `<span class="lex-highlight" data-lex-index="${index}" onclick="showLexiquePopup(${index})">` +
         `${escapeHtml(originalText)}` +
         `<span class="lex-tooltip">` +
         `<strong>${escapeHtml(wordData.fr)}</strong> ${phon}<br>` +
         `<em>${escapeHtml(wordData.en)}</em><br>` +
         `<small>${escapeHtml(wordData.def.substring(0, 60))}${wordData.def.length > 60 ? '...' : ''}</small>` +
         `</span></span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Affiche un popup avec la définition complète d'un mot
 * @param {number} idx - Index dans LEXIQUE
 */
function showLexiquePopup(idx) {
  if (typeof LEXIQUE === 'undefined' || !LEXIQUE[idx]) return;
  const w = LEXIQUE[idx];

  let modal = document.getElementById('lexique-popup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lexique-popup-modal';
    modal.innerHTML = `
      <div class="lex-modal-overlay" onclick="closeLexiquePopup()">
        <div class="lex-modal-content" onclick="event.stopPropagation()">
          <div class="lex-modal-header">
            <span class="lex-modal-fr"></span>
            <span class="lex-modal-phon"></span>
          </div>
          <div class="lex-modal-en"></div>
          <div class="lex-modal-def"></div>
          <div class="lex-modal-ex"></div>
          <div class="lex-modal-cat"></div>
          <button class="lex-modal-close" onclick="closeLexiquePopup()">✕ Fermer</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  modal.querySelector('.lex-modal-fr').textContent = w.fr;
  modal.querySelector('.lex-modal-phon').textContent = w.phon || '';
  modal.querySelector('.lex-modal-en').textContent = w.en;
  modal.querySelector('.lex-modal-def').innerHTML = '<h4>📖 Définition</h4><p>' + w.def + '</p>';
  modal.querySelector('.lex-modal-ex').innerHTML = '<h4>💬 Exemple</h4><p><em>' + w.ex + '</em></p>';
  modal.querySelector('.lex-modal-cat').innerHTML = '<h4>📝 Catégorie</h4><p>' + w.cat + ' • Niveau ' + w.level + '</p>';

  modal.style.display = 'flex';
}

function closeLexiquePopup() {
  const modal = document.getElementById('lexique-popup-modal');
  if (modal) modal.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════
// PARTIE 2 : FILTRES ET RECHERCHE AVANCÉE (pour lexiqueFR.html)
// ═══════════════════════════════════════════════════════════════════

/**
 * Filtre le lexique par niveau
 * @param {number} level - Niveau (0 = tous)
 * @returns {Array} Mots filtrés
 */
function filterByLevel(level) {
  if (!LEXIQUE) return [];
  if (level === 0) return [...LEXIQUE];
  return LEXIQUE.filter(w => w.level === level);
}

/**
 * Filtre le lexique par thème/catégorie
 * @param {string} category - Catégorie (ex: "nom", "verbe", "adjectif")
 * @returns {Array} Mots filtrés
 */
function filterByCategory(category) {
  if (!LEXIQUE || !category) return [...LEXIQUE];
  return LEXIQUE.filter(w => w.cat && w.cat.toLowerCase() === category.toLowerCase());
}

/**
 * Filtre le lexique par thème (champ theme)
 * @param {string} theme - Thème (ex: "animaux", "nourriture", "maison")
 * @returns {Array} Mots filtrés
 */
function filterByTheme(theme) {
  if (!LEXIQUE || !theme) return [...LEXIQUE];
  return LEXIQUE.filter(w => w.theme && w.theme.toLowerCase().includes(theme.toLowerCase()));
}

/**
 * Recherche textuelle dans le lexique
 * @param {string} query - Texte recherché
 * @returns {Array} Mots correspondants
 */
function searchLexique(query) {
  if (!LEXIQUE || !query) return [...LEXIQUE];
  const q = query.toLowerCase();
  return LEXIQUE.filter(w => 
    (w.fr && w.fr.toLowerCase().includes(q)) ||
    (w.en && w.en.toLowerCase().includes(q)) ||
    (w.def && w.def.toLowerCase().includes(q)) ||
    (w.phon && w.phon.toLowerCase().includes(q)) ||
    (w.ex && w.ex.toLowerCase().includes(q))
  );
}

/**
 * Trie le lexique par ordre alphabétique français
 * @param {Array} words - Liste de mots
 * @param {string} sortBy - "fr" ou "en"
 * @returns {Array} Liste triée
 */
function sortLexique(words, sortBy) {
  if (!words) return [];
  const sorted = [...words];
  sorted.sort((a, b) => {
    const keyA = (sortBy === 'en' ? a.en : a.fr) || '';
    const keyB = (sortBy === 'en' ? b.en : b.fr) || '';
    return keyA.localeCompare(keyB, 'fr', { sensitivity: 'base' });
  });
  return sorted;
}

/**
 * Récupère toutes les catégories uniques du lexique
 * @returns {Array} Liste des catégories
 */
function getAllCategories() {
  if (!LEXIQUE) return [];
  const cats = new Set();
  LEXIQUE.forEach(w => { if (w.cat) cats.add(w.cat); });
  return Array.from(cats).sort();
}

/**
 * Récupère tous les thèmes uniques du lexique
 * @returns {Array} Liste des thèmes
 */
function getAllThemes() {
  if (!LEXIQUE) return [];
  const themes = new Set();
  LEXIQUE.forEach(w => { if (w.theme) themes.add(w.theme); });
  return Array.from(themes).sort();
}

/**
 * Récupère la répartition par niveau
 * @returns {Object} {niveau: count}
 */
function getLevelDistribution() {
  if (!LEXIQUE) return {};
  const dist = {};
  LEXIQUE.forEach(w => {
    dist[w.level] = (dist[w.level] || 0) + 1;
  });
  return dist;
}

/**
 * Récupère la répartition par catégorie
 * @returns {Object} {catégorie: count}
 */
function getCategoryDistribution() {
  if (!LEXIQUE) return {};
  const dist = {};
  LEXIQUE.forEach(w => {
    if (w.cat) {
      dist[w.cat] = (dist[w.cat] || 0) + 1;
    }
  });
  return dist;
}

// ═══════════════════════════════════════════════════════════════════
// PARTIE 3 : RENDU HTML POUR L'INTERFACE LEXIQUE
// ═══════════════════════════════════════════════════════════════════

/**
 * Génère le HTML d'une carte de mot
 * @param {Object} w - Objet mot du lexique
 * @param {number} idx - Index
 * @returns {string} HTML
 */
function renderWordCard(w, idx) {
  return `
    <div class="word-card" onclick="openModal(${idx})">
      <span class="word-lv">Niv.${w.level}</span>
      <div class="word-en">${escapeHtml(w.en)}</div>
      <div class="word-fr">${escapeHtml(w.fr)}</div>
      <div class="word-phon">${w.phon ? escapeHtml(w.phon) : ''}</div>
      <span class="word-cat">${escapeHtml(w.cat)}${w.theme ? ' • ' + escapeHtml(w.theme) : ''}</span>
    </div>`;
}

/**
 * Génère le HTML de la grille complète
 * @param {Array} words - Liste de mots à afficher
 * @returns {string} HTML de la grille
 */
function renderWordGrid(words) {
  if (!words || words.length === 0) {
    return '<div class="empty-msg">Aucun mot trouvé. Essaie une autre recherche.</div>';
  }
  return words.map((w, i) => renderWordCard(w, LEXIQUE.indexOf(w))).join('');
}

/**
 * Génère les onglets de niveau
 * @param {Function} onClick - Callback onclick(level, btn)
 * @returns {string} HTML
 */
function renderLevelTabs(onClick) {
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return levels.map(lvl => 
    `<button class="level-tab${lvl === 0 ? ' active' : ''}" onclick="${onClick}(${lvl}, this)">${lvl === 0 ? 'Tous' : 'Niv. ' + lvl}</button>`
  ).join('');
}

/**
 * Génère le sélecteur de catégories
 * @param {Function} onChange - Callback onchange(category)
 * @returns {string} HTML
 */
function renderCategorySelector(onChange) {
  const cats = getAllCategories();
  let html = `<select onchange="${onChange}(this.value)"><option value="">Toutes catégories</option>`;
  cats.forEach(cat => {
    html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
  });
  html += '</select>';
  return html;
}

/**
 * Génère le sélecteur de thèmes
 * @param {Function} onChange - Callback onchange(theme)
 * @returns {string} HTML
 */
function renderThemeSelector(onChange) {
  const themes = getAllThemes();
  if (themes.length === 0) return '';
  let html = `<select onchange="${onChange}(this.value)"><option value="">Tous thèmes</option>`;
  themes.forEach(theme => {
    html += `<option value="${escapeHtml(theme)}">${escapeHtml(theme)}</option>`;
  });
  html += '</select>';
  return html;
}

// ═══════════════════════════════════════════════════════════════════
// AUTO-INIT
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof LEXIQUE !== 'undefined') {
      window._lexiqueIndex = buildLexiqueIndex();
      console.log('[LexiqueEngine] Index construit:', Object.keys(window._lexiqueIndex).length, 'entrées');
      console.log('[LexiqueEngine] Catégories:', getAllCategories().join(', '));
      console.log('[LexiqueEngine] Thèmes:', getAllThemes().join(', ') || 'Aucun');
    }
  }, 100);
});
