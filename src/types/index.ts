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
/** A club as returned by GET /club (spec: `ClubDetail`), with members and sessions populated. */
export type Club = Schemas['ClubDetail']
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
/** Spec: `MemberGetResponse` = allOf(Member, { clubs: MemberClubEntry[], shame_clubs }). */
export type Member = Schemas['MemberGetResponse']
/** One result of GET /member?search= (spec: `MemberSearchResult`). */
export type MemberSearchResult = Schemas['MemberSearchResult']
export type UserRole = NonNullable<MemberClub['role']>
export type ShelfValue = Schemas['ShelfStatus']
export type ShelfEntry = Schemas['ShelfEntry']
export type ReadingProgress = Schemas['ReadingProgress']
export type ProgressType = ReadingProgress['progress_type']
export type ProgressStatus = ReadingProgress['status']
/** One member's RSVP in a discussion roster (spec: `DiscussionAttendanceRosterEntry`). */
export type DiscussionAttendance = Schemas['DiscussionAttendanceRosterEntry']
export type DiscordGuild = Schemas['DiscordGuildWithChannels']
export type BookVolumeInfo = Schemas['BookVolumeInfo']
export type AuthorInfo = Schemas['AuthorInfo']
export type AuthorBook = Schemas['AuthorBook']

// ── Response envelopes ──────────────────────────────────────────────────────

export type ClubCreateResponse = Schemas['ClubCreateResponse']
export type ClubUpdateResponse = Schemas['ClubUpdateResponse']
export type DeleteResponse = Schemas['DeleteResponse']
export type MemberCreateResponse = Schemas['MemberCreateResponse']
export type MemberUpdateResponse = Schemas['MemberUpdateResponse'] | Schemas['MemberAddToClubResponse']
export type MemberRemoveFromClubResponse = Schemas['MemberRemoveFromClubResponse']
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
/** Spec: `MemberSearchResponse` (GET /member?search=). */
export type MemberSearchResponse = Schemas['MemberSearchResponse']
export type BookSearchResponse = Schemas['BookSearchResponse']
export type BookRegistrationResponse = Schemas['BookRegistrationResponse']
/** Spec: `BookEnrichmentResponse`. `volumeInfo`/`authorInfo` are `null` when a lookup fails or its param was omitted. */
export type BookEnrichmentResponse = Schemas['BookEnrichmentResponse']
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
