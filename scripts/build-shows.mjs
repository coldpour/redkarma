import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SHOWS_PATH = path.join(ROOT, 'shows.txt');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SHOWS_HTML_PATH = path.join(ROOT, 'shows.html');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseShows(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const blocks = trimmed.split(/\n\s*\n/);
  return blocks.map((block, index) => {
    const lines = block
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 3 || lines.length > 4) {
      throw new Error(`Invalid show block at #${index + 1}: expected 3-4 lines, got ${lines.length}`);
    }

    const [date, venue, location, link] = lines;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date "${date}" in block #${index + 1}`);
    }

    const [year, month, day] = date.split('-').map((part) => Number(part));
    if (!month || month < 1 || month > 12 || !day || day < 1 || day > 31) {
      throw new Error(`Invalid date "${date}" in block #${index + 1}`);
    }

    return {
      date,
      year,
      month,
      day,
      venue,
      location,
      link,
    };
  });
}

function renderShow(show, indent) {
  const monthLabel = MONTHS[show.month - 1];
  const dayLabel = String(show.day);
  const showAction = show.link
    ? `\n${indent}    <div class="show-action">\n${indent}        <a href="${escapeHtml(show.link)}" class="btn">Details</a>\n${indent}    </div>`
    : '';

  return [
    `${indent}<div class="show-item" data-date="${show.date}">`,
    `${indent}    <div class="show-date">`,
    `${indent}        <span class="month">${monthLabel}</span>`,
    `${indent}        <span class="day">${dayLabel}</span>`,
    `${indent}    </div>`,
    `${indent}    <div class="show-details">`,
    `${indent}        <h3 class="venue">${escapeHtml(show.venue)}</h3>`,
    `${indent}        <p class="location">${escapeHtml(show.location)}</p>`,
    `${indent}    </div>`,
    showAction ? showAction : null,
    `${indent}</div>`,
  ]
    .filter(Boolean)
    .join('\n');
}

function injectShows(filePath, showsHtml) {
  const start = '<!-- SHOWS_START -->';
  const end = '<!-- SHOWS_END -->';
  const file = fs.readFileSync(filePath, 'utf8');

  if (!file.includes(start) || !file.includes(end)) {
    throw new Error(`Missing shows markers in ${path.basename(filePath)}`);
  }

  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
  const replacement = `${start}\n${showsHtml}\n${end}`;
  const updated = file.replace(pattern, replacement);

  fs.writeFileSync(filePath, updated, 'utf8');
}

const showsText = fs.readFileSync(SHOWS_PATH, 'utf8');
const shows = parseShows(showsText).sort((a, b) => a.date.localeCompare(b.date));
const indent = '            ';
const showsHtml = shows.map((show) => renderShow(show, indent)).join('\n\n');

injectShows(INDEX_PATH, showsHtml);
injectShows(SHOWS_HTML_PATH, showsHtml);

console.log(`Built ${shows.length} shows into index.html and shows.html`);
