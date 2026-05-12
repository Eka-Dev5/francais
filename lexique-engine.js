// ═══════════════════════════════════════════════════════════════════
// LEXIQUE ENGINE — Moteur de surlignement et popup
// Réutilisable par lexiqueFR.html et quizFR.html
// ═══════════════════════════════════════════════════════════════════

/**
 * Construit un index rapide du lexique pour la recherche
 * @returns {Object} Index {motNormalise: [indicesLexique]}
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
 * @param {Object} index - Index du lexique (optionnel, auto-généré si manquant)
 * @returns {string} HTML avec surlignement
 */
function highlightLexiqueWords(text, index) {
  if (!index || Object.keys(index).length === 0) {
    index = window._lexiqueIndex || buildLexiqueIndex();
    window._lexiqueIndex = index;
  }
  if (Object.keys(index).length === 0) return escapeHtml(text);

  // Découper en tokens (mots + séparateurs)
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

  // Créer ou réutiliser un modal
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

// Auto-init au chargement
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window._lexiqueIndex = buildLexiqueIndex();
    console.log('[LexiqueEngine] Index construit:', Object.keys(window._lexiqueIndex).length, 'entrées');
  }, 100);
});
