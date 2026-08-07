import { defineStore } from 'pinia'
import type { Measurements, MeasurementPersonalInfo, PhotoSlot, PhotoValidationState } from '~/types'

interface MeasurementsState {
  step: 1 | 2 | 3 | 4
  personalInfo: MeasurementPersonalInfo
  frontPhoto: PhotoSlot
  sidePhoto: PhotoSlot
  data: Measurements
  isExtracting: boolean
  confirmed: boolean
}

const defaultPersonalInfo: MeasurementPersonalInfo = {
  name: '',
  height: '',
  age: '',
  phoneModel: '',
}

const emptyPhoto: PhotoSlot = {
  dataUrl: null,
  state: 'idle',
  attempt: 0,
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
  persist: true,
  state: (): MeasurementsState => ({
    step: 1,
    personalInfo: { ...defaultPersonalInfo },
    frontPhoto: { ...emptyPhoto },
    sidePhoto: { ...emptyPhoto },
    data: { ...defaultMeasurements },
    isExtracting: false,
    confirmed: false,
  }),

  getters: {
    bothPhotosValidated: (state): boolean =>
      state.frontPhoto.state === 'success' && state.sidePhoto.state === 'success',

    personalInfoValid: (state): boolean => {
      const { name, height, age, phoneModel } = state.personalInfo
      return name.trim() !== '' && height.trim() !== '' && age.trim() !== '' && phoneModel.trim() !== ''
    },
  },

  actions: {
    setStep(step: 1 | 2 | 3 | 4) {
      this.step = step
    },

    nextStep() {
      if (this.step < 4) this.step = (this.step + 1) as 1 | 2 | 3 | 4
    },

    prevStep() {
      if (this.step > 1) this.step = (this.step - 1) as 1 | 2 | 3 | 4
    },

    updatePersonalInfo(field: keyof MeasurementPersonalInfo, value: string) {
      this.personalInfo[field] = value
    },

    uploadPhoto(slot: 'front' | 'side', dataUrl: string) {
      const photo = slot === 'front' ? this.frontPhoto : this.sidePhoto
      photo.dataUrl = dataUrl
      photo.state = 'validating'
      photo.attempt += 1

      const attempt = photo.attempt
      const target = slot === 'front' ? this.frontPhoto : this.sidePhoto

      setTimeout(() => {
        if (attempt === 1 && Math.random() > 0.55) {
          const errors: PhotoValidationState[] = ['error_blurry', 'error_no_a4', 'error_body']
          target.state = errors[Math.floor(Math.random() * errors.length)] ?? 'error_blurry'
        } else {
          target.state = 'success'
        }
      }, 1500)
    },

    clearPhoto(slot: 'front' | 'side') {
      const photo = slot === 'front' ? this.frontPhoto : this.sidePhoto
      photo.dataUrl = null
      photo.state = 'idle'
    },

    extractMeasurements() {
      this.isExtracting = true
      const heightNum = parseInt(this.personalInfo.height) || 178

      setTimeout(() => {
        this.data = {
          chest: 98,
          waist: 82,
          hip: 100,
          shoulder: 46,
          sleeve: 62,
          height: heightNum,
          frontPhoto: this.frontPhoto.dataUrl,
          sidePhoto: this.sidePhoto.dataUrl,
          a4Detected: true,
          validated: true,
        }
        this.isExtracting = false
        this.step = 4
      }, 2000)
    },

    updateMeasurement(key: keyof Measurements, value: number | null) {
      this.data[key] = value as never
    },

    confirm() {
      this.confirmed = true
    },

    reset() {
      this.step = 1
      this.personalInfo = { ...defaultPersonalInfo }
      this.frontPhoto = { ...emptyPhoto }
      this.sidePhoto = { ...emptyPhoto }
      this.data = { ...defaultMeasurements }
      this.isExtracting = false
      this.confirmed = false
    },
  },
})
