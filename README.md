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

## Animazione del Prato Infinito

Il gioco utilizza una tecnica di "scorrimento infinito" (parallax semplificato) per simulare il movimento del personaggio attraverso un campo.

### Componenti Tecnici

1. **Il "Tile" del Prato (`grassTile`):**
   - Viene creato un canvas "offscreen" (non visibile direttamente) della stessa dimensione del canvas principale.
   - La funzione `setupGrassTile()` riempie questo tile con un colore di sfondo verde e disegna casualmente dei ciuffi d'erba.
   - **Seamless Loop:** Per evitare uno stacco visibile quando l'immagine ricomincia, i ciuffi d'erba disegnati vicino al bordo destro vengono replicati sul bordo sinistro (e viceversa).

2. **Offset di Scorrimento (`scrollX`):**
   - La variabile `scrollX` tiene traccia della posizione orizzontale del background.
   - Ad ogni frame, viene decrementata: `scrollX -= 2`. Il valore `2` rappresenta la **velocità di camminata**.

3. **Il Meccanismo di Rendering:**
   - Nella funzione `renderBackground()`, il `grassTile` viene disegnato due volte:
     - La prima copia alla posizione `scrollX`.
     - La seconda copia alla posizione `scrollX + grassTile.width`.
   - Quando `scrollX` diventa minore o uguale alla larghezza negativa del tile (`-grassTile.width`), viene resettato a `0`. Questo crea un ciclo continuo senza interruzioni percepibili.

### Variabili e Modifiche

| Variabile | Funzione | Effetto della Modifica |
| :--- | :--- | :--- |
| **Velocità** (`scrollX -= 2`) | Determina quanto velocemente si muove il terreno. | Aumentando il valore (es. `scrollX -= 5`), l'omino sembrerà correre molto più velocemente. |
| **Densità Erba** (ciclo `for` in `setupGrassTile`) | Numero di ciuffi d'erba generati. | Aumentando il numero di iterazioni (es. da 200 a 500), il prato sembrerà più folto. |
| **Direzione** (`scrollX -= 2`) | Il segno meno indica il movimento verso sinistra. | Cambiando in `scrollX += 2`, il prato si muoverà verso destra, facendo sembrare che l'omino cammini all'indietro. |
