import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity, type PanInfo } from 'motion/react'
import { useId, useRef, useState } from 'react'
import { FadeIn } from '../components/FadeIn'
import { Pic } from '../components/Pic'
import { RevealText } from '../components/RevealText'
import { team, type Member } from '../data/team'
import { useLang } from '../i18n'
import { easeCine, easeLuxe, useMediaQuery } from '../lib/motion'

const pad = (n: number) => String(n).padStart(2, '0')
const mod = (n: number, m: number) => ((n % m) + m) % m
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** A member's portrait, or their initials in gold on graphite until a portrait is supplied. */
function Portrait({ m, sizes, className = '' }: { m: Member; sizes: string; className?: string }) {
  if (m.photo)
    return (
      <Pic src={m.photo} sizes={sizes}>
        <img src={m.photo} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover object-top ${className}`} />
      </Pic>
    )
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_30%_10%,#2a2622,#0d0c0b_70%)] ${className}`}>
      <span className="grain" aria-hidden />
      <span className="absolute inset-4 border border-gold/20" aria-hidden />
      <span className="relative font-display text-[7rem] leading-none text-gold/90 italic">{initials(m.name)}</span>
    </div>
  )
}

/**
 * The team: a roster set in large type. With a mouse, a portrait follows the cursor and leans with
 * its speed, wiping from one person to the next; every row opens to the full profile (on phones the
 * profile is the only view, so the portrait lives inside it).
 */
