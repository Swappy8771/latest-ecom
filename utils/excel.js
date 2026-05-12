function asString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function asNumber(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function splitImageUrls(value) {
  const raw = asString(value);
  if (!raw) return [];
  // Accept comma/space separated urls
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { asString, asNumber, splitImageUrls };

