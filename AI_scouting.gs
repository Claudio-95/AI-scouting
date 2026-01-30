// CONFIG & CONSTANTS

const SHEET_ACCELERATORS = 'accelerators';
const SHEET_STARTUPS = 'startups';

const USER_AGENT = 'Mozilla/5.0 (AI Scouting Bot)';
const REQUEST_TIMEOUT_MS = 20000;
const BATCH_SIZE = 10;

// MENU SETUP

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Startup Scouting AI')
    .addItem('1. Scouting accelerators', 'scoutAccelerators')
    .addItem('2. Aggiorna startups dagli acceleratori', 'updateStartupsFromAccelerators')
    .addItem('3. Genera value proposition mancanti', 'generateMissingValuePropositions')
    .addToUi();
}

// UTILITIES

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function normalizeUrl(url) {
  if (!url) return null;

  try {
    url = url.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const match = url.match(/^https?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    if (!match) return null;

    const hostname = match[1].toLowerCase();

    return 'https://' + hostname;
  } catch (e) {
    Logger.log('normalizeUrl error: ' + e);
    return null;
  }
}

function normalizeWebsite(url) {
  if (!url) return null;
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

function sheetToMap(sheet, keyColumn) {
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const keyIndex = headers.indexOf(keyColumn);
  const map = {};

  values.forEach(row => {
    const key = row[keyIndex];
    if (key) map[key] = row;
  });

  return { headers, map };
}

function fetchWebsiteContext(url) {
  const res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  const html = res.getContentText();

  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [,''])[1];
  const meta = (html.match(/<meta name="description" content="([^"]+)"/i) || [,''])[1];
  const h1 = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [,''])[1];

  return [title, meta, h1].filter(Boolean).join(' | ');
}

function generateValuePropositionLLM(startupName, context) {
  const systemPrompt = `
You generate concise startup value propositions.
Follow instructions strictly.
`;

  const userPrompt = `
Startup name: ${startupName}
Website context: ${context}

Generate ONE sentence following exactly this schema:

"Startup <X> helps <Target Y> do <What W> so that <Benefit Z>."

Rules:
- single sentence
- concrete, factual
- no buzzwords
- no emojis
- no extra text
`;

  const result = callLLM(systemPrompt, userPrompt);

  return result.replace(/\n/g, ' ').trim();
}

// LLM WRAPPER

