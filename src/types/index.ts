/**
 * Wire types for every Edge Function the app calls.
 *
 * All of these are aliases over `api.gen.ts`, which is generated from the
 * canonical spec in kluvs-api (`npm run api:generate`). Never hand-write a wire
 * shape here — if the spec is wrong, fix the backend `@openapi` annotation and
 * regenerate. UI-only types (props, form state, …) live next to their components.
 *
 * Aliases keep the app's historical names where they differ from the spec
 * (e.g. `SessionMember` → `SessionParticipantSummary`) so import sites stay stable.
 */
import type { components } from './api.gen'

type Schemas = components['schemas']

// ── Entities ────────────────────────────────────────────────────────────────

export type Server = Schemas['Server']
export type Club = Schemas['Club']
export type ClubMember = Schemas['ClubMember']
export type PastSession = Schemas['PastSession']
export type Session = Schemas['Session']
/** A member's participation summary embedded in a session (spec: `SessionParticipantSummary`). */
export type SessionMember = Schemas['SessionParticipantSummary']
export type Discussion = Schemas['Discussion']
export type DiscussionNote = Schemas['DiscussionNote']
export type Book = Schemas['Book']
/** A club within a member's `clubs` list, including the member's per-club role. */
export type MemberClub = Schemas['MemberClubEntry']
/**
 * Spec: `MemberGetResponse` = allOf(Member, { clubs: MemberClubEntry[], shame_clubs }).
 * The extension *redefines* `clubs`, but openapi-typescript renders allOf as an
 * intersection (`ClubSummary[] & MemberClubEntry[]`), so pick the overriding definition.
 */
export type Member = Omit<Schemas['MemberGetResponse'], 'clubs'> & { clubs?: MemberClub[] }
export type UserRole = NonNullable<MemberClub['role']>
export type ShelfValue = Schemas['ShelfStatus']
export type ShelfEntry = Schemas['ShelfEntry']
export type ReadingProgress = Schemas['ReadingProgress']
export type ProgressType = ReadingProgress['progress_type']
export type ProgressStatus = ReadingProgress['status']
/** One member's RSVP in a discussion roster (spec: `DiscussionAttendanceRosterEntry`). */
export type DiscussionAttendance = Schemas['DiscussionAttendanceRosterEntry']
export type DiscordGuild = Schemas['DiscordGuildWithChannels']

// ── Response envelopes ──────────────────────────────────────────────────────

export type ClubCreateResponse = Schemas['ClubCreateResponse']
export type ClubUpdateResponse = Schemas['ClubUpdateResponse']
export type DeleteResponse = Schemas['DeleteResponse']
export type MemberCreateResponse = Schemas['MemberCreateResponse']
export type MemberUpdateResponse = Schemas['MemberUpdateResponse'] | Schemas['MemberAddToClubResponse']
export type SessionCreateResponse = Schemas['SessionCreateResponse']
export type SessionUpdateResponse =
  | Schemas['SessionFinishResponse']
  | Schemas['SessionNoChangesResponse']
  | Schemas['SessionGeneralUpdateResponse']
export type SessionFinishResponse = Schemas['SessionFinishResponse']
/** Spec: `SessionReadingLogResponse`. */
export type ReadingLogResponse = Schemas['SessionReadingLogResponse']
export type ReadingLog = Schemas['SessionReadingLogGroups']
export type ReadingLogEntry = Schemas['SessionReadingLogEntry']
export type BookSearchResponse = Schemas['BookSearchResponse']
export type BookRegistrationResponse = Schemas['BookRegistrationResponse']
export type JoinResponse = Schemas['JoinResponse']
export type JoinPreviewResponse = Schemas['JoinPreviewResponse']
export type LikeStatusResponse = Schemas['LikeStatusResponse']
export type LikeToggleResponse = Schemas['LikeToggleResponse']
export type ShelfListResponse = Schemas['ShelfListResponse']
export type ShelfSingleResponse = Schemas['ShelfSingleResponse']
export type ShelfAssignResponse = Schemas['ShelfAssignResponse']
export type ProgressDeleteResponse = Schemas['ProgressDeleteResponse']
/** Spec: `DiscussionAttendanceRosterResponse`. */
export type AttendanceRoster = Schemas['DiscussionAttendanceRosterResponse']
export type DiscussionAttendanceRecord = Schemas['DiscussionAttendance']
