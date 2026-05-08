import { useState } from 'react'
import { INITIAL_FORM_DATA, type FormData } from '../content/form'

export type WizardPhase = 'setup' | 'questions' | 'goal' | 'review' | 'running' | 'followup' | 'done'

export interface FollowUpQuestion {
  question: string
  why_asked?: string
}

interface WizardState {
  step: number          // 0 = setup, 1-5 = Act D questions, 6 = goal, 7 = review
  phase: WizardPhase
  formData: FormData
  sessionId: string | null
  followUpQuestions: FollowUpQuestion[]
  followUpAnswers: string[]
  analysisId: number | null
  error: string | null
}

export function useWizard() {
  const TOTAL_STEPS = 8   // 0-5 = form, 6 = goal, 7 = review

  const [state, setState] = useState<WizardState>({
    step: 0,
    phase: 'setup',
    formData: INITIAL_FORM_DATA,
    sessionId: null,
    followUpQuestions: [],
    followUpAnswers: [],
    analysisId: null,
    error: null,
  })

  const update = (patch: Partial<WizardState>) =>
    setState(s => ({ ...s, ...patch }))

  const setField = (field: keyof FormData, value: string | number) =>
    setState(s => ({ ...s, formData: { ...s.formData, [field]: value } }))

  const next = () => {
    setState(s => {
      const nextStep = Math.min(s.step + 1, TOTAL_STEPS - 1)
      const phase: WizardPhase =
        nextStep === 0 ? 'setup' :
        nextStep <= 5 ? 'questions' :
        nextStep === 6 ? 'goal' : 'review'
      return { ...s, step: nextStep, phase }
    })
  }

  const prev = () => {
    setState(s => {
      const prevStep = Math.max(s.step - 1, 0)
      const phase: WizardPhase =
        prevStep === 0 ? 'setup' :
        prevStep <= 5 ? 'questions' :
        prevStep === 6 ? 'goal' : 'review'
      return { ...s, step: prevStep, phase }
    })
  }

  const setFollowUpAnswer = (index: number, value: string) => {
    setState(s => {
      const answers = [...s.followUpAnswers]
      answers[index] = value
      return { ...s, followUpAnswers: answers }
    })
  }

  return {
    ...state,
    totalSteps: TOTAL_STEPS,
    setField,
    next,
    prev,
    update,
    setFollowUpAnswer,
  }
}
