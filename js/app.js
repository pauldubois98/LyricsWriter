const App = (() => {
  let lineCount = 0;
  const STORAGE_KEY = 'lyricsmaker_lines';
  const MAX_UNDO = 100;
  const undoStack = [];
  const redoStack = [];
  let undoDebounce = null;

  function init() {
    const container = document.getElementById('lines-container');
    LineManager.init(container);

    const saved = loadState();
    if (saved && saved.length > 0) {
      saved.forEach((data) => {
        LineManager.createLine(lineCount++, data);
      });
    } else {
      for (let i = 0; i < 4; i++) {
        addLine();
      }
    }

    document.getElementById('add-line-btn').addEventListener('click', () => {
      pushUndo();
      addLine();
      saveState();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    });
  }

  function pushUndo() {
    undoStack.push(LineManager.getSnapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
  }

  // Debounced pushUndo for text input — groups rapid keystrokes into one undo step
  function pushUndoDebounced() {
    if (undoDebounce === null) {
      pushUndo();
    }
    clearTimeout(undoDebounce);
    undoDebounce = setTimeout(() => {
      undoDebounce = null;
    }, 500);
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(LineManager.getSnapshot());
    const snapshot = undoStack.pop();
    lineCount = snapshot.length;
    LineManager.restoreSnapshot(snapshot);
    updateRhymes();
    saveState();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(LineManager.getSnapshot());
    const snapshot = redoStack.pop();
    lineCount = snapshot.length;
    LineManager.restoreSnapshot(snapshot);
    updateRhymes();
    saveState();
  }

  function addLine() {
    LineManager.createLine(lineCount++);
  }

  function addLineAfter(position, initialData) {
    return LineManager.createLine(position, initialData);
  }

  function saveState() {
    const lines = LineManager.getLines();
    const data = lines.map((l) => ({ text: l.text, lang: l.lang }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function updateRhymes() {
    const lines = LineManager.getLines();

    // Clear all highlights
    lines.forEach((_, i) => LineManager.setRhymeHighlight(i, null, null));

    // Detect and apply rhyme highlights
    const rhymes = RhymeDetector.detectRhymes(lines);

    for (const [idx, { tail, color }] of rhymes) {
      LineManager.setRhymeHighlight(idx, tail, color);
    }
  }

  return { init, addLine, addLineAfter, pushUndo, pushUndoDebounced, saveState, updateRhymes };
})();

document.addEventListener('DOMContentLoaded', App.init);
