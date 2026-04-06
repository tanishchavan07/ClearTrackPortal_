import { UserRole } from '@/types'

export const isAdmin = (role?: UserRole | string | null) => role === 'admin'
export const isTeamOrAdmin = (role?: UserRole | string | null) => role === 'team' || role === 'admin'
export const isClient = (role?: UserRole | string | null) => role === 'client'
