const BASE_URL = process.env.BUDGET_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // Transactions
  listTransactions: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    if (params.description) qs.set('description', params.description);
    const q = qs.toString();
    return request(`/transactions${q ? `?${q}` : ''}`);
  },

  uploadTransactions: async (filePath) => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const body = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const boundary = `----FormBoundary${Date.now()}`;
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/csv\r\n\r\n`),
      body,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await fetch(`${BASE_URL}/transactions/upload`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: payload,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json();
  },

  modifyTransactions: (ids, { description, label } = {}) =>
    request('/transactions/modify', {
      method: 'POST',
      body: JSON.stringify({ ids, description, label }),
    }),

  removeTransactions: (ids) =>
    request('/transactions/remove', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Labels
  listLabels: (tier) => {
    const q = tier != null ? `?tier=${tier}` : '';
    return request(`/labels${q}`);
  },

  labelTree: () => request('/labels/tree'),

  createLabel: (name, parent_id) =>
    request('/labels', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id }),
    }),

  modifyLabel: (name, newName) =>
    request(`/labels/${encodeURIComponent(name)}/modify`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    }),

  removeLabels: (ids) =>
    request('/labels/remove', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Rules
  listRules: () => request('/rules'),

  createRule: (pattern, label_id) =>
    request('/rules', {
      method: 'POST',
      body: JSON.stringify({ pattern, label_id }),
    }),

  removeRules: (ids) =>
    request('/rules/remove', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  applyRules: () => request('/rules/apply', { method: 'POST' }),
};
