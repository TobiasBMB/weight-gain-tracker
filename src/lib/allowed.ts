/** Only the emails in ALLOWED_EMAILS may sign up or call the AI features. Empty means nobody. */
export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
