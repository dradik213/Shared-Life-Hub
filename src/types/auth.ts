export type UserGender = 'female' | 'male' | 'non_binary' | 'other';

export interface PronounInfo {
  subject: string;     // e.g. "She", "He", "They"
  object: string;      // e.g. "Her", "Him", "Them"
  possessive: string;  // e.g. "Hers", "His", "Theirs"
  shortLabel: string;  // e.g. "Her", "His", "Their"
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  gender: UserGender;
  customPronoun?: string;
  avatarColor: string; // Tailwind color class or hex
  hubId: string;
  role: 'owner' | 'partner';
  themePreference?: 'dark' | 'light';
  createdAt: string;
}

export interface SharedHub {
  id: string;
  name: string;
  inviteCode: string;
  members: UserAccount[];
  createdAt: string;
}

export function getPronounInfo(gender: UserGender, customPronoun?: string): PronounInfo {
  if (customPronoun && customPronoun.trim().length > 0) {
    const p = customPronoun.trim();
    return {
      subject: p,
      object: p,
      possessive: `${p}'s`,
      shortLabel: p,
    };
  }

  switch (gender) {
    case 'female':
      return {
      subject: 'She',
      object: 'Her',
      possessive: 'Hers',
      shortLabel: 'Her',
    };
    case 'male':
      return {
      subject: 'He',
      object: 'Him',
      possessive: 'His',
      shortLabel: 'His',
    };
    case 'non_binary':
    case 'other':
    default:
      return {
      subject: 'They',
      object: 'Them',
      possessive: 'Theirs',
      shortLabel: 'Their',
    };
  }
}
