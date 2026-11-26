import founderStanding from '../assets/img/founder-standing.jpg'
import { brand } from './site'
import type { T } from '../i18n'

/**
 * The people of Runway, in the order they appear on the page. Edit here; the Team section reads
 * from this list. A member without `photo` is shown with their initials in gold until a portrait
 * is supplied.
 *
 * PROVISIONAL: every entry marked `draft` is a stand-in until the company sends the real names,
 * roles and portraits. Replace them before publishing.
 */
export type Member = {
  name: string
  role: T
  city?: T
  bio?: T
  photo?: string
  draft?: boolean
}

export const team: Member[] = [
  {
    name: brand.founder.name,
    role: brand.founder.role,
    city: { en: 'Montreal', es: 'Montreal' },
    bio: brand.founder.quote,
    photo: founderStanding,
  },
  { name: 'Nombre Apellido', role: { en: 'Role', es: 'Cargo' }, draft: true },
  { name: 'Nombre Apellido', role: { en: 'Role', es: 'Cargo' }, draft: true },
  { name: 'Nombre Apellido', role: { en: 'Role', es: 'Cargo' }, draft: true },
  { name: 'Nombre Apellido', role: { en: 'Role', es: 'Cargo' }, draft: true },
]
