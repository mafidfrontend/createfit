import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env fayldagi kalitlarni o'qish
dotenv.config()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function testConnection() {
  console.log("1. Kalitlar tekshirilmoqda...")
  if (!url || !key) {
    console.error("XATOLIK: .env faylida SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY topilmadi!")
    return
  }
  console.log("Kalitlar topildi. URL:", url)

  const supabase = createClient(url, key)

  console.log("\n2. Supabase bazasiga ulanish va 'orders' jadvalini tekshirish...")
  const { data, error } = await supabase.from('orders').select('id, order_number').limit(1)

  if (error) {
    console.error("XATOLIK YUZ BERDI:", error.message)
    console.error("To'liq xato:", error)
  } else {
    console.log("MUVAFFAQIYATLI ULANDI! 'orders' jadvali mavjud va ishlashga tayyor.")
    console.log("Baza javobi:", data)
  }
}

testConnection()