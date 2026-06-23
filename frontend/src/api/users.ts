import client from './client'
import type { User, DashboardStats } from '../types'

export async function createOrFetchUser(username: string): Promise<User> {
  const res = await client.post('/users', { username })
  return res.data
}

export async function fetchUser(userId: string): Promise<User> {
  const res = await client.get(`/users/${userId}`)
  return res.data
}

export async function updateUsername(userId: string, username: string): Promise<User> {
  const res = await client.patch(`/users/${userId}`, { username })
  return res.data
}

export async function fetchStats(userId: string): Promise<DashboardStats> {
  const res = await client.get(`/users/${userId}/stats`)
  return res.data
}
