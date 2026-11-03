# Color Echo

A family-friendly memory game inspired by Simon. Watch the colored shapes, then repeat the pattern. Each successful round adds one more color and gently increases the playback speed.

## Play

Open `index.html` in a browser, or use the GitHub Pages instructions below. No installation, account, API key, or build step is needed.

- Tap/click the colors, or press **1**, **2**, **3**, **4**.
- Choose **Easy breezy**, **In the groove**, or **Lightning brain** before starting.
- **Replay pattern** plays the whole current pattern again and starts your response from the beginning, with no penalty.
- There is no time limit for your response. A wrong color ends the game with an invitation to try again.
- **Your best** counts fully completed rounds, separately for each pace, on this browser. Browser storage must be available for scores to persist.
- The speaker button switches sounds off/on. Sound and scores stay on your device. The game contains no analytics, ads, external fonts, or network requests.
- Switching tabs pauses the game. **Continue** replays the current round.

## Enable GitHub Pages

The game files are ready in [rynering/colorpatterngame](https://github.com/rynering/colorpatterngame). To publish:

1. Open [Settings → Pages](https://github.com/rynering/colorpatterngame/settings/pages).
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main**, folder **/ (root)**, then click **Save**.
4. Wait a few minutes for GitHub to finish publishing. The game will be at **https://rynering.github.io/colorpatterngame/**.

Open that link on your children’s devices. On a phone or tablet, the browser’s **Add to Home Screen** option can add a shortcut.

The repository and Pages website are public. The game does not ask children to enter personal information. If the game initially displays a 404, check Settings → Pages and wait for the deployment to finish.

## Customize

The title and instructions are in `index.html`. Colors and layout are in `style.css`. Playback speeds, notes, and game behavior are in `game.js`. All file links are relative so the game works at a GitHub Pages repository URL.

## Development verification

Serve this directory with `python3 -m http.server 8000`. With Node.js and Playwright available, run `node tests/game.test.cjs` in another terminal. Set `GAME_URL` if using a different local port. Playwright’s Chromium browser must be installed. These tools are only for development, not for playing or hosting the game.
