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
  join_policy: 'PRIVATE' | 'INVITE_LINK'
  invite_token?: string | null
}

export interface SessionMember {
  member_id: number
  member_name: string
  is_reading: boolean
}

export interface Session {
  id: string
  book: Book
  due_date: string
  status: 'active' | 'finished'
  members: SessionMember[]
  discussions: Discussion[]
}

export interface Discussion {
  id: string
  title: string
  scheduled_at: string
  location?: string
}

export interface DiscussionNote {
  id: string
  discussion_id: string
  content: string
  visibility: 'private' | 'public'
  created_at: string
  updated_at: string
}

export interface Book {
  id?: number
  title: string
  author: string
  edition?: string
  year?: number
  isbn?: string
  page_count?: number
  image_url?: string
  external_google_id?: string
  description?: string
  publisher?: string
  categories?: string[]
  language?: string
}

export interface DiscussionAttendance {
  member_id: number
  name: string
  status: 'yes' | 'no' | 'maybe'
}

export interface AttendanceRoster {
  responses: DiscussionAttendance[]
  my_status: 'yes' | 'no' | 'maybe' | null
  total_members: number
}

export interface LikeStatus {
  liked: boolean
}

export type ShelfValue = 'want_to_read' | 'read' | 'not_finished' | 'currently_reading'

export interface ShelfStatus {
  shelf: ShelfValue | null
}

export interface ShelfEntry {
  shelf: ShelfValue
  updated_at: string
  source: 'manual' | 'session'
  book: Book
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
  avatar_path?: string | null
}

export interface ReadingLogEntry {
  id: string
  book: {
    id: number
    title: string
    author: string
    image_url: string | null
  }
  club: {
    id: string
    name: string
  }
  due_date: string | null
}

export interface ReadingLog {
  active: ReadingLogEntry[]
  finished: ReadingLogEntry[]
}

export type ProgressType = 'page' | 'percent'
export type ProgressStatus = 'in_progress' | 'completed'

export interface ReadingProgress {
  id: string
  member_id: number
  book_id: number
  session_id: string | null
  progress_type: ProgressType
  current_page: number | null
  percent_complete: number | null
  status: ProgressStatus
  started_at: string
  updated_at: string
  completed_at: string | null
  book?: Book
}
