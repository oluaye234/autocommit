# 📝 autocommit

![CI](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/autocommit/ci.yml?branch=main&label=CI)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Release](https://img.shields.io/github/v/release/YOUR_ORG/autocommit?include_prereleases)

Generates **meaningful git commit messages** from your staged diff, using AI
when available (Claude) and a solid Conventional-Commits-style heuristic when
it isn't. Never commits without asking, unless you say `--yes`.

## ✨ Features

- Reads `git diff --staged` and proposes a Conventional Commits message
- Works offline via a smart heuristic (file stats, added/removed lines, scope guessing)
- Optional AI mode: set `ANTHROPIC_API_KEY` for LLM-written messages
- Interactive confirm / edit / skip before committing
- `--dry-run` and `--yes` flags for scripting

## 📦 Install

```bash
git clone https://github.com/YOUR_ORG/autocommit.git
cd autocommit
bash scripts/setup.sh
npm install
```

Optionally link it as a global command:

```bash
npm link
```

## 🚀 Usage

```bash
git add -A
node src/autocommit.js
```

```
📝 Suggested commit message (via heuristic (offline)):

----------------------------------------
feat(src): add 1 file(s)

Changed files: src/newFeature.js
Diff stats: +42 / -0 lines
----------------------------------------

Commit with this message? [y/N/e=edit]
```

Just preview the message without committing:

```bash
node src/autocommit.js --dry-run
```

Auto-commit without a prompt (e.g. in scripts/CI):

```bash
node src/autocommit.js --yes
```

Enable AI-written messages:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node src/autocommit.js
```

## 🧰 npm scripts

| Script | Description |
|---|---|
| `npm start` | Run the CLI (`src/autocommit.js`) |
| `npm test` | Run the unit tests |
| `npm run tracker` | Show achievement badge progress |
| `npm run roadmap` | Show the Day 1 → Month 1 roadmap |

## 🏆 GitHub achievement scripts

```bash
bash scripts/unlock-all.sh
bash scripts/quickdraw.sh
bash scripts/yolo.sh
bash scripts/publicist.sh
bash scripts/pull-shark.sh 2
bash scripts/pair-extraordinaire.sh "Grace Hopper" "grace@example.com"
```

All scripts require [`gh`](https://cli.github.com/) authenticated (`gh auth login`) and auto-detect your repo.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

[MIT](LICENSE)
