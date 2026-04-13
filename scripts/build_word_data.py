#!/usr/bin/env python3
"""
LyricsMaker — build word data for rhyme suggestions.

For each language:
  1. Streams the first N words from a FastText Wikipedia word-vector file
     (partial download — avoids pulling the full 2-4 GB).
  2. Filters out stopwords, punctuation, proper nouns, and very short words.
  3. Computes IPA using phonemizer + espeak-ng.
  4. Reduces embeddings 300 → EMBED_DIM with PCA.
  5. Unit-normalises and quantises to int8.
  6. Writes  data/words_{lang}.js  (≈ 1-2 MB each).

Requirements
  pip install phonemizer numpy scikit-learn requests
  # Ubuntu / Debian:
  sudo apt install espeak-ng
  # macOS:
  brew install espeak-ng

Usage
  python scripts/build_word_data.py [en fr es it la]
  (no args = all languages)
"""

import sys
import re
import json
import base64
import pathlib
import requests
import numpy as np
from sklearn.decomposition import PCA

# ── paths ──────────────────────────────────────────────────────────────────
ROOT     = pathlib.Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

# ── config ─────────────────────────────────────────────────────────────────
N_STREAM   = 130_000  # words to read from vec file (most-frequent words come first)
N_KEEP     = 100_000  # words to keep after filtering
EMBED_DIM  = 50       # final dimensions after PCA
MIN_LEN    = 3
MAX_LEN    = 20
PHONEMIZER_BATCH = 2_000   # larger batches → fewer espeak subprocess spawns
PHONEMIZER_JOBS  = 4       # parallel espeak workers

LANGUAGES = {
    "en": {
        "phonemizer_lang": "en-us",
        "vec_url": "https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.en.vec",
        "stopwords": {
            "the","a","an","and","or","but","in","on","at","to","for","of","with",
            "by","from","as","is","was","are","were","be","been","have","has","had",
            "do","does","did","will","would","could","should","may","might","shall",
            "can","not","no","so","if","then","than","that","this","these","those",
            "its","it","he","she","they","we","you","i","me","my","him","his","her",
            "us","our","their","who","which","what","how","when","where","why",
            "all","more","also","just","very","even","only","still","into","about",
            "up","out","over","after","before","between","through","during","while",
            "though","although","because","since","until","unless","whether","both",
            "each","other","such","same","next","last","much","many","some","any",
            "most","few","own","without","within","along","across","against","among",
            "around","behind","below","beyond","down","near","off","past","under",
            "upon","above","too","here","there","now","then","already","always",
            "never","often","well","must","lot","use","get","got","put","set","let",
        },
    },
    "fr": {
        "phonemizer_lang": "fr-fr",
        "vec_url": "https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.fr.vec",
        "stopwords": {
            "le","la","les","de","du","des","un","une","au","aux","et","en","il",
            "elle","ils","elles","nous","vous","on","que","qui","dans","par","pour",
            "sur","avec","se","si","ne","pas","plus","tout","bien","mais","ou",
            "donc","or","ni","car","ce","cet","cette","ces","son","sa","ses","mon",
            "ma","mes","ton","ta","tes","leur","leurs","dont","même","très","aussi",
            "comme","quand","puis","alors","après","avant","sans","sous","entre",
            "vers","chez","lors","selon","pendant","depuis","fait","faire","être",
            "avoir","aller","venir","dire","voir","pouvoir","vouloir","savoir",
            "prendre","donner","trouver","falloir","mettre","rendre","tenir",
            "partir","suivre","croire","rester","penser","sembler","porter","laisser",
            "peu","plus","moins","beaucoup","trop","assez","si","y","dont",
        },
    },
    "es": {
        "phonemizer_lang": "es",
        "vec_url": "https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.es.vec",
        "stopwords": {
            "el","la","los","las","de","del","un","una","unos","unas","y","en",
            "a","que","por","con","se","su","para","es","son","al","lo","no",
            "le","me","si","mi","más","pero","como","yo","él","ella","nos","vos",
            "todo","bien","está","muy","ya","así","también","aunque","cuando",
            "donde","mientras","porque","hasta","desde","sin","sobre","entre",
            "bajo","ante","tras","hacia","mediante","ser","estar","tener","hacer",
            "poder","querer","saber","ir","ver","dar","decir","encontrar","venir",
            "poner","querer","llegar","pasar","deber","parecer","quedar",
        },
    },
    "it": {
        "phonemizer_lang": "it",
        "vec_url": "https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.it.vec",
        "stopwords": {
            "il","lo","la","i","gli","le","di","a","da","in","con","su","per",
            "tra","fra","un","uno","una","e","è","non","che","si","del","della",
            "dei","delle","al","ai","agli","alle","dal","dalla","dai","dalle",
            "nel","nella","nei","nelle","sul","sulla","sui","sulle","qui","lì",
            "là","mi","ti","ci","vi","ne","lo","li","lui","lei","noi","voi","loro",
            "questo","quello","questi","quelli","questa","quella","essere","avere",
            "fare","dire","andare","dare","stare","venire","sapere","volere",
            "potere","dovere","vedere","più","molto","anche","così","già","poi",
            "però","quando","come","dove","perché","se","ma","ma","o","né",
        },
    },
    "la": {
        "phonemizer_lang": None,   # no espeak support for Latin — IPA via JS later
        "vec_url": None,           # no FastText Latin vec file available
        "stopwords": set(),
    },
}

