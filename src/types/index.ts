export interface Server {
  id: string
  name: string
  clubs: Club[]
}

export interface Club {
  id: string
  name: string
  discord_channel: string
  server_id: string
  founded_date?: string
  members: Member[]
  active_session: Session | null
  past_sessions: Session[]
  shame_list: number[]
}

export interface Session {
  id: string
  book: Book
  due_date: string
  discussions: Discussion[]
}

export interface Discussion {
  id: string
  title: string
  date: string
  location?: string
}

export interface Book {
  id?: number
  title: string
  author: string
  edition?: string
  year?: number
  isbn?: string
  page_count?: number
}

export type UserRole = 'owner' | 'admin' | 'member'

export interface MemberClub {
  id: string
  name: string
  discord_channel: string
  server_id: string
  role: UserRole
}

export interface Member {
  id: number
  user_id?: string
  name: string
  handle?: string
  books_read: number
  clubs: MemberClub[]
  created_at?: string
  discord_id?: string | null
  avatar_path?: string
}
