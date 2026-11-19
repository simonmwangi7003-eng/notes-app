export default function BarChart({ data, barClass = 'bg-brand-600', height = 170 }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div>
      <div className="flex items-end gap-[2px] sm:gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div className={`w-full rounded-t ${barClass} opacity-80 transition group-hover:opacity-100`} style={{ height: `${Math.max((d.value / max) * 100, d.value ? 3 : 1)}%` }} />
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100">{d.label}: <b>{d.value}</b></span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </div>
  )
}
