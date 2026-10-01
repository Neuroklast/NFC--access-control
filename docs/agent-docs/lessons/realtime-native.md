# Lessons — Realtime & Native (C++/Audio)

Load for: C++, audio thread, plugin, embedded work. Consolidated, anonymized.

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| 2026-09 | Audio thread | No allocation, locking, logging, or string copies in `processBlock` or anything it calls; prepare sizes everything. | high |
| 2026-09 | Audio thread | Shared state between threads uses atomics/FIFO (POD events in SPSC ring), never raw shared pointers. | high |
| 2026-09 | Audio thread | On lock-miss or CPU hold, output the last wet frame or silence — NEVER raw input (clicks). | high |
| 2026-09 | Audio thread | `SmoothedValue`-style ramps must be initialized in prepare, or the first block ramps from 0. | med |
| 2026-09 | Audio thread | Filter coefficients update at control rate (stride), not per sample, unless proven necessary. | med |
| 2026-09 | Audio thread | Runtime coefficient builders must not allocate; preallocate prepared coefficient storage. | high |
| 2026-09 | Host integration | Report latency for the longest audible path; bypass must delay dry by the reported latency (PDC). | high |
| 2026-09 | Host integration | Host blocks larger than prepared MUST be sliced before oversampling — never resize in the callback. | high |
| 2026-09 | Host integration | State restore must not overwrite machine-wide preferences; re-apply globals after replace-state. | med |
| 2026-09 | Host integration | `parameterChanged` must not persist prefs or do file I/O; queue atomic requests, persist on the message thread. | med |
| 2026-09 | Host integration | Reset oversampling/sanitizer/rings on sleep/wake and non-realtime transitions, with a short fade. | med |
| 2026-09 | Plugins | The webview/browser belongs to the processor, not the editor — editor close must not destroy it. | high |
| 2026-09 | Plugins | Per-instance user-data folders for embedded browsers; a shared profile corrupts state. | med |
| 2026-09 | Plugins | Intercept and forward keyboard for non-text keys to the host; never steal focus silently. | med |
| 2026-09 | Plugins | macOS AU sandbox forbids RWX — JIT only where allowed (Windows), interpreter fallback elsewhere. | high |
| 2026-09 | DSP | A true-peak brickwall is the peak safety; residual policy lives in ONE sanitizer (mute only there). | high |
| 2026-09 | DSP | One timeline: dry sidechain delay must equal oversampled wet latency, or transient smear appears. | high |
| 2026-09 | DSP | Never fake-recover meters/EMAs after overload — fix the signal path, not the display. | med |
| 2026-09 | DSP | Hard clip/fold/bitcrush stages need a low-pass after them (documented rule, test-enforced). | med |
| 2026-09 | Tests | Contract tests must fail first; a "contract" with no failing state proves nothing. | high |
| 2026-09 | Tests | Test runners must return failure counts as exit codes; a green `ctest` with internal failures is worthless. | high |
| 2026-09 | Tests | Visual dumps of geometry (not golden PNGs) for layout contracts — PNGs drift across machines. | med |
| 2026-09 | Build | Reconfigure on every local build; stale CMake caches hide changes. | med |
| 2026-09 | Build | One version string across CMake/plugin/installer/packaging; never "also bump" during unrelated work. | med |
| 2026-09 | Build | LTO on product targets only; never global fast-math. | med |
| 2026-09 | CI | Native CI is expensive: manual dispatch or release checkpoints; pin validator versions (pluginval etc.). | low |
| 2026-09 | CI | Ad-hoc codesign before AU validation; kill stale registrars first. | med |
| 2026-09 | Process | Replace the wrong model instead of patching symptoms (no special-case branches for one preset). | high |
| 2026-09 | Process | Screenshots are the UI spec; never tick status boxes a screenshot contradicts. | med |
