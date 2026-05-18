import DiscordIcon from './icons/DiscordIcon'

function ConnectorTrack({ label }: { label: string }) {
  return (
    <div className="md:pr-[236px]">
      <div className="relative flex items-center justify-center h-[70px]">
        <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'var(--color-divider)' }} />
        <div
          className="relative rounded-full px-3.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.07em] whitespace-nowrap border"
          style={{ background: 'var(--color-bg-raised)', borderColor: 'var(--color-divider)', color: 'var(--color-text-meta)' }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

function MatIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1 }}>
      {name}
    </span>
  )
}

export default function HowItWorksSection() {
  return (
    <section className="px-6 py-16" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[900px] mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-section-heading font-serif text-[var(--color-text-primary)] mb-2">
            How it works
          </h2>
        </header>

        <div className="flex flex-col">
          {/* ── DISCORD SERVER ── */}
          <div className="relative md:pr-[236px]">
            <div className="flex gap-3 flex-wrap">
              <div
                className="flex-1 min-w-[136px] rounded-xl p-4 flex items-center gap-3 cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: 'rgba(88,101,242,0.18)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[#8b96f7]"
                  style={{ background: 'rgba(88,101,242,0.25)' }}
                >
                  <DiscordIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#8b96f7' }}>Discord</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Server</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-meta)' }}>Your community home</div>
                </div>
              </div>
            </div>
          </div>

          <ConnectorTrack label="One server · Many clubs" />

          {/* ── CLUBS + MEMBERS ── */}
          <div className="relative md:pr-[236px]">
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Fantasy Fans', channel: 'fantasy' },
                { name: 'Phil Club', channel: 'philosophy' },
                { name: 'Sci-Fi Circle', channel: 'scifi' },
              ].map(({ name, channel }, i) => (
                <div
                  key={name}
                  className={`${i === 1 ? 'flex' : 'hidden md:flex'} flex-1 min-w-[136px] rounded-xl p-5 items-center gap-3 cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
                  style={{ background: 'rgba(209,109,48,0.18)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-bg-raised)', color: 'var(--color-primary)' }}
                  >
                    <MatIcon name="menu_book" size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: 'var(--color-primary)' }}>Club</div>
                    <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-meta)' }}>#{channel}-channel</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Aside: Members — flows below on mobile, absolute on md+ */}
            <div className="flex flex-col gap-2 mt-3 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[216px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-dashed opacity-30" style={{ borderColor: 'var(--color-primary)' }} />
                <div className="text-[9px] font-bold uppercase tracking-[0.09em] whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>
                  Multiple Members per Club
                </div>
              </div>
              {['@socrates', '@big-brother'].map((handle) => (
                <div key={handle} className="rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: 'var(--color-bg-elevated)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: 'var(--color-text-secondary)' }}>
                    <MatIcon name="person" size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{handle}</div>
                    <div className="text-[10px] mt-px" style={{ color: 'var(--color-text-meta)' }}>Member</div>
                  </div>
                </div>
              ))}
              <div className="text-[10px] font-medium text-center py-0.5" style={{ color: 'var(--color-text-meta)' }}>+ more per club</div>
            </div>
          </div>

          <ConnectorTrack label="One active session per club" />

          {/* ── SESSIONS + BOOK ── */}
          <div className="relative md:pr-[236px]">
            <div className="flex gap-3 flex-wrap">
              {/* Inactive — hidden on mobile */}
              <div
                className="hidden md:flex flex-1 min-w-[136px] rounded-xl p-4 items-center gap-3 cursor-default opacity-30 pointer-events-none"
                style={{ background: 'rgba(0,103,129,0.22)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: '#006781' }}>
                  <MatIcon name="calendar_month" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#006781' }}>Session</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Meditating Motorcycle</div>
                </div>
              </div>

              {/* Active — always visible */}
              <div
                className="rounded-xl p-4 flex items-center gap-3 cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl relative flex-1 min-w-[136px]"
                style={{ background: 'rgba(0,103,129,0.22)' }}
              >
                <div className="absolute -top-[9px] right-3 text-[9px] font-bold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full bg-primary text-white">
                  Active
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: '#006781' }}>
                  <MatIcon name="calendar_month" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#006781' }}>Session</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Pigs on the Wings</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-meta)' }}>Ends February 30</div>
                </div>
              </div>

              {/* Inactive — hidden on mobile */}
              <div
                className="hidden md:flex flex-1 min-w-[136px] rounded-xl p-4 items-center gap-3 cursor-default opacity-30 pointer-events-none"
                style={{ background: 'rgba(0,103,129,0.22)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: '#006781' }}>
                  <MatIcon name="calendar_month" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#006781' }}>Session</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stoic Virtue</div>
                </div>
              </div>
            </div>

            {/* Aside: Book — flows below on mobile, absolute on md+ */}
            <div className="flex flex-col gap-2 mt-3 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[216px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-dashed opacity-30" style={{ borderColor: '#c9900a' }} />
                <div className="text-[9px] font-bold uppercase tracking-[0.09em] whitespace-nowrap" style={{ color: '#c9900a' }}>
                  1 Book per Session
                </div>
              </div>
              <div className="rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: 'rgba(201,144,10,0.18)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: '#c9900a' }}>
                  <MatIcon name="auto_stories" size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Animal Farm</div>
                  <div className="text-[10px] mt-px" style={{ color: 'var(--color-text-meta)' }}>via Google Books</div>
                </div>
              </div>
            </div>
          </div>

          <ConnectorTrack label="One session · Many discussions" />

          {/* ── DISCUSSIONS + DISCORD EVENT ── */}
          <div className="relative md:pr-[236px]">
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Chapters 1–3', date: 'January 15' },
                { name: 'Chapters 4–6', date: 'February 15' },
                { name: 'Chapters 7–10', date: 'February 30' },
              ].map(({ name, date }, i) => (
                <div
                  key={name}
                  className={`${i === 2 ? 'hidden md:flex' : 'flex'} flex-1 min-w-[136px] rounded-xl p-4 items-center gap-3 cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
                  style={{ background: 'rgba(72,164,128,0.18)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-raised)', color: '#48a480' }}>
                    <MatIcon name="forum" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#48a480' }}>Discussion</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-meta)' }}>{date}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Aside: Discord Event — flows below on mobile, absolute on md+ */}
            <div className="flex flex-col gap-2 mt-3 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[216px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-dashed opacity-30" style={{ borderColor: '#5865f2' }} />
                <div className="text-[9px] font-bold uppercase tracking-[0.09em] whitespace-nowrap" style={{ color: '#8b96f7' }}>
                  Sync'd with Discord
                </div>
              </div>
              <div className="rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: 'rgba(88,101,242,0.18)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[#8b96f7]" style={{ background: 'rgba(88,101,242,0.15)' }}>
                  <DiscordIcon className="w-3.5 h-3" />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Server Event</div>
                  <div className="text-[10px] mt-px" style={{ color: 'var(--color-text-meta)' }}>Discord</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
