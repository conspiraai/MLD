/**
 * MLD Dev Pulse builder
 * - GitHub repos (most-starred created in last 14 days)
 * - Hacker News (high-score dev stories)
 * - npm packages (popular AI/dev terms + last-week downloads)
 *
 * Outputs: data/repos.json (array of unified items)
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const HEADERS_JSON = { "content-type": "application/json" };
const GH_HEADERS = GITHUB_TOKEN
  ? { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
  : { Accept: "application/vnd.github+json" };

const today = new Date();
const since = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 14) // 14 days
  .toISOString()
  .slice(0, 10);

/* ----------------- helpers ----------------- */
async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}
const trim = (s, n = 180) => (s || "").replace(/\s+/g, " ").trim().slice(0, n);

/* ----------------- GitHub trending ----------------- */
async function fetchGitHubRepos() {
  // Most-starred repos created in the last 14 days (tweak languages if you want)
  const langs = ["TypeScript", "JavaScript", "Python", "Rust", "Go"];
  const q = `created:>=${since} (${langs.map(l => `language:${l}`).join(" OR ")})`;
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", q);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "18");

  const data = await getJSON(url, GH_HEADERS);
  return (data.items || []).map(r => ({
    id: `gh_${r.id}`,
    type: "code",
    source: "GitHub",
    title: `${r.full_name}`,
    description: trim(r.description),
    url: r.html_url,
    tags: [
      r.language?.toLowerCase(),
      ...(r.topics || []).slice(0, 2)
    ].filter(Boolean),
    stars: r.stargazers_count,
  }));
}

/* ----------------- Hacker News (Algolia API) ----------------- */
async function fetchHN() {
  // “show hn” + other dev terms with decent score
  const terms = encodeURIComponent("show hn OR open-source OR release OR framework");
  const url = `https://hn.algolia.com/api/v1/search?tags=story&query=${terms}&numericFilters=points>100&hitsPerPage=12`;
  const data = await getJSON(url, HEADERS_JSON);
  return (data.hits || []).map(h => ({
    id: `hn_${h.objectID}`,
    type: "articles",
    source: "Hacker News",
    title: h.title,
    description: trim(h.story_text || h._highlightResult?.title?.value?.replace(/<[^>]*>/g, "")),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    tags: ["hn", "discussion"],
    points: h.points
  }));
}

/* ----------------- npm (downloads last week) ----------------- */
async function fetchNpm() {
  // Query a few hot dev keywords via npms.io and decorate with last-week downloads
  const topics = ["ai", "agent", "evals", "cli", "devtools"];
  const searchUrl = (t) => `https://api.npms.io/v2/search?q=${encodeURIComponent(t)}&size=4`;
  const dlUrl = (pkg) => `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`;

  const results = [];
  for (const t of topics) {
    const block = await getJSON(searchUrl(t), HEADERS_JSON);
    for (const hit of (block.results || [])) {
      const name = hit.package?.name;
      if (!name) continue;
      try {
        const dls = await getJSON(dlUrl(name), HEADERS_JSON);
        results.push({
          id: `npm_${name}`,
          type: "packages",
          source: "npm",
          title: name,
          description: trim(hit.package?.description),
          url: hit.package?.links?.npm || `https://www.npmjs.com/package/${name}`,
          tags: ["npm", t],
          downloads: dls.downloads
        });
      } catch { /* ignore single pkg failures */ }
    }
  }
  // Sort by downloads desc, keep top 10
  return results
    .sort((a,b)=> (b.downloads||0) - (a.downloads||0))
    .slice(0, 10);
}

/* ----------------- build & write ----------------- */
async function build() {
  const [gh, hn, npm] = await Promise.all([
    fetchGitHubRepos(),
    fetchHN(),
    fetchNpm()
  ]);

  // Simple merge: code first, then packages, then articles
  const merged = [
    ...gh,
    ...npm,
    ...hn
  ];

  const outPath = resolve("data", "repos.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log(`Wrote ${merged.length} items → ${outPath}`);
}

build().catch(err=>{
  console.error(err);
  process.exit(1);
});
