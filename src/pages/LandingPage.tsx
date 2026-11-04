import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DiscordIcon from '../components/icons/DiscordIcon'
import KluvsHexBackground from '../components/KluvsHexBackground'
import { getAppHref } from '../utils/domainNav'
import { eyebrow, headline, cardTitle, card, outlinedButton } from '../constants/marketingStyles'

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ivangarzab.kluvs'

function MatIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 24, lineHeight: 1 }} aria-hidden="true">
      {name}
    </span>
  )
}

function PlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.18 23.76a2 2 0 001.94-.22l11.34-6.55-2.56-2.56-10.72 9.33zM.32 1.34A2 2 0 000 2.42v19.16a2 2 0 00.32 1.08L.4 23.7l10.74-10.74v-.25L.4 1.96l-.08.38zM20.49 10.63l-2.83-1.64-2.87 2.87 2.87 2.87 2.86-1.65a2.03 2.03 0 000-3.45zM5.12.46L16.46 7 13.9 9.56 3.18.22A2 2 0 005.12.46z"/>
    </svg>
  )
}

const features = [
  {
    icon: 'menu_book',
    title: 'The current read',
    description: 'One book at a time, with a finish date everyone can see and progress you can track page by page.',
  },
  {
    icon: 'event',
    title: 'The next discussion',
    description: 'Set a date and a place, say whether you’ll be there, and see who else is coming.',
  },
  {
    icon: 'edit_note',
    title: 'Food for Thought',
    description: 'Note passages and questions as you read, so the good ones make it to the table.',
  },
  {
    icon: 'shelves',
    title: 'Your shelf',
    description: 'Every book your club finishes lands on your shelf. Keep the ones you loved close.',
  },
  {
    icon: 'group_add',
    title: 'Pull up a chair',
    description: 'Share an invite link and friends join in one tap. No setup, no spreadsheets.',
  },
  {
    icon: 'history_edu',
    title: 'Your reading life',
    description: 'A running log of what you’ve read, who you read it with, and the discussions you made it to.',
  },
]

const screens = [
  { src: '/screens/screen-3.jpg', alt: 'A club’s overview in Kluvs, showing the active session and the next discussion' },
  { src: '/screens/screen-1.jpg', alt: 'The Me screen in Kluvs, showing books in progress on your shelf' },
  { src: '/screens/screen-4.jpg', alt: 'A club’s discussion timeline in Kluvs, with attendance for each meeting' },
]

