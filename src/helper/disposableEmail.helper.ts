import disposableEmailDomains from "disposable-email-domains";

const DISPOSABLE_EMAIL_DOMAINS = new Set<string>(disposableEmailDomains);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}
