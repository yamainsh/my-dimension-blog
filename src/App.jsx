import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { BlackHoleCanvas } from './components/BlackHoleCanvas'

// ============================================================================
// Todo 1: NavBar Component (Responsive Desktop + Mobile Menu)
// ============================================================================
function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className="ui-chrome fixed top-4 sm:top-5 inset-x-0 z-40 px-4 sm:px-6 intro-item"
      style={{ '--intro-d': '120ms' }}
    >
      <nav className="frosted-nav max-w-5xl mx-auto rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#hero"
          className="flex items-center gap-2.5 text-left"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_12px_#FDE68A]" />
          <span className="text-sm font-semibold tracking-tight text-white">
            Dimension
          </span>
        </a>

        {/* Right Controls: Log in & Sign up */}
        <div className="flex items-center gap-2">
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition cursor-pointer"
            >
              Log in
            </button>
            <button
              type="button"
              className="btn-ivory rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Sign up
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden glass-pill w-8 h-8 rounded-full flex items-center justify-center text-zinc-200 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden frosted-nav max-w-5xl mx-auto mt-2.5 rounded-3xl p-4 flex flex-col gap-2.5">
          <button
            type="button"
            className="glass-pill w-full rounded-full py-2.5 text-xs font-medium text-white cursor-pointer"
          >
            Log in
          </button>
          <button
            type="button"
            className="btn-ivory w-full rounded-full py-2.5 text-xs font-semibold cursor-pointer"
          >
            Sign up
          </button>
        </div>
      )}
    </header>
  )
}

// ============================================================================
// Todo 2: HeroSection Component (Uses BlackHoleCanvas + Responsive Tailwind UI)
// ============================================================================
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative h-screen min-h-[680px] w-full flex flex-col justify-between overflow-hidden bg-black"
    >
      {/* Real-Time Three.js Black Hole Background */}
      <BlackHoleCanvas />

      {/* Smooth bottom gradient fade into pure black */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 z-[1] bg-gradient-to-t from-black via-black/65 to-transparent" />

      {/* Top Stage: Eyebrow Pill */}
      <div className="ui-chrome pointer-events-none relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-26 text-center">
        <div
          className="intro-item inline-flex items-center gap-2 glass-pill rounded-full px-3.5 py-1 text-[10px] font-medium tracking-[0.2em] sm:tracking-[0.24em] uppercase text-amber-100/90"
          style={{ '--intro-d': '260ms' }}
        >
          <span>Personal Space &amp; Time Journal</span>
          <span className="hidden sm:inline">· Drag to Orbit 3D</span>
        </div>
      </div>

      {/* Open Center Stage: Unobstructed Window for the Black Hole */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom Stage: Headline + Subtitle + Responsive CTA */}
      <div className="ui-chrome pointer-events-none relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pb-8 sm:pb-10 text-center space-y-3.5">
        <h1 className="intro-item hero-headline" style={{ '--intro-d': '420ms' }}>
          Where Ideas Orbit Space and Time.
        </h1>

        <p
          className="intro-item text-xs sm:text-[15px] font-light text-zinc-200/90 max-w-lg mx-auto leading-[1.8] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
          style={{ '--intro-d': '580ms' }}
        >
          บันทึกการเดินทางผ่านมิติของดาราศาสตร์ กาลเวลา และสถาปัตยกรรมซอฟต์แวร์ยุคใหม่ — เรียบง่าย ลุ่มลึก และไร้สิ่งรบกวน
        </p>

        <div
          className="intro-item pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1"
          style={{ '--intro-d': '720ms' }}
        >
          <button
            type="button"
            className="btn-ivory w-full sm:w-auto rounded-full px-6 py-2.5 text-xs sm:text-[13px] font-semibold cursor-pointer"
          >
            Explore Journal
          </button>
          <button
            type="button"
            className="glass-pill w-full sm:w-auto rounded-full px-6 py-2.5 text-xs sm:text-[13px] font-medium text-white cursor-pointer"
          >
            Read Featured Story
          </button>
        </div>

        <div
          className="intro-item hidden sm:flex pt-1 flex-col items-center"
          style={{ '--intro-d': '860ms' }}
        >
          <div className="w-[1px] h-5 bg-white/15 overflow-hidden relative">
            <div className="scroll-droplet w-full h-2.5 bg-gradient-to-b from-transparent via-amber-100 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Root App Component: Renders NavBar (Todo 1) & HeroSection (Todo 2)
// ============================================================================
function App() {
  return (
    <div className="min-h-screen bg-black text-[#F5F5F7]">
      <NavBar />
      <HeroSection />
    </div>
  )
}

export default App
