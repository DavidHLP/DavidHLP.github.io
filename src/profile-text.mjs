export function profileText(profile) {
  if (!profile) return "";
  return [profile.role, profile.summary, profile.location, ...(profile.contacts ?? []).map(contact =>
    contact.href ? `${contact.label}: ${contact.href}` : contact.label)].filter(Boolean).join("\n");
}
