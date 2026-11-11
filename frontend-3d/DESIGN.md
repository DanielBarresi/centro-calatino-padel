# Design — Centro Calatino Padel (versione 3D)

Mondo: **notte al circolo sotto i fari**. Fondo blu-nero, il blu dell'erba sintetica, il giallo della pallina riservato a ciò che si può fare o si è scelto.

## Colori (`src/index.css`, `:root`)
| Token | Valore | Uso |
|---|---|---|
| `--bg` / `--bg-2` | #060a13 / #0a1120 | fondo pagina / fondo griglia |
| `--surface` → `--surface-3` | #0e1729 → #1b2a49 | celle, card, pillole (più chiaro = più in alto) |
| `--text` / `--muted` / `--faint` | #eef3ff / #9aaac6 / #6b7b98 | testo, secondario (7,4:1), solo dettagli non essenziali |
| `--court` / `--court-2` | #2563ff / #4d82ff | campo 3D, "Tuo", icone, hover |
| `--ball` | #d7ff3a | **solo** azione principale, selezione, nav attiva, maggiorazione |
| `--danger` / `--ok` | #ff6b6b / #3ddc97 | annullamento, penale / conferma |

## Tipografia
- **Barlow Condensed 700**, maiuscolo: titoli, numeri dei giorni, orari, prezzi (sempre `tabular-nums`).
- **Barlow 400–600**: testo e interfaccia.
- Titolo hero fino a 6rem, interlinea 0,86.

## Forme
Pillole (`999px`) per nav, bottoni, chip; raggi 10/16/24px per celle, card e griglia. Bordi a linea sottile (`--line` 9%, `--line-2` 16%) come le righe del campo.

## Componenti
- **Cella slot**: libera (bordo + prezzo), selezionata (riempimento giallo con pallina), tua (blu pieno), occupata (righe diagonali), passata (vuota).
- **Sheet**: riepilogo fisso in basso (portal su `<body>`), vetro scuro solo perché scorre sopra la griglia.
- **Ticket**: prenotazione con blocco data a sinistra, blu se attiva.

## Movimento
- **Momento firma**: la pallina cade sullo slot scelto, rimbalza e lo colora (clip-path dal punto d'impatto).
- Campo 3D: palleggio continuo, camera che orbita piano e segue il mouse; si ferma fuori schermo.
- Continuità: pillola nav e pillola giorno che scivolano (`layoutId`), ticket che passa da "Attive" a "Annullate".
- Feedback: prezzo che scorre nel riepilogo, segno di spunta disegnato, onda sullo slot appena prenotato, lampeggio rosso se un altro socio prende uno slot.
- Curva standard `cubic-bezier(.16, 1, .3, 1)`; rimbalzi solo per la pallina vera.
- `prefers-reduced-motion`: niente spostamenti, il campo 3D resta fermo, restano colori e dissolvenze.

## Immagini
- `public/img/padel-hero.png`: foto originale del progetto (racchetta e pallina su campo indoor), non modificata nel file; nella pagina "Le mie prenotazioni" è scurita con un gradiente CSS e zoomata lentamente via CSS.
- Il campo 3D è disegnato in codice (`src/components/CourtScene.tsx`), nessun asset esterno.
