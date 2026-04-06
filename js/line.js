const LineManager = (() => {
  const lines = [];
  let container = null;
  let debounceTimers = {};

  function init(containerEl) {
    container = containerEl;
  }

  function createLine(index) {
    const lineData = { text: '', lang: 'en', ipa: '', ipaWords: [] };

    const wrapper = document.createElement('div');
    wrapper.className = 'lyric-line';
    wrapper.dataset.index = index;

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
    });

    // Text input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lyric-input';
    input.placeholder = 'Type a lyric line...';
    input.addEventListener('input', () => {
      lineData.text = input.value;
      debouncedUpdate(index);
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

    const inputRow = document.createElement('div');
    inputRow.className = 'input-row';
    inputRow.appendChild(langSelect);
    inputRow.appendChild(input);
    inputRow.appendChild(deleteBtn);

    wrapper.appendChild(inputRow);
    wrapper.appendChild(ipaDisplay);

    lineData.el = wrapper;
    lineData.ipaDisplay = ipaDisplay;
    lineData.input = input;
    lineData.langSelect = langSelect;

    lines.splice(index, 0, lineData);
    container.appendChild(wrapper);

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

    const parts = line.ipaWords.map((w) => {
      if (w.found) {
        return `<span class="ipa-word">${w.ipa}</span>`;
      }
      return `<span class="ipa-word ipa-unknown">${w.ipa}?</span>`;
    });

    line.ipaDisplay.innerHTML = '/' + parts.join(' ') + '/';
  }

  function getLines() {
    return lines;
  }

  function setRhymeHighlight(lineIndex, isBold) {
    const line = lines[lineIndex];
    if (!line) return;
    if (isBold) {
      line.ipaDisplay.classList.add('rhyme-bold');
    } else {
      line.ipaDisplay.classList.remove('rhyme-bold');
    }
  }

  return { init, createLine, getLines, setRhymeHighlight, removeLine };
})();
