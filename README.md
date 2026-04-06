# Lyrics Writer

A clean, modern web tool for writing music lyrics with real-time phonetic transcription and intelligent rhyme detection.

![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-green)
![Offline](https://img.shields.io/badge/Works-Offline-blue)

## Features

- **IPA Phonetic Transcription** — Each line is transcribed in real-time using the International Phonetic Alphabet, with support for English, French, Spanish, Italian, and Latin.
- **Rhyme Detection** — Automatically detects and color-codes rhyming lines based on phonetic endings, even across different languages.
- **Syllable Counting** — Displays syllable counts per line with language-specific rules (e.g., French _e muet_ handling).
- **Drag & Drop Reordering** — Rearrange lyric lines freely.
- **Undo / Redo** — Full history with `Ctrl+Z` / `Ctrl+Shift+Z` support.
- **Auto-Save** — All work is persisted to browser LocalStorage.
- **Multi-line Paste** — Pasting multiple lines automatically splits them into separate inputs.

## Getting Started

No build step, no dependencies. Just open `index.html` in a browser.

## Project Structure

```
├── index.html          Main page
├── css/style.css       Styling
├── js/
│   ├── app.js          App logic, state, undo/redo
│   ├── line.js         Line UI, drag-and-drop
│   ├── ipa.js          IPA conversion for 5 languages
│   ├── rhyme.js        Rhyme detection algorithm
│   └── languages.js    Language definitions
└── logo/
    └── LyricsWriter.svg
```

## How It Works

All processing happens client-side with zero network requests:

1. Text input is converted to IPA using built-in dictionaries and rule-based converters.
2. A union-find algorithm groups lines by matching phonetic endings.
3. Each rhyme group is assigned a distinct color.

## License

MIT
