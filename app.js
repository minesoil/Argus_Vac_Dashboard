/* Argus Vac mission view - behavior
   Polls /threat and /stats; keeps the banner, table and clock live. */

const $ = (id) => document.getElementById(id);

function riskClass(pct) {
  if (pct >= 85) return "crit";
  if (pct >= 50) return "warn";
  return "clear";
}

function riskPillHtml(pct) {
  const cls = pct >= 85 ? "risk-crit" : pct >= 50 ? "risk-warn" : "risk-low";
  return `<span class="risk-pill ${cls}">${pct}%</span>`;
}

async function pollThreat() {
  let t = null;
  try { t = await (await fetch("threat")).json(); } catch (e) { return; }

  const banner = $("banner");
  const text = $("banner-text");
  const detail = $("banner-detail");

  if (!t || t.name === "none") {
    banner.className = "banner clear";
    $("banner-icon").textContent = "\u25CF";
    text.textContent = "SYSTEM CLEAR";
    detail.textContent = "no obstacle in the reaction zone";
    renderTable(null);
    return;
  }

  const pct = Math.round((t.score || 0) * 100);
  const cls = riskClass(pct);
  banner.className = "banner " + cls;
  $("banner-icon").textContent = cls === "clear" ? "\u25CF" : "\u26A0";
  text.textContent = `THREAT: ${t.name} - RISK ${pct}%`;
  detail.textContent = `center (${t.cx}, ${t.cy}) px`;
  renderTable(t);
}

function renderTable(t) {
  const body = document.querySelector("#threat-table tbody");
  if (!t) {
    body.innerHTML = '<tr class="muted"><td colspan="3">none</td></tr>';
    return;
  }
  const pct = Math.round((t.score || 0) * 100);
  body.innerHTML =
    `<tr><td>${escapeHtml(t.name)}</td>` +
    `<td>${riskPillHtml(pct)}</td>` +
    `<td>(${t.cx}, ${t.cy})</td></tr>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function pollStats() {
  try {
    $("stats").textContent = await (await fetch("stats")).text();
  } catch (e) { /* keep last known */ }
}

function tickClock() {
  $("clock").textContent = new Date().toLocaleTimeString();
}

// feed watchdog: if the img errors, show overlay and retry periodically
const feed = $("feed");
setInterval(() => {
  const lost = !feed.complete || feed.naturalWidth === 0;
  $("feed-lost").classList.toggle("hidden", !lost);
}, 2000);

tickClock();
setInterval(tickClock, 1000);
pollThreat(); setInterval(pollThreat, 1000);
pollStats(); setInterval(pollStats, 2500);
