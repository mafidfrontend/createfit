import { defineStore } from 'pinia'

interface UiState {
  menuOpen: boolean
  loadingOverlayVisible: boolean
  loadingMessage: string
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    menuOpen: false,
    loadingOverlayVisible: false,
    loadingMessage: '',
  }),

  actions: {
    openMenu() {
      this.menuOpen = true
    },

    closeMenu() {
      this.menuOpen = false
    },

    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },

    showLoading(message = '') {
      this.loadingMessage = message
      this.loadingOverlayVisible = true
    },

    hideLoading() {
      this.loadingOverlayVisible = false
      this.loadingMessage = ''
    },
  },
})
