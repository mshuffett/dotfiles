# Enrichment Project Memory

## LinkedIn Image Download Limitations (2026-03-09)
LinkedIn profile photos CANNOT be downloaded programmatically via Chrome MCP or agent-browser:
- **CORS**: `media.licdn.com` blocks cross-origin fetch/XHR from `linkedin.com`
- **Canvas taint**: Drawing LinkedIn images to canvas and exporting fails (SecurityError: tainted canvas)
- **Cookie blocking**: Chrome MCP tool blocks cookie/auth data in JS return values, so you can't extract auth tokens
- **curl without auth**: LinkedIn CDN returns HTML (auth required) for image URLs accessed without cookies
- **CDP not available**: Chrome doesn't have remote debugging port open by default, so `agent-browser --cdp` won't work

### What DOES work for LinkedIn photos:
1. **Google Images search** (`agent-browser` + Google Images) - LinkedIn photos are often indexed and publicly crawlable
2. **NFX Signal** (signal.nfx.com/investors/{slug}) - Has investor profile photos, downloadable via curl
3. **Company team pages** - Many VC sites have team photos
4. **Crunchbase** - Has some profile photos
5. **Chrome MCP screenshots** - Can take screenshots of LinkedIn profiles (visible in chat, good for verification) but screenshots are NOT saved as files on disk

### Recommended workflow for bulk investor photo collection:
1. First pass: company websites (team pages) via `agent-browser` - best quality photos
2. Second pass: NFX Signal, Crunchbase, personal sites via `WebFetch`/`curl`
3. Third pass: Google Images search via `agent-browser` for remaining gaps
4. Verification screenshots: `agent-browser screenshot` for all sources

## Project Structure
- CSV guest list: `Open Batch 001 — Demo Day - Guests - *.csv`
- Images: `./images/{person-slug}-photo.{ext}`, `./images/{company-slug}-logo.{ext}`
- Screenshots: `./images/screenshots/`
