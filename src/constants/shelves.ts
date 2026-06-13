import type { ShelfValue } from '../types'

export const SHELF_OPTIONS: Array<{ value: ShelfValue | null; label: string }> = [
  { value: null,               label: 'None' },
  { value: 'currently_reading', label: 'Currently Reading' },
  { value: 'read',              label: 'Read' },
  { value: 'want_to_read',      label: 'Want to Read' },
  { value: 'not_finished',      label: 'Not Finished' },
]

export const SHELF_LABELS: Record<ShelfValue, string> = {
  currently_reading: 'Currently Reading',
  want_to_read:      'Want to Read',
  read:              'Read',
  not_finished:      'Not Finished',
}

export const SHELF_SECTIONS: Array<{ value: ShelfValue; label: string }> = [
  { value: 'currently_reading', label: 'Currently Reading' },
  { value: 'read',              label: 'Read' },
  { value: 'want_to_read',      label: 'Want to Read' },
  { value: 'not_finished',      label: 'Not Finished' },
]
