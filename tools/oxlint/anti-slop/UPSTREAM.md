# anti-slop — provenance

- Source repository: `dmmulroy/anti-slop`
- Installed via: the `install-anti-slop` skill (`.agents/skills/install-anti-slop`), tracked in `skills-lock.json`
- Source commit/version: not pinned by the installer at copy time — the exact upstream revision is unknown (recorded here as unknown rather than guessed, per the skill's own instructions)
- Installed path: `tools/oxlint/anti-slop/`
- Plugin dependency versions: `oxlint@1.83.0`, `@oxlint/plugins@1.83.0` (pinned exactly, matching each other)
- Registered rules: the generic `anti-slop/*` rule set (see `.oxlintrc.json`) plus `oxc/no-accumulating-spread`. The opt-in Effect rule set (`anti-slop-effect/*`) is copied under `effect/` but **not** registered — this project has no `effect` dependency.
- Intentional deviations from the skill's default install: none. `require-readable-spacing` and cast/typeof findings were fixed in application code rather than suppressed; the one exception is `src/lib/form.ts`'s single designated `typeof` type guard, which carries an inline `// oxlint-disable-next-line anti-slop/no-runtime-typeof` because the rule's `allowInTypeGuards` option did not recognize it during testing.
