import { describe, expect, it } from 'vitest'
import { formatTime, hoursLabel, hoursSummary } from './site-helpers'

describe('formatTime', () => {
  it('reads the leads app 24-hour times on a 12-hour clock', () => {
    expect(formatTime('06:00')).toBe('6:00 AM')
    expect(formatTime('20:00')).toBe('8:00 PM')
    expect(formatTime('12:00')).toBe('12:00 PM')
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('24:00')).toBe('12:00 AM')
    expect(formatTime('7:30')).toBe('7:30 AM')
    expect(formatTime('17:45:00')).toBe('5:45 PM')
  })

  it('keeps 12-hour times, tidied to one style', () => {
    expect(formatTime('7:00 AM')).toBe('7:00 AM')
    expect(formatTime('6:00 PM')).toBe('6:00 PM')
    expect(formatTime('7:00 am')).toBe('7:00 AM')
    expect(formatTime('07:00 a.m.')).toBe('7:00 AM')
    expect(formatTime('7pm')).toBe('7:00 PM')
  })

  it('leaves anything else as given', () => {
    expect(formatTime(' By appointment ')).toBe('By appointment')
    expect(formatTime('25:00')).toBe('25:00')
    expect(formatTime('24:30')).toBe('24:30')
  })
})

describe('hoursLabel and hoursSummary', () => {
  it('show 24-hour rows as 12-hour', () => {
    expect(hoursLabel({ day: 'Monday', open: '06:00', close: '20:00' })).toBe('6:00 AM – 8:00 PM')
    expect(hoursLabel({ day: 'Sunday', open: null, close: null })).toBe('Closed')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    expect(hoursSummary(days.map((day) => ({ day, open: '06:00', close: '20:00' })))).toBe('Sun–Sat 6:00 AM – 8:00 PM')
  })

  it('show 12-hour rows unchanged', () => {
    expect(hoursLabel({ day: 'Monday', open: '7:00 AM', close: '6:00 PM' })).toBe('7:00 AM – 6:00 PM')
  })
})
