import { useSyncExternalStore } from 'react'
import type { T } from '../i18n'

/**
 * The site is split into pages: the home page keeps the essentials and every other part has its
 * own page, reached from the header and the menu. Pages live in the address after "#/" (for
 * example …/#/team), so links can be shared and the browser's back button works.
 */
export type PageId = 'home' | 'projects' | 'hotels' | 'collections' | 'kitchens' | 'about' | 'team' | 'live-different'

export const pageTitle: Record<PageId, T> = {
  home: { en: 'Runway', es: 'Runway' },
  projects: { en: 'Projects', es: 'Proyectos' },
  hotels: { en: 'Hotels', es: 'Hoteles' },
  collections: { en: 'Collections', es: 'Colecciones' },
  kitchens: { en: 'Kitchens', es: 'Cocinas' },
  about: { en: 'About', es: 'Nosotros' },
  team: { en: 'Team', es: 'Equipo' },
  'live-different': { en: 'Live Different', es: 'Live Different' },
}

const PAGES = Object.keys(pageTitle) as PageId[]

/** Which page holds each section. "#contact" is not listed: every page ends with the enquiry form. */
const SECTION_PAGE: Record<string, PageId> = {
  '#top': 'home',
  '#elite': 'home',
  '#explore': 'home',
  '#awards': 'home',
  '#clients': 'home',
  '#projects': 'projects',
  '#concept': 'projects',
  '#hospitality': 'hotels',
  '#hotels': 'hotels',
  '#collections': 'collections',
  '#new-2026': 'collections',
  '#kitchens': 'kitchens',
  '#story': 'about',
  '#founder': 'about',
  '#factory': 'about',
  '#films': 'about',
  '#team': 'team',
  '#live-different': 'live-different',
}

export const pageOfSection = (href: string): PageId | null => SECTION_PAGE[href] ?? null

/** The address of a page. */
export const pageHref = (p: PageId) => (p === 'home' ? '#top' : `#/${p}`)

export function pageFromHash(hash = window.location.hash): PageId {
  const m = hash.match(/^#\/([\w-]+)$/)
  if (m && PAGES.includes(m[1] as PageId)) return m[1] as PageId
  // a shared project opens over the projects page
  if (/^#\/project\//.test(hash)) return 'projects'
  return 'home'
}

// --- the current page, shared with the header and the links ---
let current: PageId = typeof window === 'undefined' ? 'home' : pageFromHash()
const listeners = new Set<() => void>()
export const currentPage = () => current
export function setCurrentPage(p: PageId) {
  if (p === current) return
  current = p
  listeners.forEach((l) => l())
}
export const usePage = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => current,
  )

/** Ask the app to open a page (and, once it stands, go to one of its sections). */
export function openPage(page: PageId, section?: string) {
  window.dispatchEvent(new CustomEvent('site:page', { detail: { page, section } }))
}

// A filter chosen on another page waits here until the projects page is built.
let pendingFilter: string | null = null
export function requestProjectsFilter(category: string) {
  pendingFilter = category
  window.dispatchEvent(new CustomEvent('projects:filter', { detail: category }))
}
export function takeProjectsFilter() {
  const f = pendingFilter
  pendingFilter = null
  return f
}
