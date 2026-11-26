import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigation } from './components/Navigation'
import { Preloader } from './components/Preloader'
import { picReady } from './components/Pic'
import { projects, type Project } from './data/site'
import { easeCine, easeLuxe, useCalmScroll, usePrefersReducedMotion } from './lib/motion'
import { initSmoothScroll, jumpTo, lockScroll, restorePlace, scrollToTarget, ScrollTrigger } from './lib/scroll'
import { currentPage, pageFromHash, pageTitle, setCurrentPage, type PageId } from './lib/pages'
import { Explore } from './sections/Explore'
import { ScrollProgress } from './components/ScrollProgress'
import { WhatsAppButton } from './components/WhatsAppButton'
import { CinemaReveal } from './sections/CinemaReveal'
import { Elite } from './sections/Elite'
import { Awards } from './sections/Awards'
import { ConceptReality } from './sections/ConceptReality'
import { Factory } from './sections/Factory'
import { Story } from './sections/Story'
import { Clients } from './sections/Clients'
import { Collections } from './sections/Collections'
import { Films } from './sections/Films'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'
import { Founder } from './sections/Founder'
import { FounderFilm } from './sections/FounderFilm'
import { Team } from './sections/Team'
import { LiveDifferent } from './sections/LiveDifferent'
import { Global } from './sections/Global'
import { Hero } from './sections/Hero'
import { Hospitality } from './sections/Hospitality'
import { ProjectDetail } from './sections/ProjectDetail'
import { Projects } from './sections/Projects'
import { Statement } from './sections/Statement'
import { SignatureHotels } from './sections/SignatureHotels'
import { NewCollection } from './sections/NewCollection'
import { OutdoorKitchens } from './sections/OutdoorKitchens'
import { useLang } from './i18n'

