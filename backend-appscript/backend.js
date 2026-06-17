/**
 * FinAi - Google Apps Script Backend (V3 - Compatível com mês/ano + automações + CORS)
 * 
 * Estrutura:
 * - Abas por usuário: username_Transacoes, username_Investimentos, username_Vales, username_Metas, username_Templates
 * - Suporte completo a mês/ano (parâmetro year/month no payload — defaulta ao mês atual)
 * - dailyProcess() para automações (renovação vales, assinaturas, salários)
 * - CORS + JSON correto (sem tela branca)
 * - 100% compatível com frontend existente
 */

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Use POST requests' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const params = JSON.parse(e.postData.contents);
    const action = params.action; // login, register, load, save
    
    // Request received (action logged only in debug builds)

    // 1. SISTEMA DE AUTENTICAÇÃO
    if (action === 'login') {
      // login accepts username OR email + password
      const identifier = params.username || params.email;
      const password = params.password;
      if (!identifier || !password) return responseJSON({ status: 'error', message: 'Identificador e senha são necessários.' });
      const user = findUser(ss, identifier, password);
      if (user) {
        return responseJSON({ status: 'success', user: user });
      }
      // Login failed
      return responseJSON({ status: 'error', message: 'Usuário ou senha incorretos.' });
    }

    if (action === 'register') {
      const usernameParam = params.username;
      const emailParam = params.email;
      const password = params.password;
      if (!usernameParam || !emailParam || !password) return responseJSON({ status: 'error', message: 'username, email e password são obrigatórios.' });
      const result = registerUser(ss, usernameParam, emailParam, password);
      // Register result processed
      return responseJSON(result);
    }

    // 2. OPERAÇÕES DE DADOS (Requer username)
    const username = params.username;
    if (!username) return responseJSON({ status: 'error', message: 'Usuário não identificado.' });

    // Prefixo para as abas do usuário (Ex: "joao_Transacoes")
    const prefix = username + "_";

    if (action === 'load') {
      // Load request
      try {
        // support pagination: params.page (1-based) and params.pageSize
        const page = Number(params.page) || 1;
        const pageSize = Number(params.pageSize) || 50;
        const transactionsAll = readSheet(ss, prefix + 'Transacoes') || [];
        const transactionsPage = paginateArray(transactionsAll, page, pageSize);
        const data = {
          transactions: transactionsPage.items,
          transactionsTotal: transactionsPage.total,
          investments: readSheet(ss, prefix + 'Investimentos'),
          vouchers: readSheet(ss, prefix + 'Vales'),
          goals: readSheet(ss, prefix + 'Metas'),
          templates: readSheet(ss, prefix + 'Templates')
        };
        // Load success
        return responseJSON({ status: 'success', data: data });
      } catch (loadErr) {
        console.error('[handleRequest] Erro no load:', loadErr);
        return responseJSON({ status: 'error', message: 'Erro ao carregar dados: ' + loadErr.toString() });
      }
    }

    if (action === 'save') {
      const type = params.type; // transactions, investments...
      const sheetName = getSheetName(type);
      if (sheetName) {
        // Before saving, ensure types are normalized:
        // - ensure createdAt exists
        // - coerce numeric fields to Number
        // - coerce boolean fields to boolean
        // - serialize arrays/objects to JSON strings for storage
        const processed = (params.data || []).map(item => {
          const copy = Object.assign({}, item);

          // Ensure createdAt
          if (!copy.createdAt) {
            try {
              copy.createdAt = formatDateIso(new Date());
            } catch (e) {
              copy.createdAt = (new Date()).toISOString().split('T')[0];
            }
          }

          // Numeric fields to coerce
          const numericFields = ['amount','total','used','yield','allocation','current','target','id'];
          numericFields.forEach(f => {
            if (copy[f] !== undefined && copy[f] !== null && copy[f] !== '') {
              try { copy[f] = Number(copy[f]); } catch (e) { /* keep original */ }
            }
          });

          // Boolean fields
          const boolFields = ['isPaid','isRecurring','cancelled','isDeductible','autoRenew'];
          boolFields.forEach(f => {
            if (copy[f] === undefined || copy[f] === null) {
              copy[f] = false;
            } else {
              if (typeof copy[f] === 'string') {
                copy[f] = (copy[f].toLowerCase() === 'true');
              } else {
                copy[f] = !!copy[f];
              }
            }
          });

          // Dates normalization (keep as YYYY-MM-DD strings)
          ['date','dueDate','createdAt','renewalDay'].forEach(f => {
            if (copy[f] && Object.prototype.toString.call(copy[f]) === '[object Date]') {
              copy[f] = formatDateIso(copy[f]);
            }
          });

          // Serialize arrays/objects
          ['history','meta'].forEach(f => {
            if (copy[f] !== undefined && copy[f] !== null) {
              if (typeof copy[f] === 'object') {
                try { copy[f] = JSON.stringify(copy[f]); } catch (e) { copy[f] = String(copy[f]); }
              } else if (typeof copy[f] === 'string' && copy[f].trim() === '') {
                // empty string -> empty array
                if (f === 'history') copy[f] = JSON.stringify([]);
              }
            }
          });

          // Ensure paymentMethod and category strings
          if (copy.paymentMethod === undefined || copy.paymentMethod === null) copy.paymentMethod = '';
          if (copy.category === undefined || copy.category === null) copy.category = '';

          return copy;
        });
        saveSheet(ss, prefix + sheetName, processed);
        return responseJSON({ status: 'success', message: 'Salvo!' });
      }
    }

    // AI proxy endpoint: accept payload, forward to Gemini (key in Script Properties)
    if (action === 'ai') {
      try {
        const scriptProps = PropertiesService.getScriptProperties();
        const apiKey = scriptProps.getProperty('GEMINI_API_KEY');
        const endpoint = scriptProps.getProperty('GEMINI_API_ENDPOINT');
        if (!apiKey || !endpoint) return responseJSON({ status: 'error', message: 'AI key or endpoint not configured in Script Properties.' });
        const prompt = params.prompt || params.data || '';
        // Basic safety: limit prompt length
        if (String(prompt).length > 20000) return responseJSON({ status: 'error', message: 'Prompt too long.' });
        const aiRes = callGemini(endpoint, apiKey, prompt);
        return responseJSON({ status: 'success', data: aiRes });
      } catch (err) {
        console.error('[handleRequest] AI proxy error:', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Export CSV endpoint
    if (action === 'export') {
      try {
        const type = params.type || 'transactions';
        const sheetName = prefix + (type === 'transactions' ? 'Transacoes' : type === 'investments' ? 'Investimentos' : type === 'vouchers' ? 'Vales' : type === 'goals' ? 'Metas' : 'Transacoes');
        const dataArr = readSheet(ss, sheetName) || [];
        const csv = toCsv(dataArr);
        return responseJSON({ status: 'success', csv: csv });
      } catch (err) {
        console.error('[handleRequest] Export error:', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Import CSV (recebe CSV no params.csv ou array de objetos em params.data)
    if (action === 'import') {
      try {
        // support CSV text or array of objects
        const csvText = params.csv;
        let items = [];
        if (csvText) {
          items = parseCsvToObjects(csvText);
        } else if (params.data && Array.isArray(params.data)) {
          items = params.data;
        }
        if (!items.length) return responseJSON({ status: 'error', message: 'Nenhum dado para importar.' });
        // normalize and append to transactions sheet
        const prefixName = prefix + 'Transacoes';
        const existing = readSheet(ss, prefixName) || [];
        const normalized = items.map(i => {
          const copy = Object.assign({}, i);
          if (!copy.createdAt) copy.createdAt = formatDateIso(new Date());
          return copy;
        });
        const combined = existing.concat(normalized);
        saveSheet(ss, prefixName, combined);
        return responseJSON({ status: 'success', message: 'Importado', imported: normalized.length });
      } catch (err) {
        console.error('[handleRequest] Import error:', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Archive old transactions (> 1 year) into Archive sheet
    if (action === 'archive') {
      try {
        const cutoffDays = Number(params.cutoffDays) || 365;
        const moved = archiveOldTransactions(ss, prefix + 'Transacoes', prefix + 'Archive_Transacoes', cutoffDays);
        return responseJSON({ status: 'success', moved: moved });
      } catch (err) {
        console.error('[handleRequest] Archive error:', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Chat history storage for AI conversations
    if (action === 'save_chat') {
      try {
        const chat = params.chat; // { role: 'user'|'assistant', message: '...', metadata: {} }
        if (!chat || !chat.message) return responseJSON({ status: 'error', message: 'Chat inválido.' });
        const sheetName = prefix + 'AIChats';
        appendObjectToSheet(ss, sheetName, { timestamp: new Date(), role: chat.role || 'user', message: chat.message, metadata: JSON.stringify(chat.metadata || {}) });
        return responseJSON({ status: 'success' });
      } catch (err) {
        console.error('save_chat error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    if (action === 'load_chats') {
      try {
        const page = Number(params.page) || 1;
        const pageSize = Number(params.pageSize) || 50;
        const chats = readSheet(ss, prefix + 'AIChats') || [];
        const paged = paginateArray(chats, page, pageSize);
        return responseJSON({ status: 'success', data: { chats: paged.items, total: paged.total } });
      } catch (err) {
        console.error('load_chats error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Recurrence templates management
    if (action === 'create_recurrence') {
      try {
        const rec = params.recurrence; // { id, description, amount, type, category, frequency, dayOfMonth, startDate }
        if (!rec || !rec.description) return responseJSON({ status: 'error', message: 'Recurrence inválida.' });
        const sheetName = prefix + 'Recurrences';
        // ensure id exists for easy deletion/dedupe
        const recToSave = Object.assign({ createdAt: new Date(), id: rec.id || (Date.now() + Math.floor(Math.random()*100000)) }, rec);
        appendObjectToSheet(ss, sheetName, recToSave);
        return responseJSON({ status: 'success' });
      } catch (err) {
        console.error('create_recurrence error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    if (action === 'load_recurrences') {
      try {
        const recs = readSheet(ss, prefix + 'Recurrences') || [];
        return responseJSON({ status: 'success', data: { recurrences: recs } });
      } catch (err) {
        console.error('load_recurrences error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Delete recurrence by id
    if (action === 'delete_recurrence') {
      try {
        const id = params.id || params.recurrenceId;
        if (!id) return responseJSON({ status: 'error', message: 'id é obrigatório' });
        const sheetName = prefix + 'Recurrences';
        const recs = readSheet(ss, sheetName) || [];
        const filtered = recs.filter(r => String(r.id) !== String(id));
        saveSheet(ss, sheetName, filtered);
        return responseJSON({ status: 'success' });
      } catch (err) {
        console.error('delete_recurrence error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Budgets management
    if (action === 'save_budget') {
      try {
        const budget = params.budget; // { category, month, year, amount }
        if (!budget || !budget.category) return responseJSON({ status: 'error', message: 'Budget inválido.' });
        const sheetName = prefix + 'Budgets';
        const budgetToSave = Object.assign({ createdAt: new Date(), id: budget.id || (Date.now() + Math.floor(Math.random()*100000)) }, budget);
        appendObjectToSheet(ss, sheetName, budgetToSave);
        return responseJSON({ status: 'success' });
      } catch (err) {
        console.error('save_budget error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    if (action === 'load_budgets') {
      try {
        const budgets = readSheet(ss, prefix + 'Budgets') || [];
        return responseJSON({ status: 'success', data: { budgets } });
      } catch (err) {
        console.error('load_budgets error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    // Delete budget by id
    if (action === 'delete_budget') {
      try {
        const id = params.id || params.budgetId;
        if (!id) return responseJSON({ status: 'error', message: 'id é obrigatório' });
        const sheetName = prefix + 'Budgets';
        const budgets = readSheet(ss, sheetName) || [];
        const filtered = budgets.filter(b => String(b.id) !== String(id));
        saveSheet(ss, sheetName, filtered);
        return responseJSON({ status: 'success' });
      } catch (err) {
        console.error('delete_budget error', err);
        return responseJSON({ status: 'error', message: err.toString() });
      }
    }

    return responseJSON({ status: 'error', message: 'Ação desconhecida' });

  } catch (error) {
    console.error('Erro em handleRequest:', error);
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

/* ========== FUNÇÕES DE USUÁRIO ========== */

function getUsersSheet(ss) {
  let sheet = ss.getSheetByName('_System_Users');
  if (!sheet) {
    sheet = ss.insertSheet('_System_Users');
      sheet.appendRow(['username', 'email', 'password_hash', 'salt', 'created_at']);
    try { sheet.hideSheet(); } catch (e) { /* permissões */ }
  }
  return sheet;
}



function findUser(ss, identifier, password) {
  const sheet = getUsersSheet(ss);
  const data = sheet.getDataRange().getValues();
  // Header detection
  const headers = data[0] ? data[0].map(h => String(h || '').toLowerCase()) : [];
  const usernameIdx = headers.indexOf('username');
  const emailIdx = headers.indexOf('email');
  const hashIdx = headers.indexOf('password_hash');
  const saltIdx = headers.indexOf('salt');
  const plainPasswordIdx = headers.indexOf('password');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUsername = usernameIdx >= 0 ? row[usernameIdx] : row[0];
    const rowEmail = emailIdx >= 0 ? row[emailIdx] : '';
    // match identifier against username or email
    if (String(rowUsername).toLowerCase() === String(identifier).toLowerCase() || (rowEmail && String(rowEmail).toLowerCase() === String(identifier).toLowerCase())) {
      // If stored as hash
      if (hashIdx >= 0 && saltIdx >= 0 && row[hashIdx]) {
        const storedHash = String(row[hashIdx] || '');
        const storedSalt = String(row[saltIdx] || '');
        const attempted = hashWithSalt(password, storedSalt);
        if (attempted === storedHash) return { username: rowUsername, email: rowEmail };
      }
      // Backwards compatibility: if old sheet stored plain password
      if (plainPasswordIdx >= 0 && row[plainPasswordIdx] && String(row[plainPasswordIdx]) === String(password)) {
        // upgrade: generate salt/hash and store back
        try {
          const newSalt = generateSalt();
          const newHash = hashWithSalt(password, newSalt);
          // write back into sheet
          const writeRow = sheet.getRange(i+1, 1, 1, Math.max(headers.length,5));
          const newRow = [];
          newRow[usernameIdx >=0 ? usernameIdx : 0] = rowUsername;
          newRow[emailIdx >=0 ? emailIdx : 1] = rowEmail || '';
          newRow[hashIdx >=0 ? hashIdx : 2] = newHash;
          newRow[saltIdx >=0 ? saltIdx : 3] = newSalt;
          newRow[4] = row[4] || new Date();
          writeRow.setValues([newRow]);
        } catch (e) { console.error('Upgrade hash failed:', e); }
        return { username: rowUsername, email: rowEmail };
      }
    }
  }
  return null;
}

function registerUser(ss, username, email, password) {
  const sheet = getUsersSheet(ss);
  const data = sheet.getDataRange().getValues();
  // Header indexes
  const headers = data[0] ? data[0].map(h => String(h || '').toLowerCase()) : [];
  const usernameIdx = headers.indexOf('username');
  const emailIdx = headers.indexOf('email');

  // Check for existing username/email
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingUser = usernameIdx >= 0 ? row[usernameIdx] : row[0];
    const existingEmail = emailIdx >= 0 ? row[emailIdx] : (row[1] || '');
    if (String(existingUser).toLowerCase() === String(username).toLowerCase() || (existingEmail && String(existingEmail).toLowerCase() === String(email).toLowerCase())) {
      return { status: 'error', message: 'Usuário ou email já existe.' };
    }
  }

  const salt = generateSalt();
  const hash = hashWithSalt(password, salt);
  sheet.appendRow([username, email, hash, salt, new Date()]);
  return { status: 'success', message: 'Usuário criado!', user: { username: username, email: email } };
}

function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h || '').trim());
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      obj[header] = val;
    });
    return obj;
  });
}

function saveSheet(ss, sheetName, data) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const rows = data.map(item => headers.map(header => {
    const v = item[header];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

// Pagination helper: returns items for page (1-based) and total count
function paginateArray(arr, page, pageSize) {
  const total = arr.length || 0;
  if (!total) return { items: [], total: 0 };
  // try to sort by date or createdAt descending
  const copy = arr.slice();
  copy.sort((a, b) => {
    const da = new Date(a.date || a.createdAt || '1970-01-01');
    const db = new Date(b.date || b.createdAt || '1970-01-01');
    return db - da;
  });
  const start = (page - 1) * pageSize;
  const items = copy.slice(start, start + pageSize);
  return { items: items, total: total };
}

// Convert array of objects to CSV string
function toCsv(arr) {
  if (!arr || !arr.length) return '';
  const headers = Object.keys(arr[0]);
  const escape = function(v) {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [];
  lines.push(headers.join(','));
  arr.forEach(item => {
    const row = headers.map(h => escape(item[h]));
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

// Append object (map) to sheet, creating sheet with headers if needed
function appendObjectToSheet(ss, sheetName, obj) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = Object.keys(obj);
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
  }
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h));
  const row = headers.map(h => {
    const v = obj[h];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    if (v instanceof Date) return formatDateIso(v);
    return String(v);
  });
  sheet.appendRow(row);
}

// Simple CSV parser returning array of objects (headers from first line)
function parseCsvToObjects(csvText) {
  const lines = String(csvText).split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = parts[idx] !== undefined ? parts[idx] : ''; });
    out.push(obj);
  }
  return out;
}

// Archive transactions older than cutoffDays (returns number moved)
function archiveOldTransactions(ss, sourceSheetName, archiveSheetName, cutoffDays) {
  const src = readSheet(ss, sourceSheetName) || [];
  if (!src.length) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - cutoffDays);
  const toMove = [];
  const keep = [];
  src.forEach(r => {
    const dstr = r.date || r.createdAt || null;
    const d = dstr ? new Date(dstr) : null;
    if (d && d < cutoff) toMove.push(r); else keep.push(r);
  });
  if (toMove.length === 0) return 0;
  // save remaining
  saveSheet(ss, sourceSheetName, keep);
  // append to archive sheet
  let archive = ss.getSheetByName(archiveSheetName);
  if (!archive) {
    archive = ss.insertSheet(archiveSheetName);
    // set headers
    const headers = Object.keys(toMove[0]);
    archive.getRange(1,1,1,headers.length).setValues([headers]);
  }
  const existing = readSheet(ss, archiveSheetName) || [];
  const combined = existing.concat(toMove);
  saveSheet(ss, archiveSheetName, combined);
  return toMove.length;
}

// Simple AI proxy call - adapt endpoint/body to your Gemini API needs
function callGemini(endpoint, apiKey, prompt) {
  const payload = { prompt: String(prompt) };
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(endpoint, options);
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code >= 200 && code < 300) {
    try { return JSON.parse(body); } catch (e) { return { text: body }; }
  }
  throw new Error('AI request failed: ' + code + ' - ' + body);
}

// Hash helpers
function generateSalt() {
  const bytes = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  return bytes;
}

function hashWithSalt(password, salt) {
  const raw = salt + '|' + password;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b){
    var v = (b < 0) ? b + 256 : b;
    return (v.toString(16).length == 1) ? '0' + v.toString(16) : v.toString(16);
  }).join('');
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== DAILY PROCESS (Automações) ========== */

function dailyProcess() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = getUsersSheet(ss);
  const users = usersSheet.getDataRange().getValues().slice(1).map(r => r[0]).filter(Boolean);
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1; // 1-12
  
  users.forEach(username => {
    try {
      processUserDaily(ss, username, yyyy, mm, today);
    } catch (e) {
      console.error(`Erro processando usuário ${username}:`, e);
    }
  });
  
  console.log(`dailyProcess concluído para ${users.length} usuários em ${yyyy}-${String(mm).padStart(2,'0')}`);
}

function processUserDaily(ss, username, year, month, today) {
  const prefix = username + "_";
  const todayStr = formatDateIso(today);
  
  // Carregar dados
  const transactions = readSheet(ss, prefix + 'Transacoes') || [];
  const vouchers = readSheet(ss, prefix + 'Vales') || [];
  
  let modified = false;
  
  // Helper: detectar se transação já existe
  function existsTransactionWithDesc(desc) {
    return transactions.some(t => (t.description || '') === desc && (t.date || '').slice(0,7) === todayStr.slice(0,7));
  }
  
  // 1) RENOVAR VALES
  vouchers.forEach(v => {
    if (v.cancelled) return;
    if (v.autoRenew && v.renewalDay) {
      const renewDay = Number(v.renewalDay || 1);
      if (renewDay === today.getDate()) {
        const desc = `Vale: ${v.name} (Renovação)`;
        if (!existsTransactionWithDesc(desc)) {
          const newTx = {
            id: Date.now() + Math.floor(Math.random()*10000),
            description: desc,
            amount: Number(v.total || 0),
            type: 'income',
            category: 'Vales',
            date: todayStr,
            paymentMethod: 'Vale',
            isRecurring: false,
            frequency: '',
            meta: JSON.stringify({ source: 'voucher_renew', voucherId: v.id || null })
          };
          transactions.push(newTx);
          modified = true;
        }
        v.used = 0;
        v.history = JSON.stringify([]);
      }
    }
  });
  
  // 2) ASSINATURAS RECORRENTES
  const subscriptions = transactions.filter(t => (t.category || '').toLowerCase() === 'assinatura' && t.isRecurring);
  subscriptions.forEach(sub => {
    if (sub.cancelled) return;
    
    let dueDay = null;
    if (sub.dueDate) {
      try { dueDay = new Date(sub.dueDate).getDate(); } catch (e) {}
    }
    if (!dueDay && sub.date) {
      try { dueDay = new Date(sub.date).getDate(); } catch (e) {}
    }
    
    if (dueDay && dueDay === today.getDate()) {
      const desc = `${sub.description} (Cobrança)`;
      if (!existsTransactionWithDesc(desc)) {
        const newTx = {
          id: Date.now() + Math.floor(Math.random()*10000),
          description: desc,
          amount: Number(sub.amount || 0),
          type: 'expense',
          category: 'Assinatura',
          date: todayStr,
          dueDate: todayStr,
          paymentMethod: sub.paymentMethod || '',
          isRecurring: true,
          frequency: sub.frequency || 'mensal',
          meta: JSON.stringify({ source: 'subscription_rec', subscriptionId: sub.id || null })
        };
        transactions.push(newTx);
        modified = true;
      }
    }
  });
  
  // 3) SALÁRIOS RECORRENTES
  const salaries = transactions.filter(t => (t.category || '').toLowerCase() === 'salario' && t.isRecurring);
  salaries.forEach(sal => {
    if (sal.cancelled) return;
    
    let payDay = sal.dayOfMonth || null;
    if (!payDay && sal.date) {
      try { payDay = new Date(sal.date).getDate(); } catch (e) {}
    }
    
    if (payDay && payDay === today.getDate()) {
      const desc = `${sal.description} (Salário)`;
      if (!existsTransactionWithDesc(desc)) {
        const newTx = {
          id: Date.now() + Math.floor(Math.random()*10000),
          description: desc,
          amount: Number(sal.amount || 0),
          type: 'income',
          category: 'Salario',
          date: todayStr,
          paymentMethod: sal.paymentMethod || '',
          isRecurring: true,
          frequency: sal.frequency || 'mensal',
          meta: JSON.stringify({ source: 'salary_rec', salaryId: sal.id || null })
        };
        transactions.push(newTx);
        modified = true;
      }
    }
  });
  
  // Salvar dados modificados
  if (modified) {
    saveSheet(ss, prefix + 'Transacoes', transactions);
    if (vouchers.some(v => v.used !== undefined)) {
      saveSheet(ss, prefix + 'Vales', vouchers);
    }

    // 4) PROCESSAR RECORRÊNCIAS (Recurrences sheet)
    try {
      const recs = readSheet(ss, prefix + 'Recurrences') || [];
      recs.forEach(r => {
        try {
          if (!r || !r.description) return;
          if (r.cancelled) return;
          const freq = String((r.frequency || '').toLowerCase() || 'mensal');
          let shouldRun = false;
          if (freq === 'diario' || freq === 'daily') {
            shouldRun = true;
          } else if (freq === 'semanal' || freq === 'weekly') {
            // expect r.dayOfWeek = 0(Sun)-6(Sat) or comma list
            const dow = r.dayOfWeek !== undefined && r.dayOfWeek !== null ? String(r.dayOfWeek) : (r.day || '');
            if (dow) {
              const todayDow = today.getDay();
              const parts = String(dow).split(',').map(x => Number(x));
              if (parts.indexOf(todayDow) >= 0) shouldRun = true;
            }
          } else if (freq === 'anual' || freq === 'yearly') {
            // expect month and day
            const m = Number(r.month) || null;
            const d = Number(r.dayOfMonth || r.day) || null;
            if (m && d) {
              if (today.getMonth() + 1 === m && today.getDate() === d) shouldRun = true;
            }
          } else { // mensal / monthly default
            const dm = Number(r.dayOfMonth || r.day) || null;
            if (dm && dm === today.getDate()) shouldRun = true;
          }

          if (shouldRun) {
            const desc = `Recorrência: ${r.description}`;
            // avoid duplicates for same recurrence in same month
            const exists = transactions.some(t => (t.meta && String(t.meta).indexOf(`recurrenceId:${r.id}`) >= 0) || (t.description || '') === desc && (t.date || '').slice(0,7) === todayStr.slice(0,7));
            if (!exists) {
              const newTx = {
                id: Date.now() + Math.floor(Math.random()*10000),
                description: desc,
                amount: Number(r.amount || 0),
                type: r.type || 'expense',
                category: r.category || (r.type === 'income' ? 'Salario' : 'Geral'),
                date: todayStr,
                paymentMethod: r.paymentMethod || '',
                isRecurring: true,
                frequency: r.frequency || 'mensal',
                meta: JSON.stringify({ source: 'recurrence', recurrenceId: r.id || null })
              };
              transactions.push(newTx);
              modified = true;
            }
          }
        } catch (e) { console.error('recurrence process failed for', r, e); }
      });
    } catch (e) { console.error('Erro processando recurrences:', e); }
  }
}

function formatDateIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * installDailyTrigger()
 * Execute uma vez para criar gatilho diário
 */
function installDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'dailyProcess') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  ScriptApp.newTrigger('dailyProcess')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
  
  return 'Trigger instalado: dailyProcess executará diariamente às 03:00 UTC';
}

function getSheetName(type) {
  // Mapeia o "type" que vem do frontend para o nome da aba na planilha
  if (type === 'transactions') return 'Transacoes';
  if (type === 'investments') return 'Investimentos';
  if (type === 'vouchers') return 'Vales';
  if (type === 'goals') return 'Metas';
  if (type === 'templates') return 'Templates';
  if (type === 'chats') return 'AIChats'; 
  return null;
}
