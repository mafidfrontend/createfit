import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'

export function normalizePhone(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const parsed = parsePhoneNumberFromString(trimmed)
  if (!parsed || !parsed.isValid()) return null
  return parsed.number
}

export function formatPhone(input: string): string {
  if (!input) return ''
  const asYouType = new AsYouType()
  return asYouType.input(input)
}

export function getCountryCode(input: string): string | null {
  if (!input) return null
  const parsed = parsePhoneNumberFromString(input.trim())
  if (!parsed) return null
  return parsed.country ?? null
}