# Allow letters (including accented) but no digits or punctuation
WORD_RE = re.compile(r"^[a-zA-ZÀ-ÖØ-öø-ÿœŒ\u0100-\u024F]+$")


# ── helpers ────────────────────────────────────────────────────────────────

def stream_vec(url, n_words):
    """
    Stream the first n_words content lines from a plain-text FastText .vec file.
    The first line is the header ("vocab_size dim"); subsequent lines are:
        word  f1 f2 ... fN
    Returns (words, matrix) where matrix is float32, shape (n_words, dim).
    """
    print(f"  Streaming ≤{n_words} words from {url}")
    words, rows = [], []
    dim = None
    buf = b""

    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        for chunk in r.iter_content(chunk_size=131072):
            buf += chunk
            parts = buf.split(b"\n")
            buf = parts[-1]

            for raw in parts[:-1]:
                line = raw.decode("utf-8", errors="replace").rstrip()
                if not line:
                    continue
                fields = line.split(" ")
                if dim is None:
                    # header line
                    try:
                        dim = int(fields[1])
                    except (IndexError, ValueError):
                        pass
                    continue
                if len(fields) != dim + 1:
                    continue
                try:
                    vec = [float(x) for x in fields[1:]]
                except ValueError:
                    continue
                words.append(fields[0])
                rows.append(vec)
                if len(words) >= n_words:
                    return words, np.array(rows, dtype=np.float32), dim

    return words, np.array(rows, dtype=np.float32), dim


def filter_words(words, vecs, stopwords):
    keep = []
    for i, w in enumerate(words):
        if not WORD_RE.match(w):
            continue
        wl = w.lower()
        if wl in stopwords:
            continue
        if len(w) < MIN_LEN or len(w) > MAX_LEN:
            continue
        # Skip capitalised words (likely proper nouns in Wikipedia text)
        if w[0].isupper():
            continue
        keep.append(i)
    return [words[i] for i in keep], vecs[keep]


def reduce_dims(vecs, n_components):
    if vecs.shape[1] <= n_components:
        return vecs
    print(f"  PCA {vecs.shape[1]}d → {n_components}d …")
    pca = PCA(n_components=n_components, random_state=0)
    return pca.fit_transform(vecs).astype(np.float32)


def compute_ipa(words, ph_lang):
    """Batch IPA via phonemizer / espeak-ng."""
    from phonemizer import phonemize
    print(f"  Computing IPA for {len(words)} words (lang={ph_lang}, "
          f"batch={PHONEMIZER_BATCH}, jobs={PHONEMIZER_JOBS}) …")
    ipa_all = []
    for start in range(0, len(words), PHONEMIZER_BATCH):
        batch = words[start : start + PHONEMIZER_BATCH]
        result = phonemize(
            batch,
            language=ph_lang,
            backend="espeak",
            with_stress=True,
            language_switch="remove-flags",
            preserve_punctuation=False,
            njobs=PHONEMIZER_JOBS,
        )
        chunk = result if isinstance(result, list) else [result]
        ipa_all.extend(s.strip() for s in chunk)
        done = min(start + PHONEMIZER_BATCH, len(words))
        print(f"    {done}/{len(words)}", end="\r", flush=True)
    print()
    return ipa_all


