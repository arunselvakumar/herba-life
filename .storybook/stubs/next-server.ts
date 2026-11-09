// Stands in for `next/server` in Storybook. Pages only call `connection()` to
// opt out of prerendering, which means nothing in the browser.
export async function connection(): Promise<void> {}