export function Team() {
  const { t, tx } = useLang()
  const uid = useId()
  const fine = useMediaQuery('(hover: hover) and (pointer: fine) and (min-width: 900px)')
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const last = useRef(0)
  if (hover !== null) last.current = hover
  // phones: the card on top of the deck (the deck loops, so the count can run past the end)
  const [deck, setDeck] = useState(0)
  const shown = fine ? (hover ?? last.current) : mod(deck, team.length)

  // the floating portrait: springs behind the cursor, leaning into its sideways speed
  const listRef = useRef<HTMLUListElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, { stiffness: 170, damping: 22, mass: 0.6 })
  const y = useSpring(py, { stiffness: 170, damping: 22, mass: 0.6 })
  const lean = useSpring(useTransform(useVelocity(x), [-2200, 2200], [-12, 12], { clamp: true }), { stiffness: 220, damping: 26 })
  const move = (e: React.PointerEvent, jump = false) => {
    const r = listRef.current?.getBoundingClientRect()
    if (!r) return
    px.set(e.clientX - r.left)
    py.set(e.clientY - r.top)
    // arriving from outside the list: the portrait appears under the cursor, not flying in from a corner
    if (jump) {
      x.jump(e.clientX - r.left)
      y.jump(e.clientY - r.top)
    }
  }

  return (
    <section id="team" className="relative overflow-hidden bg-ink py-28 md:py-40" aria-labelledby="team-title">
      <div className="relative mx-auto max-w-[1600px] px-5 md:px-10">
        {/* heading */}
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="eyebrow flex items-center gap-4 text-gold">
              <span className="h-px w-10 bg-gold/60" />
              {t('The team', 'El equipo')}
            </p>
            <h2 id="team-title" className="sr-only">
              {t('The team', 'El equipo')}
            </h2>
            <RevealText
              as="p"
              text={t('The people\nbehind Runway', 'Las personas\ndetrás de Runway')}
              accent={['Runway']}
              className="display mt-6 text-[15vw] text-bone uppercase sm:text-[10vw] lg:text-[6.4vw]"
            />
          </div>
          <FadeIn className="lg:col-span-4" delay={0.2}>
            <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-end">
              <p className="max-w-sm text-[0.95rem] leading-relaxed text-bone/65 lg:text-right">
                {t(
                  'From the first sketch to the last piece installed, these are the people who carry every project.',
                  'Del primer boceto a la última pieza instalada, estas son las personas que llevan cada proyecto.',
                )}
              </p>
              {/* rolling counter: which person the cursor is on */}
              <p className="flex shrink-0 items-center gap-3 font-display text-5xl leading-none text-bone/90 tabular-nums md:text-6xl" aria-hidden>
                <span className="relative block h-[1em] w-[1.05em] overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={shown}
                      initial={{ y: '100%' }}
                      animate={{ y: '0%' }}
                      exit={{ y: '-100%' }}
                      transition={{ duration: 0.6, ease: easeLuxe }}
                      className="absolute inset-0 block"
                    >
                      {pad(shown + 1)}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="block h-[0.8em] w-px rotate-[20deg] bg-gold/70" />
                <span className="block text-bone/40">{pad(team.length)}</span>
              </p>
            </div>
          </FadeIn>
        </div>

        {/* phones and tablets: the deck of cards */}
        {!fine && <TeamDeck index={deck} onIndex={setDeck} />}

        {/* roster */}
        <ul ref={listRef} onPointerMove={fine ? (e) => move(e) : undefined} className={`group/list relative mt-16 border-b border-bone/10 md:mt-24 ${fine ? '' : 'hidden'}`}>
          {team.map((m, i) => {
            const isOpen = open === i
            const panel = `${uid}-member-${i}`
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 1.1, ease: easeLuxe, delay: i * 0.08 }}
                className={`relative border-t border-bone/10 transition-opacity duration-500 ${hover !== null && hover !== i && !isOpen ? 'opacity-30' : 'opacity-100'}`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : i)}
                  onPointerEnter={(e) => {
                    if (!fine) return
                    move(e, hover === null)
                    setHover(i)
                  }}
                  onPointerLeave={() => fine && setHover(null)}
                  className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 py-6 text-left md:grid-cols-[4rem_1fr_minmax(0,18rem)_3rem] md:gap-x-8 md:py-8"
                >
                  {/* gold sweep along the row */}
                  <span className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-gold transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                  <span className="self-start pt-[0.6em] font-sans text-xs tracking-[0.2em] text-bone/40 tabular-nums transition-colors duration-500 group-hover:text-gold">
                    {pad(i + 1)}
                  </span>
                  <span className="display block overflow-hidden text-[10.5vw] text-bone uppercase sm:text-[7.4vw] lg:text-[5.2vw]">
                    <span className="block transition-transform duration-700 ease-[var(--ease-luxe)] md:group-hover:translate-x-6">
                      {m.name}
                    </span>
                  </span>
                  <span className="hidden flex-col items-end gap-1 text-right md:flex">
                    <span className="eyebrow text-mineral/70">{tx(m.role)}</span>
                    {m.city && <span className="text-xs text-bone/40">{tx(m.city)}</span>}
                  </span>
                  {/* plus that turns into a cross */}
                  <span className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-bone/20 transition-colors duration-500 group-hover:border-gold group-hover:bg-gold/10 md:h-12 md:w-12">
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.6, ease: easeLuxe }} className="relative block h-3 w-3">
                      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-bone" />
                      <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-bone" />
                    </motion.span>
                  </span>
                  <span className="col-span-3 -mt-1 md:hidden">
                    <span className="eyebrow text-mineral/70">{tx(m.role)}</span>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panel}
                      role="region"
                      aria-label={m.name}
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.9, ease: easeCine }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 pb-12 md:grid-cols-[4rem_minmax(0,22rem)_1fr] md:gap-x-8 md:pb-16">
                        <motion.div
                          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                          transition={{ duration: 1.1, ease: easeCine, delay: 0.15 }}
                          className="aspect-[4/5] w-full max-w-sm overflow-hidden md:col-start-2"
                        >
                          <motion.div initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: easeLuxe, delay: 0.15 }} className="h-full w-full">
                            <Portrait m={m} sizes="(min-width: 768px) 22rem, 90vw" />
                          </motion.div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 1, ease: easeLuxe, delay: 0.35 }}
                          className="flex flex-col justify-end md:pb-2"
                        >
                          <p className="eyebrow hidden text-gold md:block">{tx(m.role)}</p>
                          {m.bio && <p className="md:mt-6 max-w-[34ch] font-display text-3xl leading-snug text-bone md:text-4xl">“{tx(m.bio)}”</p>}
                          {m.city && (
                            <p className="mt-8 flex items-center gap-3 text-sm text-bone/50">
                              <span className="h-px w-8 bg-bone/30" />
                              {tx(m.city)}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}

          {/* the portrait that follows the cursor */}
          {fine && (
            <motion.li
              aria-hidden
              style={{ x, y, rotate: lean }}
              initial={false}
              animate={{ opacity: hover !== null && hover !== open ? 1 : 0, scale: hover !== null && hover !== open ? 1 : 0.6 }}
              transition={{ duration: 0.5, ease: easeLuxe }}
              className="pointer-events-none absolute top-0 left-0 z-20 aspect-[4/5] w-[clamp(14rem,19vw,22rem)] -translate-x-1/2 -translate-y-1/2 list-none overflow-hidden shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]"
            >
              {team.map((m, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ clipPath: i === shown ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)', zIndex: i === shown ? 2 : 1 }}
                  transition={{ duration: 0.75, ease: easeCine }}
                  className="absolute inset-0"
                >
                  <motion.div initial={false} animate={{ scale: i === shown ? 1 : 1.25 }} transition={{ duration: 1.1, ease: easeLuxe }} className="h-full w-full">
                    <Portrait m={m} sizes="22rem" />
                  </motion.div>
                </motion.div>
              ))}
              <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/80 to-transparent px-4 pt-10 pb-3 text-[0.625rem] tracking-[0.28em] text-bone/80 uppercase">
                {tx(team[shown].role)}
              </span>
            </motion.li>
          )}
        </ul>
      </div>
    </section>
  )
}

