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
          'Kluvs is a home for your book club. Your club, the book you are reading, and your meetups all live in one place. You can reach them from the web, the Android or iOS apps, or Discord. It is all one account and the same data everywhere.',
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
        answer: 'Yes!',
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
          'Club owners and admins (and, on Discord, anyone with the Manage Server permission). Regular members can read along, RSVP to discussions, keep private notes, and track their own reading progress.',
      },
      {
        id: 'finish-vs-delete-session',
        question: 'What is the difference between finishing and deleting a session?',
        answer:
          '**Finishing** a session marks the book as done and credits everyone who was reading it with one more book read. **Deleting** a session removes it as if it never happened, so nobody gets credit. Finishing a session is done from the web or Discord.',
      },
      {
        id: 'rsvp',
        question: 'What does RSVPing to a discussion do?',
        answer:
          'For each discussion you can RSVP yes, no, or maybe so your club knows who is coming. Saying yes also marks you as reading that session.',
      },
      {
        id: 'notes',
        question: 'Who can see my discussion notes?',
        answer:
          'Only you. For each discussion you can keep notes to prepare or to remember what was said, and nobody else in the club can see them.',
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
    id: 'discord-servers',
    title: 'Using Kluvs on Discord',
    items: [
      {
        id: 'discord-server-role',
        question: 'What is the role of my Discord server in Kluvs?',
        answer:
          'Your Discord server is the home for the clubs that run on it. When you set Kluvs up, the server is registered with the Kluvs bot, and every club created there belongs to that server. Your server\'s clubs are kept separate from every other server\'s clubs, even if two clubs share the same name.\n\n' +
          'The server itself does not read a book. Clubs do. Think of it as: **server → channels → clubs**.',
      },
      {
        id: 'discord-channel-clubs',
        question: 'Can one Discord server run more than one club?',
        answer:
          'Yes. Each text channel can host its own club, with its own book, members, sessions, and discussions. A server with a #fantasy channel and a #nonfiction channel can run two clubs side by side, each reading something different.\n\n' +
          'Each channel hosts at most one club. To start another club, use a different channel. The same person can be in several clubs on a server, or across servers.',
      },
      {
        id: 'discord-get-started',
        question: 'How do I set up Kluvs on my Discord server?',
        answer:
          '1. Add the Kluvs bot to your server from the [Discord page](/discord).\n' +
          '2. In the channel where you want the club, run `/setup` and give your club a name. This registers your server (the first time) and creates the club in that channel, with you as its owner.\n' +
          '3. Start your first reading session with `/session_create` and choose the book.\n' +
          '4. Ask everyone to run `/join` in that channel to get on the roster.\n\n' +
          'Already made your club on the web? Run `/link_club` in the channel instead of `/setup`. To see everything the bot can do, run `/usage`.',
      },
      {
        id: 'discord-who-manages',
        question: 'Who manages Kluvs on a Discord server?',
        answer:
          'Anyone with the **Manage Server** permission in Discord (including the server owner and administrators) can set Kluvs up and manage every club on that server.\n\n' +
          'On top of that, each club has its own owner and admins, who can manage that club\'s sessions, discussions, and members without needing any special Discord permission.',
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
        question: 'The bot says there is no club in this Discord channel.',
        answer:
          'That Discord channel is not linked to a club yet. Run `/setup` there to create a club, or `/link_club` to link one you already made on the web. Each club is tied to one Discord channel, so make sure you are using the command in the club\'s channel.',
      },
      {
        id: 'cant-use-admin-commands',
        question: 'I cannot use the bot\'s admin commands in Discord.',
        answer:
          'Admin commands need either the **Manage Server** permission in Discord, or an admin or owner role in that club. If you have neither, ask your club owner or a server admin to check your role.',
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
