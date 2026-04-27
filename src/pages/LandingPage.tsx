import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DiscordIcon from '../components/icons/DiscordIcon'

function BookIcon() {
  return (
    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-7 h-7 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

const features = [
  {
    icon: <BookIcon />,
    title: 'Reading Sessions',
    description: 'Track your club\'s current book and reading progress. Set session goals, log completion dates, and keep everyone on the same page.',
  },
  {
    icon: <ChatIcon />,
    title: 'Discussions',
    description: 'Schedule and log book club discussions with ease. Record where you met, what you talked about, and when you\'ll meet next.',
  },
  {
    icon: <UsersIcon />,
    title: 'Member Management',
    description: 'Keep track of your members, roles, and reading stats. See who\'s read the most books and celebrate your top readers.',
  },
]

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
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <img src="/ic-mark.svg" alt="" className="h-20 w-20 mx-auto mb-8" />
          <h1 className="text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
            Your Book Club,<br />organized.
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)] mb-10 max-w-lg mx-auto">
            Kluvs helps book clubs track reading sessions, manage discussions, and keep members engaged — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* TODO: replace href with real Google Play Store URL */}
            <a
              href="#"
              aria-label="Download on Google Play"
              className="flex items-center justify-center gap-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] border border-[var(--color-divider)] rounded-btn px-6 py-3 font-medium text-body transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.18 23.76a2 2 0 001.94-.22l11.34-6.55-2.56-2.56-10.72 9.33zM.32 1.34A2 2 0 000 2.42v19.16a2 2 0 00.32 1.08L.4 23.7l10.74-10.74v-.25L.4 1.96l-.08.38zM20.49 10.63l-2.83-1.64-2.87 2.87 2.87 2.87 2.86-1.65a2.03 2.03 0 000-3.45zM5.12.46L16.46 7 13.9 9.56 3.18.22A2 2 0 005.12.46z"/>
              </svg>
              Google Play
            </a>
            {/* TODO: replace href with real App Store URL */}
            <a
              href="#"
              aria-label="Download on the App Store"
              className="flex items-center justify-center gap-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] border border-[var(--color-divider)] rounded-btn px-6 py-3 font-medium text-body transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.84M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
          </div>

          {/* Discord bot link */}
          <div className="flex justify-center mt-3">
            <Link
              to="/discord"
              className="flex items-center justify-center gap-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] border border-[var(--color-divider)] rounded-btn px-6 py-3 font-medium text-body transition-colors"
            >
              <DiscordIcon className="w-5 h-5 text-white" />
              Discord Bot
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-[var(--color-bg-raised)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section-heading text-[var(--color-text-primary)] text-center mb-12">
            Everything your book club needs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Contact */}
      <section className="px-6 py-16 bg-[var(--color-bg)]">
        <div className="max-w-lg mx-auto">
          <h2 className="text-section-heading text-[var(--color-text-primary)] mb-2">Contact Us</h2>
          <p className="text-body text-[var(--color-text-secondary)] mb-8">
            Have a question or feedback? We'd love to hear from you.
          </p>

          {submitted ? (
            <div className="bg-secondary/10 border border-secondary/30 rounded-card p-6 text-center">
              <p className="text-card-heading text-[var(--color-text-primary)] mb-1">Thanks for reaching out!</p>
              <p className="text-body text-[var(--color-text-secondary)]">We'll be in touch soon.</p>
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
                  placeholder="Tell us what's on your mind..."
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

      {/* Footer */}
      <Footer />

    </div>
  )
}