const fromHash = () => {
  const m = window.location.hash.match(/^#\/project\/([\w-]+)/)
  return m ? (projects.find((p) => p.slug === m[1]) ?? null) : null
}

/** How many sections each page holds (its enquiry form included), for the step-by-step build. */
const PAGE_SIZE: Record<PageId, number> = { home: 7, projects: 3, hotels: 3, collections: 3, kitchens: 2, about: 7, team: 2, 'live-different': 2 }

export default function App() {
  const { t, lang } = useLang()
  const reduced = usePrefersReducedMotion()
  const calm = useCalmScroll()
  // The opening film plays every time someone opens the site; it is skipped only when the page is
  // reloaded (or reached with the browser's back/forward buttons).
  const [intro] = useState(() => {
    const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
    // and only on the home page: a link to another page opens that page straight away
    return (!nav || (nav.type !== 'reload' && nav.type !== 'back_forward')) && pageFromHash() === 'home'
  })
  const [page, setPage] = useState<PageId>(pageFromHash)
  useEffect(() => setCurrentPage(page), [page])
  const [ready, setReady] = useState(!intro)
  // During the opening film only the hero is built: the rest of the site (and its photos) waits until
  // the camera comes to rest, so the film downloads and plays without competing for the connection.
  // (and the photo table is in, so every photo is requested in its light version from the start)
  const [rest, setRest] = useState(false)
  const onSettle = useCallback(() => void picReady.then(() => setRest(true)), [])
  useEffect(() => {
    if (!intro) void picReady.then(() => setRest(true))
  }, [intro])
  // The rest of the site is built one section at a time, in the browser's idle moments: building it
  // all at once froze the page for up to a second just as the opening film began (longer on modest
  // phones and computers). A link to a section, or a visitor racing ahead, builds the rest at once.
  const [built, setBuilt] = useState(0)
  const total = PAGE_SIZE[page]
  useEffect(() => {
    if (!rest || built >= total) return
    if (built === 0 && /^#(?!\/)./.test(location.hash)) return void setBuilt(total)
    const all = () => setBuilt(total)
    const ahead = () => {
      if (window.scrollY + innerHeight * 2.5 > document.documentElement.scrollHeight) all()
    }
    window.addEventListener('site:build-all', all)
    window.addEventListener('scroll', ahead, { passive: true })
    const next = () => setBuilt((n) => Math.min(total, n + 1))
    // Safari has no idle callback: a short pause between sections instead
    const ric = 'requestIdleCallback' in window
    const id = ric ? window.requestIdleCallback(next, { timeout: 350 }) : window.setTimeout(next, 60)
    return () => {
      if (ric) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
      window.removeEventListener('site:build-all', all)
      window.removeEventListener('scroll', ahead)
    }
  }, [rest, built])
  // pinned scenes are measured once the whole page stands
  useEffect(() => {
    if (built < total) return
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [built])
  const [revealed, setRevealed] = useState(!intro)
  // the hero film (several megabytes) waits until the opening scene is on screen, so it never
  // takes the connection from the 3D mark (which would fall back to its 2D stand-in)
  const [scene, setScene] = useState(!intro)
  const onScene = useCallback(() => setScene(true), [])
  const onReveal = useCallback(() => setRevealed(true), [])
  const [project, setProject] = useState<Project | null>(fromHash)
  const onReady = useCallback(() => setReady(true), [])

  // Native scrolling on touch devices; smooth scroll only with a mouse/trackpad.
  useEffect(() => initSmoothScroll(calm), [calm])

  // A language switch changes the length of every text and rebuilds the founder's film: re-measure the
  // pinned scenes so each one starts only after the previous has finished, never on top of it.
  const firstLang = useRef(true)
  useEffect(() => {
    if (firstLang.current) return void (firstLang.current = false)
    // the rebuilt film is newest in GSAP's list: put the scenes back in page order before measuring
    const id = requestAnimationFrame(() => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
      // and the visitor stays on the part of the page they were reading
      restorePlace()
    })
    return () => cancelAnimationFrame(id)
  }, [lang])

  // Recalculate pinned sections once fonts and images settle.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  // Project pages are shareable via #/project/<slug>.
  useEffect(() => {
    const on = () => setProject(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  useEffect(() => {
    lockScroll(!!project)
  }, [project])

  const open = (p: Project) => {
    history.pushState(null, '', `#/project/${p.slug}`)
    setProject(p)
  }
  const close = useCallback(() => {
    const p = currentPage()
    history.pushState(null, '', p === 'home' ? window.location.pathname + window.location.search : `#/${p}`)
    setProject(null)
  }, [])

  // Moving between pages: a curtain closes with the page's name, the new page is put in place at
  // the top behind it, and the curtain lifts.
  const [curtain, setCurtain] = useState<PageId | null>(null)
  const busy = useRef(false)
  useEffect(() => {
    const go = (p: PageId, section?: string, push = true) => {
      if (busy.current) return
      if (p === currentPage()) {
        if (section) scrollToTarget(section)
        return
      }
      busy.current = true
      setCurtain(p)
      window.setTimeout(() => {
        if (push) history.pushState(null, '', p === 'home' ? window.location.pathname + window.location.search : `#/${p}`)
        setCurrentPage(p)
        setPage(p)
        setBuilt(99)
        setReady(true)
        setRevealed(true)
        setScene(true)
        jumpTo(0)
        // two frames: the new page is built and measured before the curtain lifts
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            ScrollTrigger.refresh()
            // a section asked for (the Home button, or coming back to the home page): the page is
            // already resting on it when the curtain lifts
            const el = section ? document.querySelector<HTMLElement>(section) : null
            if (el) {
              jumpTo(Math.max(0, el.getBoundingClientRect().top + window.scrollY))
              ScrollTrigger.update()
            }
            setCurtain(null)
            busy.current = false
          }),
        )
      }, 800)
    }
    const onPage = (e: Event) => {
      const d = (e as CustomEvent<{ page: PageId; section?: string }>).detail
      go(d.page, d.section)
    }
    // the browser's back and forward buttons (and the swipe back on phones): coming back to the home
    // page lands on the Explore index the visitor left from, not on the opening film
    const onPop = () => {
      if (fromHash()) return
      const p = pageFromHash()
      go(p, p === 'home' ? '#explore' : undefined, false)
    }
    window.addEventListener('site:page', onPage)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('site:page', onPage)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  const sections: Record<PageId, ReactNode[]> = {
    home: [
      <Statement key="statement" />,
      <CinemaReveal key="cinema" />,
      <Elite key="elite" />,
      <Explore key="explore" />,
      <Awards key="awards" />,
      <Clients key="clients" />,
    ],
    projects: [<Projects key="projects" onOpen={open} />, <ConceptReality key="concept" />],
    hotels: [<Hospitality key="hospitality" />, <SignatureHotels key="hotels" />],
    collections: [<Collections key="collections" />, <NewCollection key="new" />],
    kitchens: [<OutdoorKitchens key="kitchens" />],
    about: [<Story key="story" />, <Founder key="founder" />, <FounderFilm key="founder-film" />, <Factory key="factory" />, <Films key="films" />, <Global key="global" />],
    team: [<Team key="team" />],
    'live-different': [<LiveDifferent key="live" />],
  }
  const parts = [...sections[page], <Contact key="contact" />]

  return (
    <LayoutGroup>
      <a href="#main" className="sr-only z-[200] rounded bg-bone px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4">
        {t('Skip to content', 'Saltar al contenido')}
      </a>
      <ScrollProgress />
      {intro && <Preloader onDone={onReady} onReveal={onReveal} onSettle={onSettle} onScene={onScene} reduced={reduced} />}
      <Navigation ready={ready} />
      <main id="main">
        {page === 'home' && <Hero ready={ready} revealed={revealed} reduced={reduced} load={scene || revealed} />}
        {page !== 'home' && <div className="h-20 md:h-24" aria-hidden />}
        <div key={page}>{parts.slice(0, built)}</div>
      </main>
      {built >= parts.length && <Footer />}
      <WhatsAppButton ready={ready} />
      <AnimatePresence>{curtain && <PageCurtain key="curtain" page={curtain} />}</AnimatePresence>
      <AnimatePresence>{project && <ProjectDetail key="detail" project={project} onClose={close} onNavigate={open} />}</AnimatePresence>
    </LayoutGroup>
  )
}

/** The curtain drawn between two pages, carrying the name of the page that is opening. */
function PageCurtain({ page }: { page: PageId }) {
  const { tx } = useLang()
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink"
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.8, ease: easeCine }}
    >
      <span className="grain" />
      <div className="relative flex flex-col items-center gap-6 overflow-hidden px-5">
        <motion.span
          className="block h-px w-16 origin-center bg-gold"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: easeLuxe, delay: 0.25 }}
        />
        <span className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="display block text-center text-[16vw] text-bone uppercase sm:text-[11vw] lg:text-[8vw]"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, ease: easeLuxe, delay: 0.2 }}
          >
            {tx(pageTitle[page])}
          </motion.span>
        </span>
      </div>
    </motion.div>
  )
}
