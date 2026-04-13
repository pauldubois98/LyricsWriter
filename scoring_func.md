                                                                                                                       
● How the current meaning score is built         
                                                                                                                       
  Full mode (after running the build script)                                                                           
                                                                                                                       
  1. Source: FastText vectors trained on Wikipedia — a formal, encyclopedic corpus                                     
  2. Dimension reduction: 300d → 50d via PCA (retains ~60–70% of variance)
  3. Quantisation: float32 → int8 (unit-normalised, scaled to ±127)                                                    
  4. Lyrics vector: simple mean of all word vectors from the other lines                                               
  5. Score: cosine similarity between each candidate and the lyrics vector, clamped to [0, 1]                          
                                                                                                                       
  Basic/fallback mode                                                                                                  
                                                                                                                       
  Binary: 1 if the word's pre-defined category appears anywhere in the lyrics, 0 otherwise.                            
  
  ---                                                                                                                  
  Why it's unsatisfying                                     
                                                                                                                       
  Wrong training corpus. FastText-Wikipedia clusters words by encyclopedic topic. In that space lune is near astre,
  orbite, planète — astronomically correct, but poetically useless. In a lyrics space lune should be near nuit, rêve,  
  désir, soupir.
                                                                                                                       
  Mean vector is diluted. Every word in every line is averaged equally — including filler words like the, dans, que.   
  Their vectors pull the centroid toward the origin, weakening the signal.
                                                                                                                       
  50d is too coarse. After PCA the angular distances between semantically close words often collapse below the int8    
  resolution (~0.008 rad), making them indistinguishable from noise.
                                                                                                                       
  Single static vector per word. "Light" in light of the moon and a light heart get the same vector. The model has no  
  sense of which meaning is active in the lyrics.
                                                                                                                       
  ---                                                       
  A better design
                 
  1 — Train on a lyrics corpus (biggest gain)
                                                                                                                       
  Swap Wikipedia for a lyrics/poetry corpus. The build script could pull from:                                         
  - Project Gutenberg poetry — free, public domain                                                                     
  - Genius API (via lyricsgenius Python library) — modern lyrics, all languages                                        
                                                            
  # sketch — replace wiki.fr.vec with lyrics-trained vectors                                                           
  import fasttext                                                                                                      
  model = fasttext.train_unsupervised(                                                                                 
      'corpus_fr_lyrics.txt',                                                                                          
      model='skipgram',                                                                                                
      dim=100,                                                                                                         
      minCount=5,
      epoch=10,                                                                                                        
  )                                                         

  In a lyrics-trained space lune would naturally be close to nuit, rêve, larme, silence.                               
  
  2 — Content-word filtering for the lyrics vector                                                                     
                                                            
  Ignore function words when computing the mean:

  # build script: tag each word with its POS and only store content words                                              
  # (nouns, verbs, adjectives, adverbs)                                                                                
  import spacy                                                                                                         
  nlp = spacy.load('fr_core_news_sm')                                                                                  
  CONTENT_POS = {'NOUN', 'VERB', 'ADJ', 'ADV'}                                                                         
                                                                                                                       
  In JS, before averaging:                                                                                             
  // only words that are in the top-X% least-frequent words                                                            
  // (frequency rank stored alongside the vector)           
  if (data.freqRank[i] < CONTENT_WORD_THRESHOLD) continue;                                                             
                                                          
  Adding a frequency rank column (1 byte per word) in the data file costs just 100 KB.                                 
                                                                                                                       
  3 — TF-IDF weighted mean instead of simple mean                                                                      
                                                                                                                       
  Rare words in the lyrics carry more meaning than common ones:                                                        
                                                            
  // weight each lyrics word by inverse-document-frequency                                                             
  // idf[word] stored in data file as a uint8 (log-scaled, 256 bins)
  sum[i] += vec[i] * idf(tok);                                                                                         
                                                                                                                       
  The idf table (1 byte per word × 100k words = 100 KB) is negligible.                                                 
                                                                                                                       
  4 — Keep 100d instead of 50d                                                                                         
                                                            
  50d loses too much resolution after int8 quantisation. 100d doubles the file size (18 MB vs 9 MB per language) but   
  the angular discrimination between semantically close words improves dramatically. Still loads in < 1 s.
                                                                                                                       
  5 — Score relative to all lyrics lines, not just the mean                                                            
  
  Instead of one global centroid, score the candidate against each line individually and take the max:                 
                                                            
  // current: one centroid → cosine                                                                                    
  // proposed: max over per-line cosines                                                                               
  let semRaw = 0;
  for (const lineVec of lyricsLineVecs) {                                                                              
    semRaw = Math.max(semRaw, cosineSim(lineVec, candidateVec));
  }                                                                                                                    
                                                            
  This avoids the centroid-collapse problem: a word that's very close to one line (even if unrelated to the others)    
  scores high, which is exactly what you want when looking for a word to follow a specific line.
                                                                                                                       
  ---                                                       
  Recommended priority order

  ┌───────────────────────────┬─────────────────────────────────────────┬────────────────────────────────────┐
  │          Change           │                 Effort                  │               Impact               │
  ├───────────────────────────┼─────────────────────────────────────────┼────────────────────────────────────┤         
  │ Content-word filtering    │ small (JS only)                         │ medium — immediately removes noise │
  ├───────────────────────────┼─────────────────────────────────────────┼────────────────────────────────────┤         
  │ 100d instead of 50d       │ small (rebuild data)                    │ medium — better resolution         │         
  ├───────────────────────────┼─────────────────────────────────────────┼────────────────────────────────────┤         
  │ Max-over-lines scoring    │ small (JS only)                         │ medium — avoids centroid collapse  │         
  ├───────────────────────────┼─────────────────────────────────────────┼────────────────────────────────────┤         
  │ Lyrics-trained embeddings │ large (need corpus + training)          │ high — fixes the root cause        │
  ├───────────────────────────┼─────────────────────────────────────────┼────────────────────────────────────┤         
  │ TF-IDF weighting          │ medium (add idf column to build script) │ medium                             │
  └───────────────────────────┴─────────────────────────────────────────┴────────────────────────────────────┘     