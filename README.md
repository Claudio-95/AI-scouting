# Scouting AI

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
| `LLM_MODEL` | `google/gemma-3-27b-it:free` |
| `OPENROUTER_TOKEN` | `contenuto nell'email` |

OpenRouter è stato scelto tra gli altri provider LLM perché concede un piano gratuito che rende disponibili alcuni modelli gratuitamente. Il modello Gemma di Google è stato scelto come buon compromesso tra prestazioni e gratuità, altri modelli scalavano il limite di token a ogni utilizzo, pur rimanendo gratuiti.

---

## Utilizzo

Dopo aver ricaricato il foglio, dovrebbe comparire l'opzione **Startup Scouting AI** come ultima nella barra degli strumenti.

---

## Assunzioni e Limiti del Prototipo

- Il parsing HTML è leggero e può non trovare nulla su siti complessi;
- Il parsing nel processo dei dati può fallire e dipende dalla correttezza dell'output generato dall'LLM;
- Le informazioni generate dall’LLM sono **best-effort**;
- Batch ridotti per rispettare i limiti di esecuzione di Apps Script e del provider LLM;
- Nessun retry automatico;
- `website` è assunto come identificatore univoco affidabile.
