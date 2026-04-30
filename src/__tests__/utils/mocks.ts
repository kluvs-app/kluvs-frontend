import type { Server, Club, Member, MemberClub, Session, Discussion, Book } from '../../types'

const adminClub1: MemberClub = { id: 'club-1', name: 'Book Lovers Club', discord_channel: 'book-club', server_id: 'server-1', role: 'admin' }
const adminClub2: MemberClub = { id: 'club-2', name: 'Sci-Fi Readers', discord_channel: 'sci-fi', server_id: 'server-1', role: 'admin' }
const memberClub1: MemberClub = { id: 'club-1', name: 'Book Lovers Club', discord_channel: 'book-club', server_id: 'server-1', role: 'member' }

// Mock Members
export const mockAdminMember: Member = {
  id: 1,
  user_id: 'admin-user-id',
  name: 'Admin User',
  handle: 'admin_handle',
  points: 100,
  books_read: 10,
  clubs: [adminClub1, adminClub2],
  created_at: '2024-01-01T00:00:00Z',
}

export const mockRegularMember: Member = {
  id: 2,
  user_id: 'regular-user-id',
  name: 'Regular User',
  handle: 'regular_handle',
  points: 50,
  books_read: 5,
  clubs: [memberClub1],
  created_at: '2024-01-15T00:00:00Z',
}

export const mockMember3: Member = {
  id: 3,
  user_id: 'user-3-id',
  name: 'Jane Smith',
  points: 75,
  books_read: 7,
  clubs: [memberClub1],
}

// Mock Books
export const mockBook: Book = {
  id: 1,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  edition: 'First Edition',
  year: 1925,
  isbn: '978-0-7432-7356-5',
  page_count: 180,
}

export const mockBook2: Book = {
  id: 2,
  title: '1984',
  author: 'George Orwell',
  year: 1949,
  page_count: 328,
}

// Mock Discussions
export const mockDiscussion: Discussion = {
  id: 'discussion-1',
  title: 'Chapter 1-3 Discussion',
  date: '2024-06-15',
  location: 'Discord Voice Channel',
}

export const mockDiscussion2: Discussion = {
  id: 'discussion-2',
  title: 'Final Discussion',
  date: '2024-07-01',
}

// Mock Sessions
export const mockActiveSession: Session = {
  id: 'session-1',
  book: mockBook,
  due_date: '2024-12-31',
  discussions: [mockDiscussion, mockDiscussion2],
}

export const mockPastSession: Session = {
  id: 'session-2',
  book: mockBook2,
  due_date: '2024-01-01',
  discussions: [mockDiscussion],
}

// Mock Clubs
export const mockClub: Club = {
  id: 'club-1',
  name: 'Book Lovers Club',
  discord_channel: 'book-club',
  server_id: 'server-1',
  founded_date: '2024-01-01',
  members: [mockAdminMember, mockRegularMember, mockMember3],
  active_session: mockActiveSession,
  past_sessions: [mockPastSession],
  shame_list: [2, 3],
}

export const mockClub2: Club = {
  id: 'club-2',
  name: 'Sci-Fi Readers',
  discord_channel: 'sci-fi',
  server_id: 'server-1',
  members: [mockAdminMember],
  active_session: null,
  past_sessions: [],
  shame_list: [],
}

// Mock Servers
export const mockServer: Server = {
  id: 'server-1',
  name: "Blingers' Books",
  clubs: [mockClub, mockClub2],
}

export const mockServer2: Server = {
  id: 'server-2',
  name: 'Another Server',
  clubs: [],
}

// Mock Supabase User
export const mockSupabaseUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  user_metadata: {
    full_name: 'Admin User',
    name: 'Admin User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockSupabaseRegularUser = {
  id: 'regular-user-id',
  email: 'user@example.com',
  user_metadata: {
    full_name: 'Regular User',
    name: 'Regular User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-15T00:00:00Z',
}
