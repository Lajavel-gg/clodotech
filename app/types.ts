export interface Livre {
  id: number
  isbn: string
  titre: string
  sousTitre: string | null
  auteur: string
  dateSortie: string | null
  editeur: string | null
  categorie: string | null
  description: string | null
  image: string | null
  pages: number | null
  dateAjout: string
  userId: string
  status: 'to_read' | 'reading' | 'completed'
  rating: number | null
  notes: string | null
  wishlist: boolean
  startedAt: string | null
  completedAt: string | null
  currentPage: number | null
  chapitres: number | null
}

export interface LivreFormData {
  isbn: string
  titre: string
  sousTitre?: string
  auteur: string
  dateSortie?: string
  editeur?: string
  categorie?: string
  description?: string
  image?: string
  pages?: number
  status?: string
  wishlist?: boolean
}

export interface UserStats {
  totalLivres: number
  totalPages: number
  uniqueAuthors: number
  uniqueCategories: number
  toRead: number
  reading: number
  completed: number
  wishlist: number
  averageRating: number
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  bookId: number | null
  read: boolean
  createdAt: string
}
