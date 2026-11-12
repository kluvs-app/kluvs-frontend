// FAQ content for /faq. Static by design: edit this file and ship.
//
// ANCHOR CONTRACT: every `id` below is addressable as kluvs.com/faq#<id>, and the
// mobile app and bot may deep-link to it. Treat ids as a public API: reword the
// question or answer freely, but do NOT rename or remove an id without a redirect plan.
//
// `answer` is Markdown (rendered with react-markdown).

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface FaqCategory {
  id: string
  title: string
  items: FaqItem[]
}

export const faqCategories: FaqCategory[] = [
  {
    id: 'basics',
    title: 'The basics',
    items: [
      {
        id: 'what-is-kluvs',
        question: 'What is Kluvs?',
        answer:
          'Kluvs is a home for your book club. Your club, the book you are reading, and your meetups all live in one place, and you can reach them from the web, the iOS and Android apps, or Discord. It is all one account and the same data everywhere.',
      },
      {
        id: 'need-discord',
        question: 'Do I need Discord to use Kluvs?',
        answer:
          'No. You can create and run a club entirely from the web or the mobile app. Discord is optional: if your club hangs out there, the Kluvs bot adds slash commands and can create Discord events for your discussions.',
      },
      {
        id: 'is-it-free',
        question: 'Is Kluvs free?',
        answer: 'Yes.',
      },
    ],
  },
  {
    id: 'how-it-works',
    title: 'Clubs, sessions & discussions',
    items: [
      {
        id: 'club-session-discussion',
        question: 'How is Kluvs organized? (Club, session, discussion)',
        answer:
          'Kluvs has three levels:\n\n' +
          '- A **club** is your group of readers. It sticks around for as long as you do.\n' +
          '- A **session** is one book your club is reading. A club reads one book at a time; when you finish, you start the next session.\n' +
          '- A **discussion** is a meetup *within* a session. Reading something long? Split it into several discussions, for example "Chapters 1–8" on one date and "Chapters 9–16" on another. A short book might only need one.\n\n' +
          'Put simply: the **club** is who you read with, the **session** is what you are reading, and the **discussions** are when you get together to talk about it.',
      },
      {
        id: 'no-book-on-club-page',
        question: 'Why is there no book showing on my club page?',
        answer:
          'A club only shows a book while it has an active session. A club owner or admin needs to start a new session and pick the book.',
      },
      {
        id: 'who-can-manage',
        question: 'Who can create sessions and discussions?',
        answer:
          'Club owners and admins. Regular members can read along, RSVP to discussions, keep private notes, and track their own reading progress.',
      },
      {
        id: 'finish-vs-delete-session',
        question: 'What is the difference between finishing and deleting a session?',
        answer:
          '**Finishing** a session marks the book as done and credits everyone who was reading it with one more book read. **Deleting** a session removes it as if it never happened, so nobody gets credit. Finishing a session is done from the web or Discord.',
      },
      {
        id: 'rsvp-and-notes',
        question: 'What do RSVPs and notes do?',
        answer:
          'For each discussion you can RSVP yes, no, or maybe so your club knows who is coming. Saying yes also marks you as reading that session. Notes are yours alone: nobody else in the club can see them.',
      },
    ],
  },
  {
    id: 'joining',
    title: 'Joining & roles',
    items: [
      {
        id: 'how-to-join',
        question: 'How do I join a club?',
        answer:
          'There are a few ways:\n\n' +
          '- **Invite link.** If the club has invite links turned on, open the link on the web or in the app and join.\n' +
          '- **Discord.** Run `/join` in the club\'s channel.\n' +
          '- **Added by an admin.** On the web or Discord, a club admin can add you directly.',
      },
      {
        id: 'roles',
        question: 'What is the difference between an owner, an admin, and a member?',
        answer:
          '- **Owner:** created the club, and has full control of it.\n' +
          '- **Admin:** can manage the club\'s sessions, discussions, and members.\n' +
          '- **Member:** reads along, RSVPs, takes notes, and tracks progress.\n\n' +
          'Roles are per club, so you can be an owner in one club and a member in another.',
      },
      {
        id: 'multiple-clubs',
        question: 'Can I be in more than one club?',
        answer: 'Yes. You can join as many clubs as you like, and each one has its own book, members, and discussions.',
      },
      {
        id: 'invite-link-not-working',
        question: 'My invite link is not working. What now?',
        answer:
          'Invite links can expire or reach a maximum number of uses, and an admin can turn them off at any time. Ask a club admin to share a fresh link.',
      },
    ],
  },
  {
    id: 'discord',
    title: 'Discord & your account',
    items: [
      {
        id: 'connect-discord',
        question: 'How do I connect Discord to my Kluvs account?',
        answer:
          'If you signed up with email, Google, or Apple, open Kluvs on the **web** and choose **Connect Discord** in the sidebar. If you start by signing in with Discord, you are connected from the start (this works on web and mobile).\n\n' +
          'Connecting Discord from the mobile app is not available yet.',
      },
      {
        id: 'history-after-linking',
        question: 'I used the bot before making an account. Did I lose my history?',
        answer:
          'No. When you connect Discord, what you did through the bot (like your books-read count and club memberships) is merged into your account automatically. If you end up with two profiles, connecting Discord from the web combines them.',
      },
      {
        id: 'link-club-to-discord',
        question: 'How do I link a club from the web to a Discord channel?',
        answer:
          'In the channel you want, run `/link_club`. If you are starting from Discord instead, `/setup` creates a brand-new club in that channel.',
      },
      {
        id: 'discord-optional-clubs',
        question: 'Can a club exist without a Discord channel?',
        answer: 'Yes. A club created on the web or in the app works fine on its own, and you can link it to a Discord channel later.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Common mistakes',
    items: [
      {
        id: 'bot-no-club-in-channel',
        question: 'The bot says there is no club in this channel.',
        answer:
          'That channel is not linked to a club yet. Use `/setup` to create a club there, or `/link_club` to link one you already made on the web. Each club is tied to one channel.',
      },
      {
        id: 'cant-use-admin-commands',
        question: 'I cannot use the admin commands.',
        answer:
          'You need to be an admin or owner of the club, and in Discord you also need the **Manage Server** permission. If you are not sure, ask your club owner to check your role.',
      },
      {
        id: 'books-read-not-increasing',
        question: 'My books-read count did not go up.',
        answer:
          'Credit is given when a session is **finished**, and only to members who were reading it. Ask an admin to finish the session, and make sure you RSVP\'d yes to a discussion or opted in to the session.',
      },
    ],
  },
  {
    id: 'privacy-data',
    title: 'Your data',
    items: [
      {
        id: 'delete-account',
        question: 'How do I delete my account?',
        answer:
          'You can delete your account from your profile on the web, or from Settings in the mobile app. Instructions are also on the [account deletion page](/delete-account).\n\n' +
          'If you own a club and are its only member, the club is deleted with you. If other people are in it, ownership passes to an admin, or to the member who has been there the longest.',
      },
      {
        id: 'privacy-and-terms',
        question: 'Where can I read the privacy policy and terms?',
        answer: 'Right here: the [Privacy Policy](/privacy) and the [Terms of Use](/terms).',
      },
    ],
  },
]
