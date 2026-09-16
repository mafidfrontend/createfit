export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = process.env.TELEGRAM_BOT_TOKEN // yoki bevosita token

  // Agar foydalanuvchi /start yuborgan bo'lsa
  if (body?.message?.text === '/start') {
    const chatId = body.message.chat.id

    const payload = {
      chat_id: chatId,
      photo: 'public/IMG_20260916_184133_910.png', // public/banner.jpg dagi rasm manzili
      caption: `👋 <b>Добро пожаловать в Chat Wear!</b>\n\n` +
               `Здесь ты можешь <b>создать одежду</b> специально для себя — от идеи до готового заказа.\n\n` +
               `🎨 Придумай дизайн\n` +
               `👕 Выбери модель и ткань\n` +
               `📏 Определи свой размер\n` +
               `🛒 Сделай заказ\n\n` +
               `👇 Чтобы начать, нажми кнопку «Open» ниже.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Open',
              web_app: { url: 'https://fabrika.chat' } // Mini App havolasi
            }
          ]
        ]
      }
    }

    await $fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: payload
    })
  }

  return { ok: true }
})