/**
 * Phones: the team as a deck of portrait cards. Drag the top card aside and it flies off, turning,
 * while the next one rises; tap a card and it turns over to show the role, the words and the city.
 * The deck loops, and two buttons do the same for anyone who prefers not to drag.
 */
function TeamDeck({ index, onIndex }: { index: number; onIndex: (n: number) => void }) {
  const { t, tx } = useLang()
  const [flipped, setFlipped] = useState(false)
  const [touched, setTouched] = useState(false)
  // forward: the top card leaves to the side it was thrown; back: a card comes in on top
  const [move, setMove] = useState({ forward: true, side: 1 })
  const n = team.length
  const go = (step: 1 | -1, side = step) => {
    setTouched(true)
    setFlipped(false)
    setMove({ forward: step > 0, side })
    onIndex(index + step)
  }
  const layers = Math.min(3, n)

  return (
    <div className="mt-20">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[380px] [perspective:1400px]">
        <AnimatePresence initial={false} custom={move}>
          {Array.from({ length: layers }, (_, k) => layers - 1 - k).map((depth) => {
            const at = index + depth
            const m = team[mod(at, n)]
            return (
              <DeckCard
                key={at}
                m={m}
                number={mod(at, n) + 1}
                depth={depth}
                flipped={depth === 0 && flipped}
                onFlip={() => {
                  setTouched(true)
                  setFlipped((f) => !f)
                }}
                onThrow={(side) => go(1, side)}
                move={move}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="mx-auto mt-8 flex max-w-[230px] items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('Previous person', 'Persona anterior')}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-bone/25 text-bone transition-colors active:border-gold active:bg-gold/10"
        >
          <span className="block h-2.5 w-2.5 translate-x-0.5 rotate-45 border-b border-l border-current" />
        </button>
        <div className="flex flex-1 items-center gap-1.5" aria-hidden>
          {team.map((_, i) => (
            <span key={i} className="relative h-px flex-1 overflow-hidden bg-bone/15">
              <motion.span
                className="absolute inset-0 origin-left bg-gold"
                initial={false}
                animate={{ scaleX: i === mod(index, n) ? 1 : 0 }}
                transition={{ duration: 0.6, ease: easeLuxe }}
              />
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('Next person', 'Siguiente persona')}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-bone/25 text-bone transition-colors active:border-gold active:bg-gold/10"
        >
          <span className="block h-2.5 w-2.5 -translate-x-0.5 rotate-45 border-t border-r border-current" />
        </button>
      </div>
      <p className={`mt-5 text-center text-xs tracking-[0.2em] text-bone/45 uppercase transition-opacity duration-700 ${touched ? 'opacity-0' : 'opacity-100'}`}>
        {t('Swipe to meet the next · tap to turn', 'Desliza para ver al siguiente · toca para girar')}
      </p>
      <p className="sr-only" aria-live="polite">
        {team[mod(index, n)].name}, {tx(team[mod(index, n)].role)}
      </p>
    </div>
  )
}

type Move = { forward: boolean; side: number }

function DeckCard({ m, number, depth, flipped, onFlip, onThrow, move }: { m: Member; number: number; depth: number; flipped: boolean; onFlip: () => void; onThrow: (side: 1 | -1) => void; move: Move }) {
  const { tx, t } = useLang()
  const top = depth === 0
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const end = (_: unknown, info: PanInfo) => {
    const far = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 550
    if (far) onThrow(info.offset.x + info.velocity.x * 0.1 > 0 ? 1 : -1)
  }
  // cards further down sit a little lower, smaller and turned
  const rest = { scale: 1 - depth * 0.05, y: -depth * 34, rotate: depth === 0 ? 0 : depth % 2 ? -2.5 : 2.5, opacity: 1 - depth * 0.15 }

  return (
    <motion.div
      className="absolute inset-0 touch-pan-y"
      style={{ x, rotate: top ? rotate : undefined, zIndex: 10 - depth, transformOrigin: '50% 100%' }}
      custom={move}
      variants={{
        enter: (mv: Move) => (mv.forward ? { scale: 0.8, y: 40, opacity: 0, rotate: 0 } : { x: -mv.side * 420, rotate: -mv.side * 20, opacity: 1, scale: 1, y: 0 }),
        rest: { ...rest, x: 0, transition: { duration: 0.7, ease: easeLuxe } },
        exit: (mv: Move) =>
          mv.forward
            ? { x: mv.side * 520, rotate: mv.side * 28, opacity: 0, transition: { duration: 0.55, ease: [0.4, 0, 1, 1] } }
            : { scale: 0.8, y: 40, opacity: 0, transition: { duration: 0.4 } },
      }}
      initial="enter"
      animate="rest"
      exit="exit"
      drag={top ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={end}
      onTap={top ? onFlip : undefined}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: easeLuxe }}
      >
        {/* front: the portrait */}
        <div className="absolute inset-0 overflow-hidden bg-graphite shadow-[0_30px_60px_-25px_rgba(0,0,0,.9)] [backface-visibility:hidden]">
          <div className="pointer-events-none h-full w-full">
            <Portrait m={m} sizes="380px" />
          </div>
          <span className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/30" />
          <span className="absolute top-5 left-5 text-xs tracking-[0.2em] text-bone/80 tabular-nums">
            {pad(number)} / {pad(team.length)}
          </span>
          <span className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-bone/30 text-bone/80">
            <span className="relative block h-2.5 w-2.5">
              <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
              <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
            </span>
          </span>
          <div className="absolute inset-x-5 bottom-6">
            <p className="eyebrow text-gold">{tx(m.role)}</p>
            <p className="display mt-3 text-[2.9rem] leading-[0.95] text-bone uppercase">{m.name}</p>
          </div>
        </div>

        {/* back: role, words, city */}
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden border border-gold/30 bg-[radial-gradient(120%_80%_at_20%_0%,#2a2622,#0d0c0b_70%)] p-7 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="grain" aria-hidden />
          <div className="relative">
            <p className="text-xs tracking-[0.2em] text-bone/50 tabular-nums">{pad(number)}</p>
            <p className="display mt-6 text-[2.6rem] leading-[0.95] text-bone uppercase">{m.name}</p>
            <p className="eyebrow mt-4 text-gold">{tx(m.role)}</p>
          </div>
          <div className="relative">
            {m.bio && <p className="font-display text-[1.7rem] leading-snug text-bone">“{tx(m.bio)}”</p>}
            {m.city && (
              <p className="mt-6 flex items-center gap-3 text-sm text-bone/55">
                <span className="h-px w-8 bg-bone/30" />
                {tx(m.city)}
              </p>
            )}
            <p className="mt-8 text-[0.625rem] tracking-[0.24em] text-bone/35 uppercase">{t('Tap to turn back', 'Toca para volver')}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
