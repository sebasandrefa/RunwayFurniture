import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { useId, useRef, useState } from 'react'
import { FadeIn } from '../components/FadeIn'
import { Pic } from '../components/Pic'
import { RevealText } from '../components/RevealText'
import { team, type Member } from '../data/team'
import { useLang } from '../i18n'
import { easeCine, easeLuxe, useMediaQuery } from '../lib/motion'

const pad = (n: number) => String(n).padStart(2, '0')
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
  const shown = hover ?? last.current

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

        {/* roster */}
        <ul ref={listRef} onPointerMove={fine ? (e) => move(e) : undefined} className="group/list relative mt-16 border-b border-bone/10 md:mt-24">
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
