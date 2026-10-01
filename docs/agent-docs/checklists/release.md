# Checklist — Release

## Versioning (SemVer)

- MAJOR: breaking changes (API, data model, behavior contracts).
- MINOR: backward-compatible features.
- PATCH: backward-compatible fixes.
- SSOT: the version in the package manifest; mirrors: in-app version/news, changelog heading, health endpoint, installer/build labels.

## Ritual

1. [ ] Land all changes on `main`; working tree clean.
2. [ ] Cut changelog: move `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`; add compare links.
3. [ ] Bump version in the manifest (script preferred over manual edits).
4. [ ] Update in-app release notes / version constant; contract test green.
5. [ ] Run full checks on the release commit (all gates + E2E).
6. [ ] Annotated tag `vX.Y.Z`; push tag.
7. [ ] Optional: create the platform release (GitHub Release) with the changelog body.
8. [ ] Verify deploy: production SHA == release commit; smoke test critical flows.
9. [ ] Post-release: monitor errors/health for the first hours.

## Release notes content

- User-visible changes first; breaking changes flagged at top.
- Security fixes without exploit details.
- Known issues listed with impact and workaround; no unlisted known breakage.
- Migration/action required for operators (env vars, DB steps) listed explicitly.

## Database / infrastructure

- [ ] Schema changes already applied forward-compatibly before deploy.
- [ ] New env vars documented and set in all environments.
- [ ] Backups taken before destructive-capable steps (human approval).
- [ ] Rollback path known (previous tag, previous schema is forward-compatible).

## Definition of done

- [ ] Tag exists and points at the release commit.
- [ ] Changelog + in-app news consistent with the tag.
- [ ] Production verified (SHA + smoke).
- [ ] No open P0 incidents from this release.

## NEVER

- Bump versions as a side effect of unrelated commits.
- Ship a bump without in-app news where the product shows release notes.
- Force-push or move a published tag.
