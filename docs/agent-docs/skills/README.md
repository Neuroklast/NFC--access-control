# Skills — Index

Task-specific skills (one `SKILL.md` per folder, Agent Skills spec). Load a
skill only when its `description` matches the task
([core/context-budget.md](../core/context-budget.md)).

| Skill | Use when |
| --- | --- |
| [adopt-into-project](adopt-into-project/SKILL.md) | Adopt this collection into a target repo |
| [plan-first](plan-first/SKILL.md) | Non-trivial task: plan before coding |
| [anti-overengineering](anti-overengineering/SKILL.md) | Implement/refactor/review: YAGNI filter, no speculative code |
| [tdd-extraction](tdd-extraction/SKILL.md) | Bug/feature: derive the failing test first |
| [rest-guidelines](rest-guidelines/SKILL.md) | API design/review (REST wire format) |
| [frontend-ui](frontend-ui/SKILL.md) | UI implementation workflow |
| [security-owasp](security-owasp/SKILL.md) | Security review |
| [launch-compliance-audit](launch-compliance-audit/SKILL.md) | DE/EU go-live audit |
| [c-realtime](c-realtime/SKILL.md) | C/C++ realtime / safety-critical |
| [video-scrubbing](video-scrubbing/SKILL.md) | Scroll-bound video (explicitly requested) |

Install into a target repo: `node scripts/install-skills.mjs <target-repo>`.
