import Header from '../components/Header'
import Footer from '../components/Footer'
import DiscordIcon from '../components/icons/DiscordIcon'
import HowItWorksSection from '../components/HowItWorksSection'
import { eyebrow, headline, cardTitle, card, outlinedButton } from '../constants/marketingStyles'

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1327360422294192199'
const SUPPORT_URL = 'https://discord.gg/rCvpNB5pft'
const TOPGG_URL = 'https://top.gg/bot/1327360422294192199'

function MatIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 24, lineHeight: 1 }} aria-hidden="true">
      {name}
    </span>
  )
}

const features = [
  {
    icon: 'tag',
    title: 'One club per channel',
    description: 'Link a club to any text channel. One server can run as many clubs as it likes.',
  },
  {
    icon: 'menu_book',
    title: 'The current read, on call',
    description: 'Ask for the book, the finish date, or the whole session with a single slash command.',
  },
  {
    icon: 'event',
    title: 'Discussions on the calendar',
    description: 'Schedule a discussion and Kluvs creates the matching Discord event, so nobody misses it.',
  },
  {
    icon: 'auto_awesome',
    title: 'AI book summaries',
    description: 'Catch up on what you\'re reading with a summary posted right in the channel.',
  },
]

const userCommands = [
  { name: '/help', description: 'Getting started guide' },
  { name: '/usage', description: 'View all available commands' },
  { name: '/join', description: 'Join the book club in this channel' },
  { name: '/leave', description: 'Leave the book club in this channel' },
  { name: '/book', description: 'Show current book details' },
  { name: '/session', description: 'Show all session details' },
  { name: '/due_date', description: 'Show the session due date' },
  { name: '/discussions', description: 'View scheduled discussion topics' },
  { name: '/book_summary', description: 'AI-generated book summary' },
  { name: '/support', description: 'Get help in the community server' },
  { name: '/donate', description: 'Support the Kluvs project' },
  { name: '/vote', description: 'Vote for Kluvs on top.gg' },
  { name: '/bug', description: 'Report a bug to the team' },
  { name: '/feedback', description: 'Send feedback to the team' },
]

const adminCommands = [
  { name: '/setup', description: 'First-run wizard: register server and create a club' },
  { name: '/admin_help', description: 'Show the full admin command reference' },
  { name: '/server_register', description: 'Register this Discord server' },
  { name: '/server_update', description: 'Update the server name' },
  { name: '/server_delete', description: 'Delete server and all data' },
  { name: '/club_create', description: 'Create a new book club' },
  { name: '/club_update', description: 'Update club name or channel' },
  { name: '/club_delete', description: 'Delete the club' },
  { name: '/member_add', description: 'Add a member to the club' },
  { name: '/member_remove', description: 'Remove a member from the club' },
  { name: '/member_role', description: 'Set a member\'s role (admin or member)' },
  { name: '/session_create', description: 'Create a reading session' },
  { name: '/session_update', description: 'Update due date or book details' },
  { name: '/session_delete', description: 'Delete the active session' },
  { name: '/discussion_add', description: 'Add a discussion and create a Discord event' },
  { name: '/discussion_update', description: 'Update an existing discussion' },
  { name: '/discussion_delete', description: 'Delete a discussion' },
  { name: '/discussion_sync', description: 'Create Discord events for discussions missing one' },
  { name: '/version', description: 'Show the current bot version' },
]

export default function DiscordPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="max-w-2xl mx-auto">
          <p className={`${eyebrow} text-[var(--color-text-meta)] mb-4`}>Kluvs for Discord</p>
          <h1 className="font-serif font-medium italic text-[40px] sm:text-[48px] leading-[1.1] text-[var(--color-text-primary)] mb-6">
            Your club, right in your server.
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)] mb-10 max-w-lg mx-auto">
            The Kluvs bot keeps the current read, the next discussion, and your members in step without leaving Discord. Everything stays in sync with the app.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Add Kluvs bot to your Discord server"
              className="flex items-center justify-center gap-3 bg-discord text-white rounded-btn px-6 py-3 font-medium text-body transition-opacity hover:opacity-90"
            >
              <DiscordIcon className="w-5 h-5" />
              Add to Server
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the Kluvs support server"
              className={outlinedButton}
            >
              Join Support Server
            </a>
          </div>
          <p className="mt-6 text-helper text-[var(--color-text-meta)]">
            <a
              href={TOPGG_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Kluvs on top.gg"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              Find us on <span style={{ color: '#EC4869' }}>top.gg</span>
            </a>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-[var(--color-divider)]">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>In your server</p>
            <h2 className={headline}>Book club, by slash command</h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className={`${card} p-6`}>
                <MatIcon name={feature.icon} className="text-[var(--color-text-secondary)] mb-4 block" />
                <h3 className={`${cardTitle} mb-2`}>{feature.title}</h3>
                <p className="text-body text-[var(--color-text-secondary)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--color-divider)]">
        <HowItWorksSection />
      </div>

      {/* Commands */}
      <section className="px-6 py-20 bg-[var(--color-bg-bar)] border-t border-[var(--color-divider)]">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>Reference</p>
            <h2 className={`${headline} mb-3`}>Commands</h2>
            <p className="text-body-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
              All commands use Discord's slash command system. Admin commands need the server owner or a club admin.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {[
              { title: 'Member Commands', commands: userCommands },
              { title: 'Admin Commands', commands: adminCommands },
            ].map(({ title, commands }) => (
              <div key={title} className={`${card} p-6`}>
                <h3 className={`${eyebrow} text-[var(--color-text-meta)] mb-4`}>{title}</h3>
                <div>
                  {commands.map((cmd) => (
                    <div key={cmd.name} className="flex items-start gap-3 py-2.5 border-b border-[var(--color-divider)] last:border-0">
                      <code className="text-[13px] font-mono text-primary shrink-0 mt-px">{cmd.name}</code>
                      <span className="text-body text-[var(--color-text-secondary)]">{cmd.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
