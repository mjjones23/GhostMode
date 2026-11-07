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
          'Ghost Mode stores journal entries, mood logs, streak data, reminder preferences, AI Coach conversations, saved coach memories, and account details on your device. Account details include your name, email address, and password credentials. Saved memories are short preferences you choose to keep. If cloud sync or other online account services are added later, this policy will describe what stays on the device, what is stored online, and how long it is kept.',
      },
      {
        title: 'How your data is used',
        body:
          'Your information powers features like streak tracking, progress insights, daily reminders, and the AI Coach. We do not sell your personal journal content. Journal entries stay on your device and are not sent with AI Coach requests.',
      },
      {
        title: 'AI Coach conversations',
        body:
          'AI Coach messages are saved on this device. For an ordinary message, that message and recent messages from the conversation are sent to the Ghost Mode backend. When OpenAI is available, the backend asks OpenAI for a reply. If OpenAI cannot be reached, the app shows a built-in reply instead. If the app recognizes a crisis message, it answers on this device and does not send that message, saved memories, or recovery context. A message the app does not recognize as a crisis message is sent in the ordinary way. The coach is a self-help tool. It is not therapy, medical advice, or crisis support.',
      },
      {
        title: 'Saved memories',
        body:
          'Saved memories are stored only on your device. Sharing them with the AI Coach is optional and turned off by default. When you turn sharing on, the memories you saved are included with an ordinary coach message sent to the Ghost Mode backend, which includes them when it asks OpenAI for a reply. They are not included with a crisis message. You can view and delete saved memories in Settings. Clearing the chat removes the conversation and does not delete saved memories. Deleting all local data from Settings removes saved memories together with the other data stored on this device.',
      },
      {
        title: 'Recovery context',
        body:
          'Sharing recovery context is separate from saved memories. It is optional and turned off by default. When you turn it on, Ghost Mode may send only your no-contact streak day, today’s mood, and recovery goal with an ordinary coach message. It does not send your journal, email, or password. Recovery context is not sent with a crisis message.',
      },
      {
        title: 'How long information is kept',
        body:
          'Journal entries, moods, streaks, reminders, AI Coach conversations, saved memories, and account details stay on your device until you delete them in the app. Deleting them removes the copy Ghost Mode stores. Ghost Mode cannot promise that a device backup no longer contains that information. The Ghost Mode backend does not keep coach conversations, saved memories, or recovery context in a database. This version does not write coach message text into its application logs. Logs saved before that change, including logs from an earlier server version, may still contain coach messages. This policy cannot say how long the hosting provider keeps those older logs. When the backend asks OpenAI for a reply, OpenAI processes that request. Deleting data in the app does not remove that request from OpenAI, and this policy does not control how long OpenAI keeps it.',
      },
      {
        title: 'Your choices',
        body:
          'In Settings, you can delete one saved memory, delete all saved memories, or delete all local data. Delete account removes the on-device account, journal, moods, streak, reminders, AI Coach conversation, saved memories, and the other Ghost Mode data stored on this device. Clearing the chat removes the conversation on this device and does not delete saved memories. You can delete the journal entries shown in the journal. Logging out does not delete saved data.',
      },
      {
        title: 'Purchases',
        body:
          'Ghost Mode may offer optional premium subscriptions through Apple’s App Store. Payment information is processed by Apple. We do not receive or store your payment card information. This version makes the app’s features available without a purchase.',
      },
      {
        title: 'Children’s privacy',
        body:
          'Ghost Mode is intended for people 13 and older. Before creating an account, you must confirm that you are 13 or older. That confirmation is your own statement. Ghost Mode does not ask for your birth date and does not verify your age.',
      },
      {
        title: 'Contact',
        body:
          'If you have questions about this policy, contact Mealcolist Jones at mealcolistjones@yahoo.com.',
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
          'All Ghost Mode AI features are currently free. If paid subscriptions return later, billing, renewals, refunds, and cancellation will follow Apple’s terms and the Ghost Mode subscription terms shown at purchase.',
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
