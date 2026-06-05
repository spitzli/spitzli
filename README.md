# spitzli.dev

Public website for **spitzli development** — currently a Work in Progress splash page.

🔗 Live: [spitzli.dev](https://spitzli.dev)

## Stack

- Single static `index.html`
- [Tailwind CSS](https://tailwindcss.com) via CDN — no build step
- Hosted on GitHub Pages, served at the `spitzli.dev` custom domain (`CNAME`)

## Develop

It's one file. Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Pushing to `main` auto-deploys via GitHub Pages.

### DNS (custom domain)

For `spitzli.dev` → GitHub Pages, set these records at your DNS provider:

| Type  | Name   | Value                  |
|-------|--------|------------------------|
| A     | `@`    | `185.199.108.153`      |
| A     | `@`    | `185.199.109.153`      |
| A     | `@`    | `185.199.110.153`      |
| A     | `@`    | `185.199.111.153`      |
| CNAME | `www`  | `spitzli.github.io.`   |

Then enable **Enforce HTTPS** in the repo's Pages settings once the cert is issued.
