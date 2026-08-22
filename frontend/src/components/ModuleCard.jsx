export default function ModuleCard({
  icon,
  tabColor,
  title,
  meta,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative w-full text-left press-el ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {/* the tab peeking out from behind, top-left */}
      <span
        className="absolute -top-2 left-4 h-6 w-16 rounded-t-md border-[3px] border-b-0 border-ink"
        style={{ backgroundColor: tabColor }}
      />
      <div className="relative flex items-center gap-3 rounded-card border-[3px] border-ink bg-cream p-4 shadow-hard">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-tile border-[3px] border-ink text-xl"
          style={{ backgroundColor: tabColor }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold leading-tight">
            {title}
          </p>
          <p className="truncate text-sm text-ink/60">{meta}</p>
        </div>
        {disabled && (
          <span className="shrink-0 rounded-full border-2 border-ink bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
            Soon
          </span>
        )}
      </div>
    </button>
  )
}
