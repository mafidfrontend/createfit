import { defineStore } from 'pinia'
import type { PersonalInfo } from '~/types'

interface UserState {
  telegramId: string | null
  firstName: string
  lastName: string
  username: string
  photoUrl: string | null
  isAuthenticated: boolean
  personalInfo: PersonalInfo
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    telegramId: null,
    firstName: '',
    lastName: '',
    username: '',
    photoUrl: null,
    isAuthenticated: false,
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    },
  }),

  actions: {
    setTelegramUser(data: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      photo_url?: string
    }) {
      this.telegramId = String(data.id)
      this.firstName = data.first_name ?? ''
      this.lastName = data.last_name ?? ''
      this.username = data.username ?? ''
      this.photoUrl = data.photo_url ?? null
      this.isAuthenticated = true
    },

    updatePersonalInfo(info: Partial<PersonalInfo>) {
      this.personalInfo = { ...this.personalInfo, ...info }
    },
  },
})
