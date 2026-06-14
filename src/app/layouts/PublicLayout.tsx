import { Outlet } from 'react-router-dom'

/**
 * Customer-facing layout (QR scan entry point).
 * Intentionally minimal — no admin chrome, no navigation.
 */
export function PublicLayout() {
  return (
    <main className="min-h-svh bg-[#0B0B0C] text-neutral-100 flex flex-col relative overflow-x-clip">
      {/* Background Ambient Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none select-none" />
      <div className="absolute top-[60%] right-[-10%] w-[450px] h-[450px] rounded-full bg-amber-500/[0.04] blur-[150px] pointer-events-none select-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </div>
    </main>
  )
}
