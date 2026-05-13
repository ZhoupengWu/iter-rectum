# iter-rectum
A game that fights cyberbullying on the Internet by challenging players to choose the right path

## Animazione della Camminata

Il movimento dei personaggi si basa su principi matematici di oscillazione per simulare una camminata naturale. Ecco i componenti principali del sistema di animazione:

### Concetti Chiave

1. **`phase` (Progressione Temporale):**
   - Rappresenta lo scorrere del tempo. Viene incrementata ad ogni frame (es. `phase += 0.1`).
   - **Effetto:** Modificando l'incremento si cambia la velocità della camminata. Un valore più alto rende i passi più rapidi.

2. **`amplitude` (Ampiezza del Movimento):**
   - Determina quanto braccia e gambe si allontanano dall'asse centrale del corpo.
   - **Effetto:** Un'ampiezza maggiore crea passi più lunghi e movimenti delle braccia più vistosi.

3. **Trigonometria (`Math.sin`):**
   - Utilizziamo la funzione seno per creare un'oscillazione fluida avanti e indietro. Il seno produce un valore che oscilla tra -1 e 1, garantendo che il movimento acceleri al centro e rallenti alle estremità, proprio come un pendolo reale.

4. **Sincronizzazione e Opposizione:**
   - Per ottenere una camminata realistica, le gambe si muovono in opposizione di fase. Questo si ottiene aggiungendo `Math.PI` (180 gradi) all'input della funzione seno per una delle due gambe.
   - Le braccia sono coordinate per bilanciare il movimento: quando la gamba sinistra avanza, il braccio sinistro oscilla all'indietro.

### Esperimenti e Modifiche

| Parametro | Modifica | Risultato |
| :--- | :--- | :--- |
| **Velocità** | Aumenta l'incremento di `phase` | L'omino corre o cammina molto velocemente. |
| **Passo** | Aumenta `amplitude` | L'omino fa passi molto ampi (quasi una spaccata). |
| **Stile** | Rimuovi `Math.PI` | L'omino salta a piedi uniti (stile canguro). |
