# BookDir Local Network Dev Server Troubleshooting

## Problem
Astro dev server was not accessible from other devices on the local network, even when using `--host 0.0.0.0` or similar flags.

## Solution
Run the dev server directly with npx, specifying your LAN IP and port:

```sh
npx astro dev --host 10.0.0.88 --port 4326
```
- This binds the server to your actual LAN IP, making it accessible from other devices on the same network.

## Access from mobile
Open `http://10.0.0.88:4326/` in your mobile browser.

## Notes
- Using `npm run dev` or `--host 0.0.0.0` may not work on some Windows setups; always use the explicit npx command above for reliable LAN access.
- If your IP changes, update the command accordingly. 