function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`w-[220px] shrink-0 rounded-[32px] bg-[#0F0D0A] dark:bg-[var(--color-bg-elevated)] p-[7px] ring-1 ring-[#332B24] dark:ring-[var(--color-text-disabled)] shadow-[0_24px_48px_-20px_rgba(20,15,13,0.35)] dark:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="block w-full rounded-[26px]" />
    </div>
  )
}

export default function LandingPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent('Kluvs Contact Form')
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    window.location.href = `mailto:kluvs.app@gmail.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header showOpenAppButton={true} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden min-h-[640px] px-6 pb-24 text-center">
        <KluvsHexBackground />
        <div className="relative z-10 pt-[260px]">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif font-medium italic text-[40px] sm:text-[48px] leading-[1.1] text-[var(--color-text-primary)] mb-6">
              Reading is done best together.
            </h1>
            <p className="text-body-lg text-[var(--color-text-secondary)] mb-10 max-w-lg mx-auto">
              Kluvs gives your book club a quiet place to keep the current read, the next discussion, and everything you meant to bring up. On your phone and on the web.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white rounded-btn px-6 py-3 font-medium text-body transition-colors"
              >
                <PlayIcon />
                Get it on Google Play
              </a>
              <a href={getAppHref('/me')} className={outlinedButton}>
                <MatIcon name="language" className="!text-[20px]" />
                Open in your browser
              </a>
            </div>
            <p className="mt-6 text-helper text-[var(--color-text-meta)]">
              iPhone coming soon
              <span className="mx-2" aria-hidden="true">·</span>
              <Link to="/discord" className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors">
                <DiscordIcon className="w-3.5 h-3.5" />
                Run your club on Discord
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-[var(--color-divider)]">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>Inside a club</p>
            <h2 className={headline}>Everything between meetings</h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Platforms */}
      <section className="px-6 py-20 bg-[var(--color-bg-bar)] border-y border-[var(--color-divider)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
          <div>
            <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>Wherever you read</p>
            <h2 className={`${headline} mb-3`}>Your club follows you</h2>
            <p className="text-body-lg text-[var(--color-text-secondary)] mb-8 max-w-md">
              Start on your phone, pick it up on your laptop. Everything stays in step.
            </p>
            <ul className="space-y-3 max-w-md">
              <li>
                <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className={`${card} flex items-center gap-4 p-4 hover:border-[var(--color-text-disabled)] transition-colors`}>
                  <PlayIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                  <span className="flex-1">
                    <span className="block text-body font-medium text-[var(--color-text-primary)]">Android</span>
                    <span className="block text-helper text-[var(--color-text-meta)]">Available on Google Play</span>
                  </span>
                  <MatIcon name="arrow_outward" className="text-[var(--color-text-meta)] !text-[18px]" />
                </a>
              </li>
              <li>
                <a href={getAppHref('/me')} className={`${card} flex items-center gap-4 p-4 hover:border-[var(--color-text-disabled)] transition-colors`}>
                  <MatIcon name="language" className="text-[var(--color-text-secondary)] !text-[20px] shrink-0" />
                  <span className="flex-1">
                    <span className="block text-body font-medium text-[var(--color-text-primary)]">Web</span>
                    <span className="block text-helper text-[var(--color-text-meta)]">Open in any browser</span>
                  </span>
                  <MatIcon name="arrow_outward" className="text-[var(--color-text-meta)] !text-[18px]" />
                </a>
              </li>
              <li>
                <Link to="/discord" className={`${card} flex items-center gap-4 p-4 hover:border-[var(--color-text-disabled)] transition-colors`}>
                  <DiscordIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                  <span className="flex-1">
                    <span className="block text-body font-medium text-[var(--color-text-primary)]">Discord</span>
                    <span className="block text-helper text-[var(--color-text-meta)]">A companion bot for your server</span>
                  </span>
                  <MatIcon name="arrow_forward" className="text-[var(--color-text-meta)] !text-[18px]" />
                </Link>
              </li>
              <li className="flex items-center gap-4 px-4 py-2">
                <MatIcon name="phone_iphone" className="text-[var(--color-text-disabled)] !text-[20px] shrink-0" />
                <span className="text-helper text-[var(--color-text-meta)]">iPhone is on its way.</span>
              </li>
            </ul>
          </div>

          <div className="py-6 flex justify-center items-center gap-5">
            <Phone {...screens[0]} className="hidden md:block translate-y-6" />
            <Phone {...screens[1]} />
            <Phone {...screens[2]} className="hidden md:block translate-y-6" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto">
          <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>Contact</p>
          <h2 className={`${headline} mb-3`}>Write to us</h2>
          <p className="text-body-lg text-[var(--color-text-secondary)] mb-8">
            Questions, ideas, or a book we should read next. We read everything.
          </p>

          {submitted ? (
            <div className={`${card} p-6 text-center`}>
              <p className={`${cardTitle} mb-1`}>Thank you for writing.</p>
              <p className="text-body text-[var(--color-text-secondary)]">We’ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-body font-medium text-[var(--color-text-primary)] mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-2 text-[var(--color-text-primary)] text-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-body font-medium text-[var(--color-text-primary)] mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-2 text-[var(--color-text-primary)] text-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-body font-medium text-[var(--color-text-primary)] mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-2 text-[var(--color-text-primary)] text-body focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="What’s on your mind?"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-btn font-medium text-body-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
