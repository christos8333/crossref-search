import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '@/components/AppCard.vue'

describe('AppCard', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppCard, { slots: { default: 'hello' } })
    expect(wrapper.text()).toBe('hello')
  })
})
