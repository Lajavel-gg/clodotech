import { z } from 'zod'

// ============================================
// Schemas de validation pour la securite
// ============================================

// Validation email
const emailSchema = z
  .string()
  .min(1, 'Email requis')
  .email('Format email invalide')
  .max(255, 'Email trop long')

// Validation mot de passe
const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caracteres')
  .max(128, 'Maximum 128 caracteres')
  .regex(/[A-Z]/, 'Doit contenir une majuscule')
  .regex(/[a-z]/, 'Doit contenir une minuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre')

// Validation URL (pour les images)
const imageUrlSchema = z
  .string()
  .url('URL invalide')
  .max(2048, 'URL trop longue')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        // Liste blanche de domaines autorises pour les images
        const allowedHosts = [
          'books.google.com',
          'covers.openlibrary.org',
          'images-na.ssl-images-amazon.com',
          'm.media-amazon.com',
          'images.amazon.com',
          'ecx.images-amazon.com',
          'd.gr-assets.com',
          'i.gr-assets.com',
          's.gr-assets.com'
        ]
        return allowedHosts.some(host => parsed.hostname.endsWith(host))
      } catch {
        return false
      }
    },
    { message: 'Source image non autorisee' }
  )
  .optional()
  .nullable()

// Schema inscription
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .max(100, 'Nom trop long')
    .optional()
})

// Schema connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis')
})

// Schema livre (creation)
export const createLivreSchema = z.object({
  isbn: z
    .string()
    .min(10, 'ISBN invalide')
    .max(17, 'ISBN invalide')
    .regex(/^[\d-X]+$/, 'Format ISBN invalide'),
  titre: z
    .string()
    .min(1, 'Titre requis')
    .max(500, 'Titre trop long'),
  sousTitre: z
    .string()
    .max(500, 'Sous-titre trop long')
    .optional()
    .nullable(),
  auteur: z
    .string()
    .min(1, 'Auteur requis')
    .max(200, 'Nom auteur trop long'),
  dateSortie: z
    .string()
    .max(50, 'Date trop longue')
    .optional()
    .nullable(),
  editeur: z
    .string()
    .max(200, 'Editeur trop long')
    .optional()
    .nullable(),
  categorie: z
    .string()
    .max(100, 'Categorie trop longue')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(10000, 'Description trop longue')
    .optional()
    .nullable(),
  image: imageUrlSchema,
  pages: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) || num < 0 || num > 50000 ? null : num
    }),
  status: z
    .enum(['to_read', 'reading', 'completed'])
    .optional()
    .default('to_read'),
  wishlist: z
    .boolean()
    .optional()
    .default(false)
})

// Schema livre (mise a jour)
export const updateLivreSchema = z.object({
  titre: z
    .string()
    .min(1, 'Titre requis')
    .max(500, 'Titre trop long')
    .optional(),
  sousTitre: z
    .string()
    .max(500, 'Sous-titre trop long')
    .optional()
    .nullable(),
  auteur: z
    .string()
    .min(1, 'Auteur requis')
    .max(200, 'Nom auteur trop long')
    .optional(),
  editeur: z
    .string()
    .max(200, 'Editeur trop long')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(10000, 'Description trop longue')
    .optional()
    .nullable(),
  pages: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) || num < 0 || num > 50000 ? null : num
    }),
  status: z
    .enum(['to_read', 'reading', 'completed'])
    .optional(),
  rating: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) || num < 1 || num > 5 ? null : num
    }),
  notes: z
    .string()
    .max(10000, 'Notes trop longues')
    .optional()
    .nullable(),
  wishlist: z
    .boolean()
    .optional(),
  startedAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  completedAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  currentPage: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) || num < 0 || num > 50000 ? null : num
    }),
  chapitres: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) || num < 0 || num > 1000 ? null : num
    })
})

// Schema ID (pour les parametres URL)
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID invalide')
    .transform(Number)
})

// Helper pour valider et retourner les erreurs formatees
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = result.error.issues.map(e => e.message).join(', ')
  return { success: false, error: errors }
}
