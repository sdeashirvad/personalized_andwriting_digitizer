import { useState, useEffect, useCallback } from 'react'
import { createOrFetchUser } from '../api/users'
import type { User } from '../types'

const USER_KEY = 'hd_user_id'
const USERNAME_KEY = 'hd_username'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_KEY)
    const storedUsername = localStorage.getItem(USERNAME_KEY)
    if (storedUserId && storedUsername) {
      setUser({ id: storedUserId, username: storedUsername, createdAt: '' })
      setIsLoading(false)
    } else {
      setNeedsOnboarding(true)
      setIsLoading(false)
    }
  }, [])

  const completeOnboarding = useCallback(async (username: string) => {
    setIsLoading(true)
    try {
      const newUser = await createOrFetchUser(username)
      localStorage.setItem(USER_KEY, newUser.id)
      localStorage.setItem(USERNAME_KEY, newUser.username)
      setUser(newUser)
      setNeedsOnboarding(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback((updated: User) => {
    localStorage.setItem(USER_KEY, updated.id)
    localStorage.setItem(USERNAME_KEY, updated.username)
    setUser(updated)
  }, [])

  return { user, isLoading, needsOnboarding, completeOnboarding, updateUser }
}
