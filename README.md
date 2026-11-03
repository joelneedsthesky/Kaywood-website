# Kaywood Capital — website

A static website (plain HTML, CSS and JavaScript). It has no build step, so Cloudflare serves these files as they are.

## Files
| File | What it is |
|---|---|
| `index.html` | The homepage: all sections and text |
| `styles.css` | The look: colours, fonts, layout, animations |
| `main.js` | Signal map, live ticker, forms, mobile menu. **Map regions are edited here.** |
| `privacy.html` | Privacy policy (draft, needs legal review) |
| `404.html` | "Page not found" page |
| `favicon.svg` / `og-image.png` | Browser tab icon / preview image for LinkedIn and WhatsApp shares |
| `robots.txt` / `sitemap.xml` | Tell Google what to index |
| `_headers` | Security settings Cloudflare applies |
| `wrangler.jsonc` | Cloudflare settings (shows the custom 404 page) |
| `.assetsignore` | Keeps README and config files from being public |

## Publish: GitHub → Cloudflare Pages
1. Unzip the file. On github.com, open **kaywood-website** → **Add file → Upload files**. Drag in **all the files** (not the folder itself) → **Commit changes**.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** → choose **kaywood-website**.
3. Build settings: Framework preset **None**, Build command **(leave empty)**, Build output directory **/** → **Save and Deploy**.
4. Once it's live on the `*.pages.dev` address: **Custom domains → Set up a custom domain** → `kaywoodcapital.com` (and add `www.kaywoodcapital.com` too).

## Before going public: placeholders to replace
- [Asset name], [jurisdiction], [frequency] in the hero token card
- Regulated custody · [partner]
- [date] on the three Signals teasers (and make them link to real posts)
- [TREASURY ADDRESS], [ATTESTATION PROVIDER], [CONTRACT ADDRESSES]
- LinkedIn link: `https://www.linkedin.com/company/[kaywood-capital]` (2 places in index.html)
- Footer: [Regulatory status and registered address]
- privacy.html: all bracketed items + legal review

## Forms
Until a forms service is connected, both forms open a pre-filled email to **invest@kaywoodcapital.com** (access) and **signals@kaywoodcapital.com** (newsletter). Create these as aliases in Google Workspace. To connect a service later, set `formEndpoint` at the top of `main.js`.

## Live ticker
BTC/ETH come from CoinGecko, FX daily rates from ExchangeRate-API (free, no key, credited in the ticker). If a feed is unavailable, the value shows "—".
