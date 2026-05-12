// lexique-engine.js — Moteur de surlignement avec tooltip et popup
function highlightLexiqueWords(text) {
  if (typeof LEXIQUE_BDD === 'undefined') return text;
  let result = text;
  // Trier par longueur décroissante
  const sorted = [...LEXIQUE_BDD].sort((a, b) => b.fr.length - a.fr.length);
  sorted.forEach(word => {
    // Échapper les caractères spéciaux regex, y compris apostrophe
    const escaped = word.fr.replace(/[.*+?^${}()|[\]\\']/g, '\\$&');
    const regex = new RegExp(`(?<![\\w'\\u00C0-\\u024F])(${escaped})(?![\\w'\\u00C0-\\u024F])`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, (match) => {
        const tooltip = `<span class="lex-phon">${word.phon || ''}</span> ${word.en}<br><small>${word.def}</small>`;
        return `<span class="lex-highlight" onclick="openLexPopup('${word.fr.replace(/'/g,"\\'")}')">${match}<span class="lex-tooltip">${tooltip}</span></span>`;
      });
    }
  });
  return result;
}

function openLexPopup(fr) {
  if (typeof LEXIQUE_BDD === 'undefined') return;
  const word = LEXIQUE_BDD.find(w => w.fr === fr);
  if (!word) return;
  document.getElementById('lexPopupFr').textContent = word.fr;
  document.getElementById('lexPopupPhon').textContent = word.phon || '';
  document.getElementById('lexPopupEn').textContent = word.en;
  document.getElementById('lexPopupDef').textContent = word.def;
  document.getElementById('lexPopupEx').textContent = word.ex;
  document.getElementById('lexPopupCat').textContent = `${word.cat} • Niveau ${word.level}`;
  const modal = document.getElementById('lexique-popup-modal');
  if (modal) modal.style.display = 'flex';
}

function closeLexPopup(e) {
  if (!e || e.target.classList.contains('lex-modal-overlay') || e.target.id === 'lexique-popup-modal') {
    const modal = document.getElementById('lexique-popup-modal');
    if (modal) modal.style.display = 'none';
  }
}

// Appliquer le surlignage aux leçons après chargement
document.addEventListener('DOMContentLoaded', () => {
  if (typeof highlightLexiqueWords === 'function') {
    // Pour les pages qui ont des leçons dynamiques, on peut exposer la fonction globalement
    window.highlightLexiqueWords = highlightLexiqueWords;
  }
});