function callLLM(systemPrompt, userPrompt) {
  const token = PropertiesService.getScriptProperties().getProperty('OPENROUTER_TOKEN');

  if (!token) {
    Logger.log('Missing OPENROUTER_TOKEN');
    return null;
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const payload = {
    model: PropertiesService.getScriptProperties().getProperty('LLM_MODEL'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 3000  // OpenRouter free plan limitation
  };

  let res;
  try {
    res = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('OpenRouter fetch error: ' + e.message);
    return null;
  }

  const status = res.getResponseCode();
  const text = res.getContentText();

  if (status !== 200) {
    Logger.log(`OpenRouter error ${status}: ${text}`);
    return null;
  }

  let json;
  try {
    json = JSON.parse(text);
    const output = json?.choices?.[0]?.message?.content?.trim();
    if (!output) {
      Logger.log('No text found in LLM response');
      return null;
    }

    return output;
  } catch (e) {
    Logger.log('Invalid JSON from OpenRouter: ' + text);
    return null;
  }

}


// SCOUT ACCELERATORS

function scoutAccelerators() {
  const sheet = getSheet(SHEET_ACCELERATORS);
  const { map } = sheetToMap(sheet, 'website');

  const systemPrompt = `
You are a data extraction assistant.
Return ONLY valid JSON.
No explanations. No markdown.
`;

  const userPrompt = `
List ${BATCH_SIZE} well-known European startup accelerators.

For each accelerator return:
- website
- name
- country

Rules:
- Europe only
- website must be the official homepage
- output must be a JSON array
- no comments

Example:
[
  {"website":"https://example.com","name":"Example","country":"Germany"}
]
`;

  let raw;
  try {
    raw = callLLM(systemPrompt, userPrompt);
  } catch (e) {
    Logger.log(e.message);
    return;
  }

  if (!raw) {
    Logger.log('No LLM response');
    return;
  }

  let accelerators;
  try {
    // Extract first JSON array from text
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      Logger.log('No JSON array found');
      return;
    }
    accelerators = JSON.parse(match[0]);
  } catch (e) {
    Logger.log('Invalid JSON from LLM: ' + raw + '. Error: ' + e);
    return;
  }

  if (!Array.isArray(accelerators)) {
    Logger.log('Accelerators is not an array');
    return;
  }

  accelerators.forEach(acc => {
    try {
      const website = normalizeUrl(acc.website);
      if (!website || map[website]) return;

      sheet.appendRow([
        website,
        acc.name || '',
        acc.country || ''
      ]);

      map[website] = true;
      Logger.log('Added accelerator: ' + website);
    } catch (e) {
      Logger.log('Invalid accelerator from LLM: ' + acc + '. Error: ' + e);
      return;
    }
  });
}

// UPDATE STARTUPS

function updateStartupsFromAccelerators() {
  const accSheet = getSheet(SHEET_ACCELERATORS);
  const stSheet = getSheet(SHEET_STARTUPS);

  const startupsMap = sheetToMap(stSheet, 'website');
  const accData = accSheet.getDataRange().getValues();
  const headers = accData.shift();

  accData.forEach(row => {
    try {
      const accWebsite = row[headers.indexOf('website')];
      const startups = fetchStartupsForAccelerator(accWebsite);
      startups.forEach(st => {
        const key = normalizeWebsite(st.website);
        if (!Object.prototype.hasOwnProperty.call(startupsMap, key)) {  // safer than !startupsMap[key]
          stSheet.appendRow([
            st.website,
            st.name,
            st.country || '',
            accWebsite,
            st.value_proposition|| ''
          ]);
        }
      });
    } catch (e) {
      Logger.log('Failed accelerator: ' + accWebsite + '. Error: ' + e);
    }
  });
}

function fetchStartupsForAccelerator(acceleratorWebsite) {
  const systemPrompt = `
You extract structured startup data.
Return ONLY valid JSON.
No explanations. No markdown.
`;

  const userPrompt = `
An accelerator has this website:
${acceleratorWebsite}

List startups accelerated by this accelerator (portfolio, alumni, batches).

For each startup return:
- website
- name
- country (if known, otherwise empty string)
- a value proposition outlining the benefits the company promises to deliver to its customers, explaining why they should choose its product or service over competitors.

Rules:
- output JSON array only
- no duplicates
- websites must be official startup homepages

Example:
[
  {"website":"https://startup.com","name":"Startup","country":"France"}
]
`;

  const raw = callLLM(systemPrompt, userPrompt);

  try {
    const data = JSON.parse(raw);
    Logger.log('Startups found');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    Logger.log('Invalid JSON from LLM (startups)' + raw + '. Error: ' + e);
    return [];
  }
}

// GENERATE VALUE PROPOSITIONS

function generateMissingValuePropositions() {
  const sheet = getSheet(SHEET_STARTUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const idxWebsite = headers.indexOf('website');
  const idxVP = headers.indexOf('value_proposition');
  const idxName = headers.indexOf('name');

  data.forEach((row, i) => {
    if (!row[idxVP]) {
      try {
        const site = row[idxWebsite];
        const name = row[idxName];
        const context = fetchWebsiteContext(site);
        const vp = generateValuePropositionLLM(name, context);

        sheet.getRange(i + 2, idxVP + 1).setValue(vp);
      } catch (e) {
        console.warn('VP failed for row', i + 2, e);
      }
    }
  });
}
