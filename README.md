# Startup Scouting AI – Google Sheets Prototype

## Google Sheet

➡️ **Link allo Sheet:**  
[https://docs.google.com/spreadsheets/d/1dMccOStgRLUz2Ui56ap5VKwFxsYAtCTR9ovkwDuJsdQ/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1dMccOStgRLUz2Ui56ap5VKwFxsYAtCTR9ovkwDuJsdQ/edit?usp=sharing)

Il file contiene due schede:
- `accelerators`
- `startups`

---

## Setup

### 1. Struttura del Google Sheet
Creare un nuovo Google Sheet. Inserire le due tabelle `accelerators` e `startups`.

#### Tab: `accelerators`
Inserire nella prima riga come intestazioni delle colonne:
- `website`
- `name`
- `country`

#### Tab: `startups`
Inserire nella prima riga come intestazioni delle colonne:
- `website`
- `name`
- `country`
- `accelerator`
- `value_proposition`

---

### 2. Apps Script

1. Aprire il Google Sheet
2. Andare su **Extensions → Apps Script**
3. Incollare il codice del progetto
4. Salvare il progetto

---

### 3. Configurazione API Key (LLM)

1. In Apps Script aprire **Project Settings**  
2. Aggiungere le seguenti **Script Properties**:

| Key | Value |
|-----|-------|
| `LLM_MODEL` | `google/gemini-3-flash-preview` |
| `OPENROUTER_TOKEN` | `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` |

OpenRouter è stato scelto tra gli altri provider LLM perché concede un piano gratuito che contiene il modello Gemini di Google, il quale è stato considerato come buon compromesso tra prestazioni e gratuità.

---

## Utilizzo

Dopo aver ricaricato il foglio, dovrebbe comparire la seguente opzione come ultima nella barra degli strumenti:

**Startup Scouting AI**

---

## Assunzioni e Limiti del Prototipo

- Il sistema è pensato come **tool di scouting**, non come crawler completo;
- Il parsing HTML è leggero e può non trovare nulla su siti complessi;
- Il parsing nel processo dei dati può fallire e dipende dalla correttezza dell'output generato dall'LLM;
- Le informazioni generate dall’LLM sono **best-effort**;
- Batch ridotti per rispettare i limiti di esecuzione di Apps Script;
- Nessun retry automatico;
- `website` è assunto come identificatore univoco affidabile.

---

## Note Finali

Il prototipo privilegia:
- semplicità
- robustezza
- spiegabilità delle scelte tecniche

È progettato per essere facilmente estendibile verso:
- pipeline più strutturate
- normalizzazione dei dati
- revisione manuale dei risultati
