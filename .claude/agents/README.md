# Farm Futures `.claude/agents/`

5 個 Claude Code subagent，給多 AI session 並行寫 Farm Futures 時用。

## 來源 / 授權

從 [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/claude-code-game-studios)
精選 5 個改寫而來。上游授權：MIT。Pinned commit:
`a1697d670e56d83561c42566532b1af5c7c21622`（2026-05-03 抓的）。

不是 git submodule — 是手動拷貝改寫。要追上游新版時，人工 diff
`https://github.com/Donchitos/Claude-Code-Game-Studios/compare/a1697d6...main`
然後決定哪些變動要套回。

## 哪 5 個 + 什麼時候用

| Agent | 什麼時候叫它 | 它會去讀什麼 |
|---|---|---|
| `economy-designer` | 設計新作物期貨參數、資源 sink/faucet、保證金規則、成就獎勵分層 | Notion Commodities DB + `reference/ALIGNMENT_v1.md` + `docs/economic-model.md` |
| `creative-director` | 跨 AI session 衝突、「這影響遊戲核心定位嗎」的決定、scope 砍取捨 | `reference/GAMEPLAY_DECISIONS.md` + `reference/ALIGNMENT_v1.md` |
| `art-director` | 視覺一致性 review、新素材 spec、UI 視覺方向、白底處理流程 | `reference/ART_DIRECTION.md` + `CLAUDE.md` §4 + `public/assets/incoming/` |
| `localization-lead` | i18n 架構（首次叫會選 lib）、字串抽取、zh-TW/en 翻譯流程 | 暫無，會提案建立 `src/locales/` |
| `qa-lead` | PR review evidence 檢查、smoke check、bug triage、release readiness | `.github/pull_request_template.md` + `CLAUDE.md` §5 |

## 怎麼叫

在 Claude Code session 裡：

```
請用 economy-designer agent 幫我設計大豆期貨保證金規則
```

或讓 Claude 自動路由（agent 的 `description` 已寫好觸發詞）：

```
我想設計大豆期貨保證金規則
```

## 跟上游差在哪（精選改動）

**統一改動**：
- `description` 都加上「For Farm Futures (TS+React+Vite, Notion SSOT)」幫助路由
- 移除 `skills:` 欄位（上游引用的 `[brainstorm, design-review, bug-report, release-checklist]` 沒有跟著移植，避免 dangling reference）
- 保留 `disallowedTools`、`memory`、`maxTurns`、`tools` 欄位

**個別改動**：

- **economy-designer**：把 `design/registry/entities.yaml` 整段改成 Notion
  Commodities DB（ID `afe839ed38f14cc08868c14ce2c61b8f`）+ 唯讀 mirror
  `src/data/commodities.ts`。把 `production/session-state/active.md` 改成
  `reference/ALIGNMENT_v1.md`。補一段 Farm Futures 期貨脈絡。
- **creative-director**：把 pillar 來源改成 `reference/GAMEPLAY_DECISIONS.md` +
  `reference/ALIGNMENT_v1.md`。補了 cross-AI-session 衝突協議。把所有
  `design/gdd/`、`production/sprints/`、`production/milestones/` 的範例改寫成
  Farm Futures 對應位置。`anti-pillars` 直接列出 C 區的「不做」清單。
- **art-director**：art bible 指向 `reference/ART_DIRECTION.md`。命名規則改成
  Farm Futures 的 kebab-case（不是上游的 underscore）。補了
  `scripts/remove-white-bg.mjs` 為預設後處理。新增「Reviewing Contributed Art」
  workflow 對齊 `public/assets/incoming/` 暫存區。
- **localization-lead**：launch locale 改成 zh-TW + en；i18n 函式庫留 TBD（首次
  invoke 會請 Kevin 在 react-i18next / lingui / FormatJS 三選一）；移除引擎
  特化（Unity Localization Package / Godot tr()）；加了一段「commodity 名稱重用
  Notion 既有翻譯」的指示。
- **qa-lead**：smoke check 改寫成 `npm ci && npm run typecheck && npm run build`；
  release readiness 對齊 `.github/pull_request_template.md`；補了
  `CLAUDE.md` §6 的 forbidden shortcuts（不要用 `--no-verify` 等）。

## 沒帶進來的東西

- 49 個裡其他 44 個 agent（含 17 個 Godot/Unity/Unreal 引擎特化）
- 72 個 slash command / skills
- 39 個文件 template
- 12 個 hooks
- 上游的 permission rules

需要再來一個 PR 加。

## 風險已知

- **i18n 函式庫未選**：`localization-lead` 第一次跑會跳出 `AskUserQuestion`
  讓 Kevin 在 react-i18next / lingui / FormatJS 三選一。
- **Bash 權限**：`qa-lead` 跟 `localization-lead` 有 Bash tool；首次跑
  `npm` 指令會跳權限 prompt。同意一次後可加白名單到
  `.claude/settings.local.json`。
- **Skills 缺失**：`creative-director` 上游有 `skills: [brainstorm,
  design-review]`，`qa-lead` 上游有 `skills: [bug-report,
  release-checklist]`。這版全砍，因為 skills 檔沒帶進來。如果用起來覺得缺
  結構化指令，下個 PR 再補 `.claude/skills/`。
