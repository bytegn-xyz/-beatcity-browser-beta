# BEAT//CITY // Browser Beta 0.1

> **STATUS:** SIGNAL ACQUIRED  
> **CREATOR + DEVELOPER:** [BYTEGN.XYZ](https://bytegn.xyz)  
> **TARGET:** Modern desktop + mobile browsers  
> **MISSION:** Prove the rhythm-game core in the browser before native app development.

BEAT//CITY is an original neon rhythm-game project created and developed by **BYTEGN.XYZ**. This repository is the **first browser beta release** and is intentionally lightweight: clone it, serve it, tap the notes, break the combo, try again.

The repo uses dramatic “blackbox / signal / protocol” filenames for fun. **There is no malware, exploit code, credential harvesting, obfuscation, or other malicious behavior in this project.**

## // BOOT_SEQUENCE

For the simplest test, open `index.html` in a modern browser.

For more reliable Web Audio behavior:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## // INPUT_MATRIX

- `A` — lane 1
- `S` — lane 2
- `K` — lane 3
- `L` — lane 4
- `Esc` — pause
- Touch/click the four lane controls on mobile

## // BETA_0.1_PAYLOAD

- Four-lane rhythm gameplay
- Easy / Normal / Hard chart generation
- Score
- Combo + best combo
- Accuracy
- Energy / failure state
- Hype meter
- Pause + restart
- Responsive browser controls
- Generated synth demo beat
- No copyrighted commercial track bundled

## // REPO_MAP

```text
BEATCITY/
├── index.html
├── blackbox/
│   ├── beat-engine.js
│   └── neon-protocol.css
├── signals/
│   └── chart.sample.json
├── .github/
│   └── ISSUE_TEMPLATE/
├── CHANGELOG.md
├── CREDITS.md
├── SECURITY.md
├── LICENSE.md
└── README.md
```

## // MUSIC_SIGNAL_FORMAT

The engine is designed around simple timed note events:

```json
[
  {"time": 1.250, "lane": 0},
  {"time": 1.500, "lane": 1},
  {"time": 1.750, "lane": 2}
]
```

The next major development milestone is replacing the generated demo clock with properly licensed local-artist audio and loading reviewed beat maps from track data.

## // ROADMAP

**Beta 0.1 — Browser Core**
Playable rhythm engine and neon UI.

**Beta 0.2 — Real Music Pipeline**
Licensed artist audio, track metadata, external JSON charts, calibration and song-select.

**Beta 0.3 — Identity**
Accounts, persistent scores, leaderboards and artist profiles.

**Beta 0.4 — Creator System**
Artist submission workflow and beat-map tooling.

**Beta 0.5 — Connected Play**
Challenges and early multiplayer experiments.

**App Alpha**
Native/mobile packaging after the browser engine, timing, content pipeline and backend prove stable.

## // DEPLOYMENT

This beta is deliberately static, which makes **GitHub Pages** a good first public test host.

After the repository is created on GitHub:

1. Push these files to the default branch.
2. Open repository **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select the default branch and `/ (root)`.
5. Save.

That gives the project a public browser URL without committing to an app-store release yet.

## // OWNERSHIP

BEAT//CITY is an original project created and developed by **BYTEGN.XYZ**.

Copyright © 2026 BYTEGN.XYZ. All rights reserved.

This beta is **not affiliated with Tap Tap Revenge or its former publishers/rights holders**. References to older rhythm games are descriptive inspiration only; BEAT//CITY uses its own name, presentation, code and game identity.

---

`BYTEGN.XYZ // BUILD STRANGE THINGS RESPONSIBLY`
