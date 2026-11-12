import { Link } from 'react-router-dom'
import { VERSION } from '../version'
import { GitHubIcon, InstagramIcon, XIcon, TikTokIcon } from './icons/SocialIcons'

const eyebrowLink =
  'font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text-primary)] transition-colors'

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/kluvs-app', Icon: GitHubIcon },
  { name: 'Instagram', href: 'https://www.instagram.com/kluvs.app', Icon: InstagramIcon },
  { name: 'X', href: 'https://x.com/KluvsApp', Icon: XIcon },
  { name: 'TikTok', href: 'https://www.tiktok.com/@kluvs.app', Icon: TikTokIcon },
]

function Dot() {
  return <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-disabled)] flex-shrink-0 inline-block" aria-hidden="true" />
}

interface Props {
  showVersion?: boolean
}

export default function Footer({ showVersion = false }: Props) {
  return (
    <footer className="border-t border-[var(--color-divider)] px-6 py-8">
      <div className="mx-auto max-w-6xl flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="font-serif italic text-[17px] leading-none text-[var(--color-text-meta)]">
            Reading is done best together.
          </p>
          <p className="text-helper-sm text-[var(--color-text-meta)]">
            © 2026 Kluvs. All rights reserved.
            {showVersion && (
              <span className="ml-2 text-helper text-[var(--color-text-secondary)] opacity-50">v{VERSION}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:items-end">
          <ul aria-label="Social media" className="flex items-center gap-5 list-none p-0 m-0">
            {socialLinks.map(({ name, href, Icon }) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Kluvs on ${name}`}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex"
                >
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
          <nav aria-label="Footer" className="flex items-center gap-3">
            <Link to="/privacy" className={eyebrowLink}>Privacy</Link>
            <Dot />
            <Link to="/terms" className={eyebrowLink}>Terms</Link>
            <Dot />
            <Link to="/faq" className={eyebrowLink}>FAQ</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
