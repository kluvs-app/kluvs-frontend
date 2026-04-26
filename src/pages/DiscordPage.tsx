import { Link } from 'react-router-dom'

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1327910712454152275'
const SUPPORT_URL = 'https://discord.gg/rCvpNB5pft'
const TOPGG_URL = '#'

function GlobeIcon() {
  return (
    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg className="w-7 h-7 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.032.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

const features = [
  {
    icon: <GlobeIcon />,
    title: 'One Club per Channel',
    description: 'Every channel can have its own independent club, complete with sessions, members, and discussions.',
  },
  {
    icon: <BookIcon />,
    title: 'Session Tracking',
    description: 'Track the current book, due dates, and reading progress. Keep every member on the same page with a single slash command.',
  },
  {
    icon: <SparkleIcon />,
    title: 'AI Summaries',
    description: 'Get AI-generated book summaries powered by modern LLMs straight in your Discord channel.',
  },
  {
    icon: <CalendarIcon />,
    title: 'Discussion Scheduling',
    description: 'Organize and log discussion topics for each session so no great idea gets lost in the chat.',
  },
]

const userCommands = [
  { name: '/help', description: 'Getting started guide' },
  { name: '/usage', description: 'View all available commands' },
  { name: '/join', description: 'Join the book club in this channel' },
  { name: '/leave', description: 'Leave the book club in this channel' },
  { name: '/book', description: 'Show current book details' },
  { name: '/session', description: 'Show all session details' },
  { name: '/duedate', description: 'Show the session due date' },
  { name: '/discussions', description: 'View scheduled discussion topics' },
  { name: '/book_summary', description: 'AI-generated book summary' },
]

const adminCommands = [
  { name: '!setup', description: 'First-run wizard: register server and create a club' },
  { name: '!admin_help', description: 'Show the full admin command reference' },
  { name: '!club_create', description: 'Create a new book club' },
  { name: '!club_update', description: 'Update club name or channel' },
  { name: '!club_delete', description: 'Delete the club' },
  { name: '!session_create', description: 'Create a reading session with book and author' },
  { name: '!session_update', description: 'Update due date or book details' },
  { name: '!session_delete', description: 'Delete the active session' },
  { name: '!member_add', description: 'Add a member to the club' },
  { name: '!member_remove', description: 'Remove a member from the club' },
  { name: '!member_role', description: 'Set a member\'s role (admin or member)' },
]

export default function DiscordPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src="/ic-mark.svg" alt="Kluvs" className="h-8 w-8" />
          <span className="text-section-heading text-[var(--color-text-primary)]">Kluvs</span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">

          {/* CTA row 1 — primary action */}
          <div className="flex justify-center mb-8">
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Add Kluvs bot to your Discord server"
              className="flex items-center gap-3 text-white px-8 py-3 rounded-btn font-medium text-body-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5865F2' }}
            >
              <DiscordIcon />
              Add to Server
            </a>
          </div>

          <h1 className="text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
            Your Book Club's<br />favorite Discord companion.
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)] mb-10 max-w-lg mx-auto">
            The Kluvs bot brings session tracking, member management, and AI-powered book summaries directly into your Discord server.
          </p>

          {/* CTA row 2 — secondary actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the Kluvs support server"
              className="flex items-center justify-center gap-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] border border-[var(--color-divider)] rounded-btn px-6 py-3 font-medium text-body transition-colors"
            >
              Join Support Server
            </a>
            <a
              href={TOPGG_URL}
              aria-label="View Kluvs on top.gg"
              className="flex items-center justify-center gap-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] border border-[var(--color-divider)] rounded-btn px-6 py-3 font-medium text-body transition-colors"
            >
              View on top.gg
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-[var(--color-bg-raised)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section-heading text-[var(--color-text-primary)] text-center mb-12">
            Everything your book club needs, in Discord
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[var(--color-bg)] rounded-card border border-[var(--color-divider)] p-6"
              >
                <div className="h-12 w-12 bg-[var(--color-bg-raised)] rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-card-heading text-[var(--color-text-primary)] mb-2">{feature.title}</h3>
                <p className="text-body text-[var(--color-text-secondary)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commands */}
      <section className="px-6 py-16 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section-heading text-[var(--color-text-primary)] text-center mb-4">
            Commands
          </h2>
          <p className="text-body text-[var(--color-text-secondary)] text-center mb-12">
            Slash commands are available to all members. Admin commands (prefix <code className="bg-[var(--color-bg-raised)] px-1.5 py-0.5 rounded text-sm font-mono">!</code>) require the guild owner or club admin role.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* User commands */}
            <div>
              <h3 className="text-card-heading text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary inline-block" />
                Member Commands
              </h3>
              <div className="space-y-2">
                {userCommands.map((cmd) => (
                  <div key={cmd.name} className="flex items-start gap-3 py-2 border-b border-[var(--color-divider)] last:border-0">
                    <code className="text-sm font-mono text-primary shrink-0 mt-0.5">{cmd.name}</code>
                    <span className="text-body text-[var(--color-text-secondary)]">{cmd.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin commands */}
            <div>
              <h3 className="text-card-heading text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-tertiary inline-block" />
                Admin Commands
              </h3>
              <div className="space-y-2">
                {adminCommands.map((cmd) => (
                  <div key={cmd.name} className="flex items-start gap-3 py-2 border-b border-[var(--color-divider)] last:border-0">
                    <code className="text-sm font-mono text-primary shrink-0 mt-0.5">{cmd.name}</code>
                    <span className="text-body text-[var(--color-text-secondary)]">{cmd.description}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-divider)] px-6 py-8 text-center space-y-2">
        <p className="text-helper text-[var(--color-text-secondary)]">
          © 2026 Kluvs. All rights reserved.
        </p>
        <p className="text-helper space-x-3">
          <Link
            to="/privacy"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-[var(--color-divider)]">·</span>
          <Link
            to="/terms"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
          >
            Terms of Use
          </Link>
        </p>
      </footer>

    </div>
  )
}
