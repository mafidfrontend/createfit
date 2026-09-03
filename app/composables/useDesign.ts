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
      const response = await $fetch<GenerateDesignResponse | { success: false; error: string }>(
        '/api/design/generate',
        {
          method: 'POST',
          body: request,
        },
      )

      if ('success' in response && response.success === false) {
        error.value = 'Сгенерированное изображение неполное — попробуйте ещё раз'
        return null
      }

      const data = response as GenerateDesignResponse
      if (!data.frontImage || !data.backImage) {
        error.value = 'Сгенерированное изображение неполное — попробуйте ещё раз'
        return null
      }

      return data
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'data' in err) {
        const data = (err as { data?: { statusMessage?: string; error?: string } }).data
        error.value = data?.error ?? data?.statusMessage ?? 'Не удалось сгенерировать дизайн'
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
