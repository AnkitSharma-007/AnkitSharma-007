import { readFileSync, writeFileSync } from 'node:fs';

const AUTHOR_URL = 'https://www.syncfusion.com/blogs/author/ankit-sharma';
const MAX_POSTS = 5;
const README = 'README.md';
const START = '<!-- BLOG-POST-LIST:START -->';
const END = '<!-- BLOG-POST-LIST:END -->';

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const escapeLinkText = (s) => s.replace(/([\[\]])/g, '\\$1');

const res = await fetch(AUTHOR_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (profile-readme-updater)' } });
if (!res.ok) throw new Error(`Failed to fetch ${AUTHOR_URL}: HTTP ${res.status}`);
const html = await res.text();

// The author page lists only this author's posts, newest first.
const posts = [
  ...html.matchAll(/<a class="post-title" href="(\/blogs\/post\/[^"]+)">([^<]+)<\/a>/g),
]
  .map(([, path, title]) => ({ url: new URL(path, AUTHOR_URL).href, title: decode(title.trim()) }))
  .slice(0, MAX_POSTS);

if (posts.length === 0) throw new Error('No posts found on the author page; the markup may have changed.');

const list = posts.map((p) => `- [${escapeLinkText(p.title)}](${p.url})`).join('\n');

const readme = readFileSync(README, 'utf8');
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1 || end < start) throw new Error('Blog post markers not found in README.md');

const updated = `${readme.slice(0, start + START.length)}\n${list}\n${readme.slice(end)}`;
if (updated !== readme) {
  writeFileSync(README, updated);
  console.log(`README updated with ${posts.length} posts.`);
} else {
  console.log('README already up to date.');
}
