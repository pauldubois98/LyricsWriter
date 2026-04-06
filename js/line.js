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
      App.pushUndo();
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
      App.pushUndo();
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
      App.pushUndoDebounced();
      lineData.text = input.value;
      debouncedUpdate(index);
      App.saveState();
    });
    input.addEventListener('paste', (e) => {
      const text = e.clipboardData.getData('text');
      const pastedLines = text.split(/\r?\n/).filter((l) => l.trim());
      if (pastedLines.length <= 1) return; // single line, let default handle it
      e.preventDefault();
      App.pushUndo();

      const idx = lines.indexOf(lineData);
      const currentLang = lineData.lang;

      // Put first line in current input
      input.value = pastedLines[0];
      lineData.text = pastedLines[0];
      triggerUpdate(lineData.el.dataset.index);

      // Insert remaining lines after current
      for (let p = 1; p < pastedLines.length; p++) {
        App.addLineAfter(idx + p, { text: pastedLines[p], lang: currentLang });
      }

      reindex();
      App.saveState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const idx = lines.indexOf(lineData);
        if (idx < lines.length - 1) {
          lines[idx + 1].input.focus();
        } else {
          App.pushUndo();
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
    deleteBtn.addEventListener('click', () => removeLine(lineData));

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
    // Insert at correct DOM position
    if (index < container.children.length) {
      container.insertBefore(wrapper, container.children[index]);
    } else {
      container.appendChild(wrapper);
    }

    if (lineData.text) {
      triggerUpdate(index);
    }

    return lineData;
  }

  function removeLine(line) {
    if (lines.length <= 1) return;
    const idx = lines.indexOf(line);
    if (idx === -1) return;
    App.pushUndo();
    line.el.remove();
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
      // Count from the end of the original IPA to find where the tail starts.
      // Skip stress marks (ˈ ˌ) which are stripped in rhyme cleaning.
      const tailCleanLen = rhymeTail.length;
      let origBoldStart = fullIpa.length;
      let cleanCount = 0;
      for (let k = fullIpa.length - 1; k >= 0 && cleanCount < tailCleanLen; k--) {
        const ch = fullIpa[k];
        if (ch === 'ˈ' || ch === 'ˌ') continue;
        cleanCount++;
        origBoldStart = k;
      }

      if (cleanCount >= tailCleanLen && origBoldStart < fullIpa.length) {
        const before = fullIpa.substring(0, origBoldStart);
        const bold = fullIpa.substring(origBoldStart);
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

    if (line.lang === 'fr') {
      const { raw, elided } = countFrenchSyllables(line.ipaWords);
      if (raw !== elided) {
        line.syllableCount.textContent = elided + '~' + raw;
        line.syllableCount.title = elided + ' syllables (with elision) / ' + raw + ' syllables (without elision)';
      } else {
        line.syllableCount.textContent = raw;
        line.syllableCount.title = raw + ' syllable' + (raw !== 1 ? 's' : '');
      }
    } else {
      const syllables = countSyllables(fullIpa);
      line.syllableCount.textContent = syllables;
      line.syllableCount.title = syllables + ' syllable' + (syllables !== 1 ? 's' : '');
    }
  }

  const IPA_VOWELS = new Set([
    'a', 'e', 'i', 'o', 'u',
    '\u025B', '\u0254', '\u026A', '\u028A', '\u028C', '\u00E6', '\u0251', '\u0259',
    '\u025D', '\u025A', '\u00F8', '\u0153', 'y', '\u0275', '\u0250',
    '\u0252', '\u026F', '\u0264', '\u025E', '\u025C', '\u0268', '\u0289',
  ]);

  // French syllable counter: ə always starts a new syllable (never merges with adjacent vowels)
  function countSyllablesFr(ipaStr) {
    if (!ipaStr) return 0;
    let count = 0;
    let inVowel = false;
    let prevWasSchwa = false;
    for (const ch of ipaStr) {
      if (IPA_VOWELS.has(ch)) {
        if (ch === 'ə') {
          // Schwa always starts a new syllable
          count++;
          inVowel = true;
          prevWasSchwa = true;
        } else if (!inVowel || prevWasSchwa) {
          // New vowel cluster, or vowel after schwa = new syllable
          count++;
          inVowel = true;
          prevWasSchwa = false;
        } else {
          // Continuing a vowel cluster (diphthong)
          prevWasSchwa = false;
        }
      } else if (ch !== '\u0303' && ch !== '\u0300' && ch !== '\u0301') {
        // Consonant (ignore combining marks)
        inVowel = false;
        prevWasSchwa = false;
      }
    }
    return count;
  }

  // French syllable counting with elision rules:
  // - Final ə is elided (not counted) before a word starting with a vowel sound
  // - Final ə is elided at the end of the line
  // Returns { raw, elided } — raw = all ə counted, elided = with elision applied
  function countFrenchSyllables(ipaWords) {
    if (!ipaWords || ipaWords.length === 0) return { raw: 0, elided: 0 };

    let raw = 0;
    let elided = 0;
    for (let w = 0; w < ipaWords.length; w++) {
      const ipa = ipaWords[w].ipa;
      if (!ipa) continue;

      const syllables = countSyllablesFr(ipa);
      raw += syllables;

      const endsWithSchwa = ipa.endsWith('ə');
      if (endsWithSchwa) {
        const isLastWord = (w === ipaWords.length - 1);
        const nextIpa = !isLastWord ? ipaWords[w + 1]?.ipa : null;
        const nextStartsWithVowel = nextIpa && IPA_VOWELS.has(nextIpa[0]);

        if (isLastWord || nextStartsWithVowel) {
          elided += syllables - 1;
        } else {
          elided += syllables;
        }
      } else {
        elided += syllables;
      }
    }
    // End-of-line: raw count also drops final ə
    const lastIpa = ipaWords[ipaWords.length - 1]?.ipa;
    if (lastIpa && lastIpa.endsWith('ə')) {
      raw -= 1;
    }
    return { raw: Math.max(raw, 0), elided: Math.max(elided, 0) };
  }

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

  function getSnapshot() {
    return lines.map((l) => ({ text: l.text, lang: l.lang }));
  }

  function restoreSnapshot(snapshot) {
    // Remove all existing lines
    while (lines.length) {
      lines[0].el.remove();
      lines.shift();
    }
    // Recreate from snapshot
    snapshot.forEach((data, i) => {
      createLine(i, data);
    });
    reindex();
  }

  return { init, createLine, getLines, getSnapshot, restoreSnapshot, setRhymeHighlight, removeLine };
})();
