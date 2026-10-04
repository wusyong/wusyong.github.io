// Site search backed by Fuse.js and Zola's `fuse_javascript` index (`window.searchIndex`).
// Every query word must appear as a substring (title or body), which works for Chinese text
// that has no spaces between words.
import Fuse from "./fuse-7.5.0.min.js";

const MAX_ITEMS = 10;
const TEASER_LENGTH = 120;
const TEASER_LEAD = 30;

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Zola's index stores bodies as sanitized HTML text (`&lt;`, `&amp;`...). Decode them so queries
// like `Vec<T>` match; a textarea never runs scripts while parsing.
function decodeEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// A slice of the body around the first match, with every match inside it in bold.
function makeTeaser(body, indices) {
  if (!body) {
    return "";
  }
  const ranges = [...indices].sort((a, b) => a[0] - b[0]);
  const start = ranges.length ? Math.max(0, ranges[0][0] - TEASER_LEAD) : 0;
  const end = Math.min(body.length, start + TEASER_LENGTH);

  let teaser = start > 0 ? "…" : "";
  let pos = start;
  for (const [from, to] of ranges) {
    const s = Math.max(from, pos);
    const e = Math.min(to + 1, end);
    if (s >= e) {
      continue;
    }
    teaser += escapeHtml(body.substring(pos, s)) + "<b>" + escapeHtml(body.substring(s, e)) + "</b>";
    pos = e;
  }
  teaser += escapeHtml(body.substring(pos, end));
  return end < body.length ? teaser + "…" : teaser;
}

function formatSearchResultItem(result) {
  const { url, title = "", body = "" } = result.item;
  const bodyMatch = (result.matches || []).find((m) => m.key === "body");
  const href = escapeHtml(url);
  return (
    `<article class='box'>` +
    `<h1 class='title'><a class='link' href='${href}'>${escapeHtml(title)}</a></h1>` +
    `<div class='content mt-2'>` +
    makeTeaser(body, bodyMatch ? bodyMatch.indices : []) +
    `<a href='${href}'>Read More <span class="icon is-small"><i class="fas fa-arrow-right fa-xs"></i></span></a>` +
    `</div>` +
    `</article>`
  );
}

const $searchInput = document.getElementById("search");
const $searchResults = document.querySelector(".search-results");
const $searchResultsItems = document.querySelector(".search-results__items");

if ($searchInput && Array.isArray(window.searchIndex)) {
  const docs = window.searchIndex.map((doc) => ({
    url: doc.url,
    title: decodeEntities(doc.title || ""),
    body: decodeEntities(doc.body || ""),
  }));
  const fuse = new Fuse(docs, {
    keys: [
      { name: "title", weight: 2 },
      { name: "body", weight: 1 },
    ],
    includeMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });
  let currentTerm = "";

  const runSearch = () => {
    const term = $searchInput.value.trim();
    if (term === currentTerm) {
      return;
    }
    currentTerm = term;
    $searchResultsItems.innerHTML = "";

    // `'word` is Fuse's "include" operator, and space-separated operators are ANDed.
    const query = term.split(/\s+/).filter(Boolean).map((word) => `'${word}`).join(" ");
    const results = query ? fuse.search(query, { limit: MAX_ITEMS }) : [];
    $searchResults.style.display = results.length ? "block" : "none";

    for (const result of results) {
      const item = document.createElement("div");
      item.classList.add("mb-4");
      item.innerHTML = formatSearchResultItem(result);
      $searchResultsItems.appendChild(item);
    }
  };

  const debouncedSearch = debounce(runSearch, 150);
  // Skip intermediate IME input (e.g. Zhuyin or Pinyin) and search once the text is committed.
  $searchInput.addEventListener("input", (event) => {
    if (!event.isComposing) {
      debouncedSearch();
    }
  });
  $searchInput.addEventListener("compositionend", debouncedSearch);
}
