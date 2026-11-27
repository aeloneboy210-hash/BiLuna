import { describe, expect, it } from 'vitest'
import { sureLevel, splitConfidence } from '@/lib/health/sure-meter'
import { DEFAULT_CONFIDENCE } from '@/lib/health/safety-filter'

describe('sureLevel', () => {
  it('reads unsure wording as an early idea', () => {
    expect(sureLevel('I am unsure of the cause, and a clinician must check your abdomen.')).toBe(1)
    expect(sureLevel('I cannot tell which one it is yet.')).toBe(1)
    expect(sureLevel('এখনই নিশ্চিত নই, ডাক্তারকে দেখাতে হবে।')).toBe(1)
  })

  it('reads the default line as an early idea', () => {
    expect(sureLevel(splitConfidence(DEFAULT_CONFIDENCE.en)!.text)).toBe(1)
    expect(sureLevel(splitConfidence(DEFAULT_CONFIDENCE.bn)!.text)).toBe(1)
  })

  it('reads likely wording as getting clearer', () => {
    expect(sureLevel('This is likely a common cold, but a doctor should check your chest.')).toBe(2)
  })

  it('reads fairly sure wording as fairly sure', () => {
    expect(sureLevel('I am fairly sure this value is above the normal range; a doctor must explain what it means.')).toBe(3)
    expect(sureLevel('আমি মোটামুটি নিশ্চিত যে মানটি স্বাভাবিকের বেশি।')).toBe(3)
  })

  it('lets "not sure" win over "sure"', () => {
    expect(sureLevel('I am not fairly sure about this.')).toBe(1)
  })

  it('never reaches the doctor step, which is always 4', () => {
    expect(sureLevel('I am completely and absolutely sure.')).toBeLessThanOrEqual(3)
  })
})

describe('splitConfidence', () => {
  it('finds the language and strips the prefix', () => {
    expect(splitConfidence('How sure I am: i am unsure.')).toEqual({ lang: 'en', text: 'I am unsure.' })
    expect(splitConfidence('আমি কতটা নিশ্চিত: এখনও বলা যায় না।')).toEqual({ lang: 'bn', text: 'এখনও বলা যায় না।' })
  })

  it('returns null for ordinary lines', () => {
    expect(splitConfidence('Please rest.')).toBeNull()
  })
})
