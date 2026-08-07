import { ref } from 'vue'
import type { GenerateDesignRequest, GenerateDesignResponse } from '~/types/design'

export function useDesign() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function generateDesign(
    request: GenerateDesignRequest,
  ): Promise<GenerateDesignResponse | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<GenerateDesignResponse>('/api/design/generate', {
        method: 'POST',
        body: request,
      })
      return response
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'data' in err) {
        const data = (err as { data?: { statusMessage?: string } }).data
        error.value = data?.statusMessage ?? 'Не удалось сгенерировать дизайн'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Не удалось сгенерировать дизайн'
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    generateDesign,
  }
}
