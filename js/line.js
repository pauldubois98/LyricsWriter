const LineManager = (() => {
  const lines = [];
  let container = null;
  let debounceTimers = {};
  let draggedLine = null;

  function init(containerEl) {
    container = containerEl;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = getDragTarget(e.target);
      if (!target || !draggedLine || target === draggedLine.el) return;
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        container.insertBefore(draggedLine.el, target);
      } else {
        container.insertBefore(draggedLine.el, target.nextSibling);
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedLine) return;
      // Rebuild the lines array to match DOM order
      const newOrder = [];
      for (const child of container.children) {
        const line = lines.find((l) => l.el === child);
        if (line) newOrder.push(line);
      }
      lines.length = 0;
      lines.push(...newOrder);
      reindex();
      App.updateRhymes();
      App.saveState();
    });
  }

  function getDragTarget(el) {
    while (el && el !== container) {
      if (el.classList && el.classList.contains('lyric-line')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function createLine(index, initialData) {
    const lineData = { text: '', lang: 'en', ipa: '', ipaWords: [] };
    if (initialData) {
      lineData.text = initialData.text || '';
      lineData.lang = initialData.lang || 'en';
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'lyric-line';
    wrapper.dataset.index = index;

    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '\u2261';
    dragHandle.title = 'Drag to reorder';
    dragHandle.addEventListener('mousedown', () => {
      wrapper.draggable = true;
    });
    wrapper.addEventListener('dragstart', (e) => {
      draggedLine = lineData;
      wrapper.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    wrapper.addEventListener('dragend', () => {
      wrapper.draggable = false;
      wrapper.classList.remove('dragging');
      draggedLine = null;
    });

    // Language selector
    const langSelect = document.createElement('select');
    langSelect.className = 'lang-select';
    langSelect.title = 'Language';
    LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.flag;
      opt.title = lang.label;
      langSelect.appendChild(opt);
    });
    langSelect.addEventListener('change', () => {
      lineData.lang = langSelect.value;
      triggerUpdate(index);
      App.saveState();
    });

    // Text input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lyric-input';
    input.placeholder = 'Type a lyric line...';
    input.addEventListener('input', () => {
      lineData.text = input.value;
      debouncedUpdate(index);
      App.saveState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const idx = lines.indexOf(lineData);
        if (idx < lines.length - 1) {
          lines[idx + 1].input.focus();
        } else {
          App.addLine();
          lines[lines.length - 1].input.focus();
        }
      }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '\u00D7';
    deleteBtn.title = 'Remove line';
    deleteBtn.addEventListener('click', () => removeLine(index));

    // IPA display
    const ipaDisplay = document.createElement('div');
    ipaDisplay.className = 'ipa-display';

    // Syllable count
    const syllableCount = document.createElement('span');
    syllableCount.className = 'syllable-count';

    const inputRow = document.createElement('div');
    inputRow.className = 'input-row';
    inputRow.appendChild(dragHandle);
    inputRow.appendChild(langSelect);
    inputRow.appendChild(input);
    inputRow.appendChild(syllableCount);
    inputRow.appendChild(deleteBtn);

    wrapper.appendChild(inputRow);
    wrapper.appendChild(ipaDisplay);

    lineData.el = wrapper;
    lineData.ipaDisplay = ipaDisplay;
    lineData.syllableCount = syllableCount;
    lineData.input = input;
    lineData.langSelect = langSelect;

    if (initialData) {
      input.value = lineData.text;
      langSelect.value = lineData.lang;
    }

    lines.splice(index, 0, lineData);
    container.appendChild(wrapper);

    if (lineData.text) {
      triggerUpdate(index);
    }

    return lineData;
  }

  function removeLine(index) {
    if (lines.length <= 1) return;
    const line = lines.find((l) => l.el.dataset.index == index);
    if (!line) return;
    line.el.remove();
    const idx = lines.indexOf(line);
    lines.splice(idx, 1);
    reindex();
    App.updateRhymes();
    App.saveState();
  }

  function reindex() {
    lines.forEach((line, i) => {
      line.el.dataset.index = i;
    });
  }

  function debouncedUpdate(index) {
    clearTimeout(debounceTimers[index]);
    debounceTimers[index] = setTimeout(() => triggerUpdate(index), 400);
  }

  async function triggerUpdate(index) {
    const line = lines.find((l) => l.el.dataset.index == index);
    if (!line) return;

    if (!line.text.trim()) {
      line.ipa = '';
      line.ipaWords = [];
      line.ipaDisplay.innerHTML = '';
      line.syllableCount.textContent = '';
      App.updateRhymes();
      return;
    }

    line.ipaDisplay.innerHTML = '<span class="ipa-loading">...</span>';

    const ipaWords = await IpaConverter.convertLine(line.text, line.lang);
    line.ipaWords = ipaWords;

    // Build full IPA string from the last word (for rhyme detection)
    const allIpa = ipaWords.map((w) => w.ipa).join(' ');
    line.ipa = allIpa;

    renderIpa(line);
    App.updateRhymes();
  }

  function renderIpa(line) {
    if (!line.ipaWords || line.ipaWords.length === 0) {
      line.ipaDisplay.innerHTML = '';
      return;
    }

    const rhymeTail = line.rhymeTail || null;
    const rhymeColor = line.rhymeColor || null;
    const fullIpa = line.ipaWords.map((w) => w.ipa).join(' ');

    // Build the IPA string, then split the bold tail from the end
    let html;
    if (rhymeTail) {
      // Find the tail in the full IPA (strip stress marks for matching)
      const cleanFull = fullIpa.replace(/[ˈˌ]/g, '');
      const tailPos = cleanFull.lastIndexOf(rhymeTail);

      if (tailPos !== -1) {
        // Map position back to original string (with stress marks)
        let origPos = 0;
        let cleanIdx = 0;
        while (cleanIdx < tailPos && origPos < fullIpa.length) {
          if (fullIpa[origPos] === 'ˈ' || fullIpa[origPos] === 'ˌ') {
            origPos++;
          } else {
            origPos++;
            cleanIdx++;
          }
        }
        const before = fullIpa.substring(0, origPos);
        const bold = fullIpa.substring(origPos);
        const style = rhymeColor ? ` style="color:${rhymeColor}"` : '';
        html = `/${escapeHtml(before)}<b class="rhyme-match"${style}>${escapeHtml(bold)}</b>/`;
      } else {
        html = `/${escapeHtml(fullIpa)}/`;
      }
    } else {
      html = `/${escapeHtml(fullIpa)}/`;
    }

    // Mark unknown words with italic
    line.ipaWords.forEach((w) => {
      if (!w.found) {
        html = html.replace(w.ipa, `<i class="ipa-unknown">${escapeHtml(w.ipa)}?</i>`);
      }
    });

    line.ipaDisplay.innerHTML = html;

    // Color the left border of the card
    if (rhymeColor) {
      line.el.style.borderLeft = `3px solid ${rhymeColor}`;
    } else {
      line.el.style.borderLeft = '';
    }

    const syllables = countSyllables(fullIpa);
    line.syllableCount.textContent = syllables;
    line.syllableCount.title = syllables + ' syllable' + (syllables !== 1 ? 's' : '');
  }

  const IPA_VOWELS = new Set([
    'a', 'e', 'i', 'o', 'u',
    '\u025B', '\u0254', '\u026A', '\u028A', '\u028C', '\u00E6', '\u0251', '\u0259',
    '\u025D', '\u025A', '\u00F8', '\u0153', 'y', '\u0275', '\u0250',
    '\u0252', '\u026F', '\u0264', '\u025E', '\u025C', '\u0268', '\u0289',
  ]);

  function countSyllables(ipaStr) {
    if (!ipaStr) return 0;
    let count = 0;
    let inVowel = false;
    for (const ch of ipaStr) {
      if (IPA_VOWELS.has(ch)) {
        if (!inVowel) count++;
        inVowel = true;
      } else {
        inVowel = false;
      }
    }
    return count;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getLines() {
    return lines;
  }

  function setRhymeHighlight(lineIndex, tail, color) {
    const line = lines[lineIndex];
    if (!line) return;
    line.rhymeTail = tail;
    line.rhymeColor = color;
    renderIpa(line);
  }

  return { init, createLine, getLines, setRhymeHighlight, removeLine };
})();