def quantise_int8(vecs):
    """Unit-normalise each row then scale to [-127, 127] int8."""
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    unit = vecs / norms
    q = np.clip(np.round(unit * 127), -127, 127).astype(np.int8)
    return q


def write_js(lang, words, ipa_list, q_vecs, dim):
    out = DATA_DIR / f"words_{lang}.js"

    # Pack int8 matrix → base64
    raw_bytes = q_vecs.tobytes()           # already int8, row-major
    b64 = base64.b64encode(raw_bytes).decode("ascii")

    words_json = json.dumps(words, ensure_ascii=False)
    ipa_json   = json.dumps(ipa_list, ensure_ascii=False)

    # The int8 blob is decoded with a signed-byte trick in the browser:
    #   charCodeAt gives 0-255; << 24 >> 24 sign-extends to int8 range.
    js = (
        f"// Auto-generated by scripts/build_word_data.py — do not edit.\n"
        f"// {len(words)} words · {dim}d int8 embeddings · language: {lang}\n"
        f"const WORD_DATA_{lang.upper()} = (() => {{\n"
        f"  const words = {words_json};\n"
        f"  const ipa   = {ipa_json};\n"
        f"  const dim   = {dim};\n"
        f"  const _b64  = '{b64}';\n"
        f"  const _raw  = atob(_b64);\n"
        f"  const vecs  = new Int8Array(_raw.length);\n"
        f"  for (let i = 0; i < _raw.length; i++) "
        f"vecs[i] = _raw.charCodeAt(i) << 24 >> 24;\n"
        f"  return {{ words, ipa, dim, vecs }};\n"
        f"}})();\n"
    )
    out.write_text(js, encoding="utf-8")
    size_kb = out.stat().st_size // 1024
    print(f"  ✓ {out}  ({size_kb} KB, {len(words)} words)")


# ── main ───────────────────────────────────────────────────────────────────

def build(lang):
    cfg = LANGUAGES[lang]
    print(f"\n{'='*50}\nBuilding: {lang.upper()}\n{'='*50}")

    if cfg["vec_url"] is None:
        print("  No FastText model available for this language — skipping.")
        return
    if cfg["phonemizer_lang"] is None:
        print("  No phonemizer support for this language — skipping.")
        return

    # 1. Stream vectors
    words_raw, vecs_raw, src_dim = stream_vec(cfg["vec_url"], N_STREAM)
    print(f"  Streamed {len(words_raw)} words, dim={src_dim}")

    # 2. Filter
    words_f, vecs_f = filter_words(words_raw, vecs_raw, cfg["stopwords"])
    words_f = words_f[:N_KEEP]
    vecs_f  = vecs_f[:N_KEEP]
    print(f"  After filtering: {len(words_f)} words")

    # 3. PCA
    vecs_r = reduce_dims(vecs_f, EMBED_DIM)

    # 4. IPA
    ipa = compute_ipa(words_f, cfg["phonemizer_lang"])
    # Trim list to match words (phonemizer may skip)
    ipa = (ipa + [""] * len(words_f))[:len(words_f)]

    # 5. Quantise
    q = quantise_int8(vecs_r)

    # 6. Write JS
    write_js(lang, words_f, ipa, q, EMBED_DIM)


if __name__ == "__main__":
    targets = sys.argv[1:] or [lg for lg in LANGUAGES if LANGUAGES[lg]["vec_url"]]
    for lang in targets:
        if lang not in LANGUAGES:
            print(f"Unknown language '{lang}'. Choices: {list(LANGUAGES)}")
            sys.exit(1)
        build(lang)
    print("\n✓ All done. Generated files are in data/")
