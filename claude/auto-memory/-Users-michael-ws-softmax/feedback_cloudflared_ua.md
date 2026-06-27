---
name: cloudflared-tunnel-ua-block
description: Cloudflare WAF blocks default Python urllib User-Agent with error 1010; set browser UA explicitly
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c45d893b-5ebc-4a58-8aa9-cbdb5571e876
---

When a Python HTTP client (urllib, requests) hits a Cloudflare-fronted tunnel hostname, expect HTTP 403 with error code 1010 ("owner has banned your access based on browser signature") if you don't set a User-Agent. Default `Python-urllib/3.x` is on Cloudflare's bot-deny list.

**Fix:** add a browser UA header:
```python
headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
```

**Why:** Discovered when wiring up an Among Them bot Docker container → cloudflared tunnel → local FastAPI policy server. Curl from host worked (200 OK); Python urllib from inside the container got 403/1010. Symptom: GET works, POST fails — actually any request method fails, but GETs from common tools accidentally pass UA filtering.

**How to apply:**
- Any HTTP client hitting a `*.trycloudflare.com` or Cloudflare-zoned domain needs an explicit browser-like UA
- Affects urllib, http.client, basic httpx — anything that emits `Python-urllib/...`
- Persistent named tunnels (`cloudflared tunnel run` w/ config.yml) behave the same — it's a Cloudflare WAF setting, not a tunnel feature

For persistent tunnels: `cloudflared tunnel list` shows configured tunnels; `~/.cloudflared/config.yml` has hostname→service mapping. To add a new local port, edit the `ingress:` block and restart `cloudflared tunnel run`.
