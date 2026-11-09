/**
 * axe rule overrides shared by every story. `.storybook/preview.tsx` applies
 * them globally; `knownIssues()` builds on them, so a story that switches a
 * rule off still keeps these.
 */
export const baseA11yRules = [
  {
    // Known issues (WCAG 2.5.3), excluded by element so the rule still guards
    // everything else; remove each exclusion once that label changes:
    // - the header's logo link and account button (every console screen):
    //   their aria-labels don't contain their visible text;
    // - DayNav's day picker (day-nav.tsx): labelled "Pick a day, <date>
    //   selected" while it shows a "Today"/"Yesterday" chip or, on phones, a
    //   compact date that isn't in the label.
    id: "label-content-name-mismatch",
    selector:
      '*:not([data-testid="user-menu-trigger"]):not([aria-label="Herbalife, go to the overview"]):not([aria-label^="Pick a day"])',
  },
];

type Rule = { id: string; selector?: string; enabled?: boolean };

/**
 * Switches off the named axe rules for a story or meta while every other
 * check keeps running. Always pair it with a `// Known issue:` comment
 * naming the element, the measurement and why it isn't fixed here:
 *
 *   parameters: {
 *     // Known issue: …
 *     a11y: knownIssues("color-contrast"),
 *   }
 */
export function knownIssues(...ruleIds: string[]): { config: { rules: Rule[] } } {
  return {
    config: {
      rules: [...baseA11yRules.filter((r) => !ruleIds.includes(r.id)), ...ruleIds.map((id) => ({ id, enabled: false }))],
    },
  };
}

/** Puts every rule back on for one story under a meta that uses `knownIssues()`. */
export const fullCheck: { config: { rules: Rule[] } } = { config: { rules: baseA11yRules } };
