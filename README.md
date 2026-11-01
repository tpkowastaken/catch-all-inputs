<img src="assets/icon.svg" width="64" height="64" alt="">

# catch-all-inputs

Created in [T3 Code](https://t3.codes).

A fullscreen page that catches every input it can. Only Esc gets through, and it leaves fullscreen.

## Run

```sh
mise install
mise run dev
```

Open http://localhost:5173 and press **Start catching**. `mise run build` and `mise run preview` build and serve the production version.

Node is pinned by `mise.toml` and `mise.lock`, npm packages by `package-lock.json`.

## Deploy

Pushing to `main` builds and publishes the site on Cloudflare Pages. `mise run deploy` publishes the local build directly.

`redirect-www/` is a small Worker that sends `www.catchallinputs.com` to the root domain in one redirect. Publish it with `mise run deploy-www-redirect`.

## Limits

Use Chrome or Edge. Only they support the Keyboard Lock API, which is what catches shortcuts such as ⌘W and Ctrl+T, and it only works on localhost or HTTPS. Other browsers still act on those shortcuts. Operating system shortcuts may also get through.
