const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

export const normalizeAuthEmail = (email: string) => {
  const trimmed = email.trim().toLowerCase();
  const separatorIndex = trimmed.lastIndexOf('@');

  // Si l'adresse est incomplete, on renvoie juste la version nettoyee.
  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
    return trimmed;
  }

  let localPart = trimmed.slice(0, separatorIndex);
  let domain = trimmed.slice(separatorIndex + 1);

  if (GMAIL_DOMAINS.has(domain)) {
    domain = 'gmail.com';
    // Gmail ignore les points et le suffixe +tag; on s'aligne pour éviter les doublons de compte.
    const baseLocalPart = localPart.split('+')[0] || '';
    localPart = baseLocalPart.replace(/\./g, '');
  }

  return `${localPart}@${domain}`;
};

export const authEmailCandidates = (email: string) => {
  const rawEmail = email.trim().toLowerCase();
  const normalizedEmail = normalizeAuthEmail(email);

  // On tente aussi l'email brut pour les comptes historiques crees avant normalisation Gmail.
  return normalizedEmail === rawEmail ? [normalizedEmail] : [normalizedEmail, rawEmail];
};
