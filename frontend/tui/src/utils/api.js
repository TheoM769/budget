const API_BASE = process.env.BUDGET_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

// --- Transactions ---

export async function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.description) params.set("description", filters.description);
  if (filters.amountOp) params.set("amount_op", filters.amountOp);
  if (filters.amountValue != null)
    params.set("amount_value", filters.amountValue);
  const qs = params.toString();
  return request(`/transactions${qs ? `?${qs}` : ""}`);
}

export async function removeTransactions(ids) {
  return request("/transactions/remove", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function modifyTransactions(ids, { description, label } = {}) {
  return request("/transactions/modify", {
    method: "POST",
    body: JSON.stringify({ ids, description, label }),
  });
}

export async function uploadTransactions(filePath) {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const content = fs.readFileSync(filePath, "latin1");
  const fileName = path.basename(filePath);

  const boundary = `----FormBoundary${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: text/csv\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--\r\n`;

  const res = await fetch(`${API_BASE}/transactions/upload`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Labels ---

export async function getLabels(tier) {
  const qs = tier != null ? `?tier=${tier}` : "";
  return request(`/labels${qs}`);
}

export async function getLabelTree() {
  return request("/labels/tree");
}

export async function createLabel(name, parentId) {
  return request("/labels", {
    method: "POST",
    body: JSON.stringify({ name, parent_id: parentId }),
  });
}

export async function modifyLabel(name, newName) {
  return request(`/labels/${encodeURIComponent(name)}/modify`, {
    method: "POST",
    body: JSON.stringify({ new_name: newName }),
  });
}

export async function removeLabels(ids) {
  return request("/labels/remove", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// --- Rules ---

export async function getRules() {
  return request("/rules");
}

export async function createRule(pattern, labelId) {
  return request("/rules", {
    method: "POST",
    body: JSON.stringify({ pattern, label_id: labelId }),
  });
}

export async function removeRules(ids) {
  return request("/rules/remove", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function applyRules() {
  return request("/rules/apply", { method: "POST" });
}
