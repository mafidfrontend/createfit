import { defineStore } from 'pinia'
import type { Measurements } from '~/types'

interface MeasurementsState {
  data: Measurements
  isProcessing: boolean
  validationError: string | null
  confirmed: boolean
}

const defaultMeasurements: Measurements = {
  chest: null,
  waist: null,
  hip: null,
  shoulder: null,
  sleeve: null,
  height: null,
  frontPhoto: null,
  sidePhoto: null,
  a4Detected: false,
  validated: false,
}

export const useMeasurementsStore = defineStore('measurements', {
  state: (): MeasurementsState => ({
    data: { ...defaultMeasurements },
    isProcessing: false,
    validationError: null,
    confirmed: false,
  }),

  actions: {
    setPhotos(front: string, side: string) {
      this.data.frontPhoto = front
      this.data.sidePhoto = side
    },

    setValidationError(error: string | null) {
      this.validationError = error
    },

    setProcessing(value: boolean) {
      this.isProcessing = value
    },

    setMeasurements(m: Partial<Measurements>) {
      this.data = { ...this.data, ...m }
    },

    updateMeasurement(key: keyof Measurements, value: number | null) {
      this.data[key] = value as never
    },

    confirm() {
      this.confirmed = true
    },

    reset() {
      this.data = { ...defaultMeasurements }
      this.isProcessing = false
      this.validationError = null
      this.confirmed = false
    },
  },
})
