import Dexie, { type Table } from 'dexie'

export interface LocalExhibitor {
  id: string
  name: string
  booth_number: string
  hall: string
  pin_hash: string
}

export interface LocalVisit {
  id: string
  visitor_id: string
  exhibitor_id: string
  visited_at: string
  day: 1 | 2 | 3
  rating: number | null
  synced: boolean
}

class AppDB extends Dexie {
  exhibitors!: Table<LocalExhibitor>
  visits!: Table<LocalVisit>

  constructor() {
    super('infocomm2026')
    this.version(1).stores({
      exhibitors: 'id, hall',
      visits: 'id, visitor_id, exhibitor_id, synced',
    })
  }
}

export const db = new AppDB()
