/**
 * In-app legal copy for Ghost Mode.
 *
 * TODO (before App Store submit): replace with counsel-reviewed Privacy Policy and
 * Terms, host them at a public URL, and add that URL to App Store Connect metadata.
 */

export const LEGAL_DOCUMENTS = {
  safety: {
    id: 'safety',
    badge: 'Your wellbeing',
    title: 'Safety Disclaimer',
    subtitle:
      'Ghost Mode is here to support your healing journey — gently, and with clear boundaries.',
    highlight:
      'Ghost Mode is not therapy, medical advice, or crisis support. If you feel unsafe or may hurt yourself, contact emergency services or a crisis hotline immediately.',
    sections: [
      {
        title: 'What Ghost Mode is',
        body:
          'Ghost Mode offers journaling, mood tracking, reminders, and supportive coaching-style messages to help you stay in no-contact. It is a self-help tool — not a replacement for professional care.',
      },
      {
        title: 'When to reach out for help',
        body:
          'If you are in crisis, thinking about harming yourself or someone else, or need immediate support, please contact local emergency services (such as 911 in the U.S.) or a crisis hotline in your country. You deserve real-time help from trained professionals.',
      },
      {
        title: 'AI Coach limits',
        body:
          'The AI Coach can offer calm encouragement, but it cannot diagnose conditions, prescribe treatment, or respond to emergencies. If something feels overwhelming, pause and talk to someone you trust or a licensed provider.',
      },
    ],
    footer:
      'You are not alone. Reaching out for help is a sign of strength, not weakness.',
  },
  privacy: {
    id: 'privacy',
    badge: 'Privacy',
    title: 'Privacy Policy',
    subtitle:
      'We believe your healing journey is personal. This policy explains how Ghost Mode handles your information.',
    highlight: null,
    sections: [
      {
        title: 'What we collect',
        body:
          'Ghost Mode stores journal entries, mood logs, streak data, reminder preferences, and account details on your device. If cloud sync or sign-in services are added later, this policy will describe what is stored locally, what syncs online, and how long data is kept.',
      },
      {
        title: 'How your data is used',
        body:
          'Your information powers features like streak tracking, progress insights, daily reminders, and the AI Coach. We do not sell your personal journal content. Analytics, AI requests, and third-party services will be described here before they are enabled.',
      },
      {
        title: 'Your choices',
        body:
          'You can delete saved data from Settings at any time. When account services are available, this policy will also explain export, deletion, and how to contact us with privacy questions.',
      },
    ],
    footer: 'Thank you for trusting Ghost Mode with your healing space.',
  },
  terms: {
    id: 'terms',
    badge: 'Terms',
    title: 'Terms of Service',
    subtitle:
      'These terms describe how Ghost Mode is meant to be used and what you can expect from the app.',
    highlight: null,
    sections: [
      {
        title: 'Using Ghost Mode',
        body:
          'Ghost Mode is provided for personal, non-commercial use to support no-contact and emotional healing. You agree to use the app responsibly and not rely on it for medical, legal, or crisis decisions.',
      },
      {
        title: 'Subscriptions',
        body:
          'Premium features may require a paid subscription through the Apple App Store. Billing, renewals, refunds, and cancellation follow Apple’s terms and the Ghost Mode subscription terms shown at purchase.',
      },
      {
        title: 'Limitations',
        body:
          'Ghost Mode is provided on an “as is” basis. To the extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the app. These terms may be updated as the product evolves.',
      },
    ],
    footer: 'We’re building Ghost Mode with care for your healing journey.',
  },
};

export function getLegalDocument(documentId) {
  return LEGAL_DOCUMENTS[documentId] ?? null;
}
