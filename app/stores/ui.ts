import { defineStore } from 'pinia'

interface UiState {
  bottomSheetOpen: boolean
  bottomSheetComponent: string | null
  loadingOverlayVisible: boolean
  loadingMessage: string
  theme: 'light' | 'dark'
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    bottomSheetOpen: false,
    bottomSheetComponent: null,
    loadingOverlayVisible: false,
    loadingMessage: '',
    theme: 'light',
  }),

  actions: {
    openBottomSheet(component: string) {
      this.bottomSheetComponent = component
      this.bottomSheetOpen = true
    },

    closeBottomSheet() {
      this.bottomSheetOpen = false
      this.bottomSheetComponent = null
    },

    showLoading(message = '') {
      this.loadingMessage = message
      this.loadingOverlayVisible = true
    },

    hideLoading() {
      this.loadingOverlayVisible = false
      this.loadingMessage = ''
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
  },
})
