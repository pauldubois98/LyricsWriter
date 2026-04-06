const App = (() => {
  let lineCount = 0;

  function init() {
    const container = document.getElementById('lines-container');
    LineManager.init(container);

    // Start with 4 empty lines
    for (let i = 0; i < 4; i++) {
      addLine();
    }

    document.getElementById('add-line-btn').addEventListener('click', addLine);
  }

  function addLine() {
    LineManager.createLine(lineCount++);
  }

  function updateRhymes() {
    const lines = LineManager.getLines();

    // Clear all highlights
    lines.forEach((_, i) => LineManager.setRhymeHighlight(i, false));

    // Detect rhymes
    const groups = RhymeDetector.detectRhymes(lines);

    // Apply bold to rhyming lines
    for (const [, indices] of groups) {
      for (const idx of indices) {
        LineManager.setRhymeHighlight(idx, true);
      }
    }
  }

  return { init, addLine, updateRhymes };
})();

document.addEventListener('DOMContentLoaded', App.init);
