# Enhancement Backlog

## UI / Interaction

### Task row hover highlight
Animate a highlight on the active task row on mouseover. Should be smooth (CSS transition) rather than an instant colour swap.

### Remove ±5m / ±5h estimate buttons
Strip the 5-minute and 5-hour increment/decrement controls from the estimate UI. Simplify to fewer, more useful step sizes or remove the concept entirely.

### Project colour theming
SuperProductivity projects expose a colour property. Use it to tint the project section header (and ideally the project grouping pill/label) so sections are visually distinct at a glance.

---

## Search & Filtering

### Pinned search / filter / sort bar
A control strip fixed to the top of the panel (does not scroll away), combining text search with one-click filter shortcuts and sort options.

**Text search**
- Matching on project name collapses all other projects and shows all tasks in that project.
- Matching on a parent task shows the parent and all its sub-tasks.
- Matching on a sub-task shows it within its parent context.
- No match → show nothing (or a "no results" state).

**Filter shortcuts** (toggleable chips/buttons, combinable)
- Scheduled — only tasks with a start time set.
- Unscheduled — only tasks without a start time.
- Estimated — only tasks with a non-zero time estimate.
- Unestimated — only tasks with no estimate.

**Sort options**
- Default (project order).
- Estimate: low → high.
- Estimate: high → low.
- Scheduled time: earliest first.

**Key workflow this unlocks**
Unscheduled + Estimated, sorted by estimate low → high: surfaces the smallest defined pieces of work that haven't been committed to a time slot yet — quick wins to knock off when a gap appears in the day.

### Scheduled vs unscheduled visualisation
Make it immediately obvious which tasks have a start time set and which don't, without having to read each row.

Options to explore (non-exclusive):
- Distinct background or left-border tint on scheduled rows.
- A small clock/pin icon on scheduled tasks showing the time at a glance.
- Group or sort: scheduled tasks float to the top (or a dedicated section) within their project, ordered by start time; unscheduled tasks follow.
- Unscheduled tasks are visually muted (reduced opacity or greyed label) to push attention toward the scheduled work.

### Total estimated time summary
A footer (or header stat) showing the total estimated time for the current view — e.g. "4h 20m across 8 tasks". Updates reactively as filters change. Most useful with the Unscheduled + Estimated filter to gauge backlog size at a glance.

### Keyboard navigation
Tab through task rows, arrow keys to nudge estimates, Enter to confirm. Panel should be fully usable without reaching for the mouse.

### Estimate staleness indicator
If SP exposes when an estimate was last modified, show a subtle visual flag on estimates that haven't been touched in a while (threshold TBD, e.g. > 2 weeks). Estimates go stale and are easy to forget about.

---

## Scheduling

### Schedule parent task → propagate to sub-tasks
When a start time is set on a parent task, distribute scheduled times to its sub-tasks sequentially, respecting their estimates relative to the parent's start time.

Example: parent starts at 09:00, sub-task A has a 30 min estimate → scheduled 09:00, sub-task B has a 1 hr estimate → scheduled 09:30, and so on.

Edge cases to consider:
- Sub-tasks with no estimate (skip or treat as zero duration).
- Sub-tasks that already have an explicit schedule — show a confirmation dialog before overwriting.
- Clearing the parent schedule — show a confirmation dialog before cascading the clear to sub-tasks.
- Confirmation dialogs should be SolidJS modal overlays built into the plugin (not browser `confirm()` or SP's native dialog API) so styling stays consistent with the plugin UI.

---

## Out of scope — covered by base SuperProductivity

These were considered but SP already provides them natively. Do not re-implement.

- **Timeline / day view** — SP has a built-in schedule/timeline view.
- **Overdue / at-risk indicators** — SP surfaces overdue and at-risk tasks in its own UI.
