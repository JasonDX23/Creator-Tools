import ModuleCard from '../components/ModuleCard'

const MODULES = [
  {
    key: 'qr',
    title: 'QR Code Generator',
    meta: 'Paste a link, get a scan-ready code',
    icon: '▦',
    tabColor: '#FF3D6E',
    disabled: false,
  },
  {
    key: 'captions',
    title: 'Transcript (SRT)',
    meta: 'Auto-caption your reels',
    icon: '💬',
    tabColor: '#7B5CFF',
    disabled: false,
  },
  {
    key: 'feedback',
    title: 'Feedback & Ideas',
    meta: 'Submit feature requests & ideas',
    icon: '💡',
    tabColor: '#2FD675',
    disabled: false,
  },
]

export default function Home({ onOpenModule }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-yolk px-5 pb-10 pt-6">
      {/* top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button className="press-el flex h-11 w-11 items-center justify-center rounded-tile border-[3px] border-ink bg-cream shadow-hard-sm">
          ⚙️
        </button>
        <button className="press-el flex h-11 w-11 items-center justify-center rounded-tile border-[3px] border-ink bg-cream shadow-hard-sm">
          🔍
        </button>
      </div>

      <h1 className="font-display text-[2.6rem] font-bold leading-[1.05]">
        Search less.
        <br />
        Post faster.
      </h1>
      <p className="mt-2 text-sm font-medium text-ink/70">
        Made for Amberley Nair ❤️
      </p>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">My Tools</h2>
        <span className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-semibold shadow-hard-sm">
          {MODULES.filter((m) => !m.disabled).length} active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-2">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.key}
            icon={m.icon}
            tabColor={m.tabColor}
            title={m.title}
            meta={m.meta}
            disabled={m.disabled}
            onClick={() => onOpenModule(m.key)}
          />
        ))}
      </div>
    </div>
  )
}