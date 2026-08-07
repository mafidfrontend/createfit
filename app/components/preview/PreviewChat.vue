<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useDesignStore } from '~/stores/design'

const designStore = useDesignStore()
const messagesContainer = ref<HTMLElement | null>(null)
const inputText = ref('')

const exampleSuggestions = [
  'Сделай логотип меньше',
  'Замени волка на льва',
  'Измени цвет на чёрный',
  'Добавь текст на спине',
]

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => designStore.chatMessages.length, scrollToBottom)

function send() {
  const text = inputText.value.trim()
  if (!text) return
  designStore.addChatMessage('user', text)
  inputText.value = ''
  scrollToBottom()

  setTimeout(() => {
    const responses: Record<string, string> = {
      'меньше': 'Хорошо, уменьшаю логотип на груди. Обновляю превью...',
      'больше': 'Хорошо, увеличиваю логотип. Обновляю превью...',
      'льва': 'Заменяю волка на льва в минималистичном стиле. Обновляю превью...',
      'льв': 'Заменяю волка на льва в минималистичном стиле. Обновляю превью...',
      'чёрн': 'Меняю основной цвет на чёрный. Обновляю превью...',
      'черн': 'Меняю основной цвет на чёрный. Обновляю превью...',
      'текст': 'Добавляю текст на спине. Обновляю превью...',
      'шрифт': 'Изменяю шрифт надписи. Обновляю превью...',
    }

    let response = 'Принял правку. Обновляю превью...'
    const lower = text.toLowerCase()
    for (const key in responses) {
      if (lower.includes(key)) {
        response = responses[key] ?? response
        break
      }
    }
    designStore.addChatMessage('ai', response)
    scrollToBottom()
  }, 800)
}

function sendSuggestion(suggestion: string) {
  inputText.value = suggestion
  send()
}
</script>

<template>
  <div class="flex flex-col rounded-2xl border border-neutral-200 bg-white">
    <div class="border-b border-neutral-100 px-4 py-3">
      <h3 class="text-sm font-bold text-neutral-900">Редактирование с помощью AI</h3>
      <p class="mt-0.5 text-xs text-neutral-400">Опишите правку, и AI обновит дизайн</p>
    </div>

    <div
      ref="messagesContainer"
      class="max-h-64 min-h-[80px] flex-1 space-y-3 overflow-y-auto px-4 py-3"
    >
      <div v-if="designStore.chatMessages.length === 0" class="flex flex-col items-center justify-center py-6 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
          <svg class="h-5 w-5 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8 12 3z" />
          </svg>
        </div>
        <p class="mt-2 text-xs text-neutral-400">Напишите правку, чтобы обновить дизайн</p>
      </div>

      <div
        v-for="msg in designStore.chatMessages"
        :key="msg.id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm"
          :class="
            msg.role === 'user'
              ? 'rounded-br-md bg-primary-600 text-white'
              : 'rounded-bl-md bg-neutral-100 text-neutral-800'
          "
        >
          {{ msg.text }}
        </div>
      </div>
    </div>

    <div class="border-t border-neutral-100 p-3">
      <div v-if="designStore.chatMessages.length === 0" class="mb-2 flex flex-wrap gap-1.5">
        <button
          v-for="suggestion in exampleSuggestions"
          :key="suggestion"
          class="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 transition-colors active:bg-neutral-100"
          @click="sendSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="inputText"
          type="text"
          placeholder="Напишите правку..."
          class="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          @keydown.enter="send"
        />
        <button
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors active:bg-primary-700 disabled:opacity-40"
          :disabled="!inputText.trim()"
          aria-label="Отправить правку"
          @click="send"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
