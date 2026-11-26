import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Pic } from '../components/Pic'
import { RevealText } from '../components/RevealText'
import { navItems } from '../data/site'
import { useLang, type T } from '../i18n'
import { easeLuxe } from '../lib/motion'
import { openPage, pageHref, pageTitle, type PageId } from '../lib/pages'

/** The doors to the rest of the site, each with the photo the menu already shows for it. */
const doors: { page: PageId; from: string; line: T }[] = [
  { page: 'projects', from: '#projects', line: { en: 'Resorts, residences and bespoke work', es: 'Resorts, residencias y piezas a medida' } },
  { page: 'hotels', from: '#hotels', line: { en: 'Hospitality and signature hotels', es: 'Hotelería y hoteles emblemáticos' } },
  { page: 'collections', from: '#collections', line: { en: 'The collections and what is new in 2026', es: 'Las colecciones y las novedades 2026' } },
  { page: 'kitchens', from: '#kitchens', line: { en: 'Outdoor kitchens', es: 'Cocinas de exterior' } },
  { page: 'about', from: '#founder', line: { en: 'The founder, the factory and our films', es: 'El fundador, la fábrica y nuestros films' } },
  { page: 'team', from: '#team', line: { en: 'The people behind Runway', es: 'Las personas detrás de Runway' } },
  { page: 'live-different', from: '#live-different', line: { en: 'Live Different', es: 'Live Different' } },
]
const image = (href: string) => navItems.find((n) => n.href === href)?.image ?? ''

/**
 * Home page index: a row of tall photo panels; the one under the cursor opens wide with its line and
 * an arrow, the others fold into slim spines with their names set vertically. Phones get a stack.
 */
export function Explore() {
  const { t, tx } = useLang()
  const [active, setActive] = useState(0)

  return (
    <section id="explore" className="relative bg-ink py-28 md:py-36" aria-labelledby="explore-title">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow flex items-center gap-4 text-gold">
              <span className="h-px w-10 bg-gold/60" />
              {t('Explore', 'Explorar')}
            </p>
            <h2 id="explore-title" className="sr-only">
              {t('Explore Runway', 'Explora Runway')}
            </h2>
            <RevealText
              as="p"
              text={t('Explore\nRunway', 'Explora\nRunway')}
              accent={['Runway']}
              className="display mt-6 text-[15vw] text-bone uppercase sm:text-[10vw] lg:text-[6.4vw]"
            />
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-bone/65">
            {t('Every part of Runway has its own page. Choose where to begin.', 'Cada parte de Runway tiene su propia página. Elige por dónde empezar.')}
          </p>
        </div>

        {/* desktop: folding panels */}
        <ul className="mt-16 hidden h-[72vh] max-h-[760px] min-h-[520px] gap-2 md:mt-20 lg:flex">
          {doors.map((d, i) => {
            const open = active === i
            const src = image(d.from)
            return (
              <motion.li
                key={d.page}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ duration: 1.1, ease: easeLuxe, delay: i * 0.07 }}
                className="relative min-w-0 overflow-hidden transition-[flex-grow] duration-[900ms] ease-[var(--ease-luxe)]"
                style={{ flexGrow: open ? 5 : 1, flexBasis: 0 }}
                onMouseEnter={() => setActive(i)}
              >
                <a
                  href={pageHref(d.page)}
                  onClick={(e) => {
                    e.preventDefault()
                    openPage(d.page)
                  }}
                  onFocus={() => setActive(i)}
                  className="group absolute inset-0 block"
                  aria-label={tx(pageTitle[d.page])}
                >
                  <Pic src={src} sizes="60vw">
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1400ms] ease-[var(--ease-luxe)] ${open ? 'scale-100 brightness-90' : 'scale-110 brightness-[.45] grayscale-[.4]'}`}
                    />
                  </Pic>
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/30" />
                  <span className="absolute top-6 left-6 font-sans text-xs tracking-[0.2em] text-bone/70 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {/* folded: the name runs up the spine */}
                  <span
                    className={`display absolute bottom-6 left-1/2 origin-center -translate-x-1/2 text-[2.2rem] whitespace-nowrap text-bone uppercase transition-opacity duration-500 [writing-mode:vertical-rl] rotate-180 ${open ? 'opacity-0' : 'opacity-100 delay-300'}`}
                  >
                    {tx(pageTitle[d.page])}
                  </span>
                  {/* opened: name, line and arrow */}
                  <span className={`absolute inset-x-8 bottom-8 flex items-end justify-between gap-6 transition-all duration-700 ${open ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-6 opacity-0'}`}>
                    <span className="min-w-0">
                      <span className="display block text-[4.4vw] leading-none whitespace-nowrap text-bone uppercase">{tx(pageTitle[d.page])}</span>
                      <span className="mt-4 block text-sm text-bone/70">{tx(d.line)}</span>
                    </span>
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-bone/40 text-bone transition-colors duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </span>
                </a>
              </motion.li>
            )
          })}
        </ul>

        {/* phones and tablets: a stack of cards */}
        <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:hidden">
          {doors.map((d, i) => {
            const src = image(d.from)
            return (
              <motion.li
                key={d.page}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 1, ease: easeLuxe }}
                className={i === 0 ? 'sm:col-span-2' : ''}
              >
                <a
                  href={pageHref(d.page)}
                  onClick={(e) => {
                    e.preventDefault()
                    openPage(d.page)
                  }}
                  className="relative block aspect-[16/10] overflow-hidden active:opacity-90"
                >
                  <Pic src={src} sizes="(min-width: 640px) 50vw, 100vw">
                    <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  </Pic>
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                  <span className="absolute top-4 left-4 text-xs tracking-[0.2em] text-bone/70 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                    <span>
                      <span className="display block text-4xl text-bone uppercase">{tx(pageTitle[d.page])}</span>
                      <span className="mt-2 block text-xs text-bone/70">{tx(d.line)}</span>
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bone/40 text-bone">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </span>
                </a>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
