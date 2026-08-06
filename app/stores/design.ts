import { defineStore } from 'pinia'
import type { Design } from '~/types'

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
  chatMessages: ChatMessage[]
}

export const useDesignStore = defineStore('design', {
  state: (): DesignState => ({
    current: null,
    history: [],
    isGenerating: false,
    isRegenerating: false,
    chatMessages: [],
  }),

  actions: {
    startDesign(
      productId: string,
      fabricId: string,
      prompt: string,
      referenceImage: string | null,
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
      this.chatMessages = []
    },

    updatePrompt(prompt: string) {
      if (this.current) {
        this.current.prompt = prompt
      }
    },

    setGeneratedImages(front: string, back: string) {
      if (this.current) {
        this.current.frontImage = front
        this.current.backImage = back
      }
    },

    setGenerating(value: boolean) {
      this.isGenerating = value
    },

    setRegenerating(value: boolean) {
      this.isRegenerating = value
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
