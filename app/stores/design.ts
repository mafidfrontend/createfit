import { defineStore } from 'pinia'
import type { Design } from '~/types'
import type { DesignStyle, ShirtColor } from '~/types/design'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  timestamp: string
}

interface DesignState {
  current: Design | null
  history: Design[]
  isGenerating: boolean
  isRegenerating: boolean
  style: DesignStyle
  shirtColor: ShirtColor
  generateError: string | null
  chatMessages: ChatMessage[]
}

export const useDesignStore = defineStore('design', {
  persist: true,
  state: (): DesignState => ({
    current: null,
    history: [],
    isGenerating: false,
    isRegenerating: false,
    style: 'streetwear',
    shirtColor: 'black',
    generateError: null,
    chatMessages: [],
  }),

  actions: {
    startDesign(
      productId: string,
      fabricId: string,
      prompt: string,
      referenceImage: string | null,
      style: DesignStyle,
      shirtColor: ShirtColor,
    ) {
      this.current = {
        id: crypto.randomUUID(),
        prompt,
        referenceImage,
        productId,
        fabricId,
        frontImage: null,
        backImage: null,
        createdAt: new Date().toISOString(),
      }
      this.style = style
      this.shirtColor = shirtColor
      this.generateError = null
      this.chatMessages = []
    },

    updatePrompt(prompt: string) {
      if (this.current) {
        this.current.prompt = prompt
      }
    },

    setGeneratedImages(frontImage: string, backImage: string) {
      if (this.current) {
        this.current.frontImage = frontImage
        this.current.backImage = backImage
      }
    },

    setGenerating(value: boolean) {
      this.isGenerating = value
    },

    setRegenerating(value: boolean) {
      this.isRegenerating = value
    },

    setGenerateError(message: string | null) {
      this.generateError = message
    },

    addChatMessage(role: 'user' | 'ai', text: string) {
      this.chatMessages.push({
        id: crypto.randomUUID(),
        role,
        text,
        timestamp: new Date().toISOString(),
      })
    },

    saveToHistory() {
      if (this.current) {
        this.history.push({ ...this.current })
      }
    },
  },
})
