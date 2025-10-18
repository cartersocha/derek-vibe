'use client'

import { useEffect, type ReactNode } from 'react'

function capitalizeFirstLetter(value: string): string {
  if (!value) {
    return value
  }

  const firstAlphaIndex = value.search(/[a-zA-Z]/)
  if (firstAlphaIndex === -1) {
    return value
  }

  const firstChar = value.charAt(firstAlphaIndex)
  const uppercased = firstChar.toUpperCase()

  if (firstChar === uppercased) {
    return value
  }

  return `${value.slice(0, firstAlphaIndex)}${uppercased}${value.slice(firstAlphaIndex + 1)}`
}

function setNativeInputValue(element: HTMLInputElement, value: string) {
  const ownDescriptor = Object.getOwnPropertyDescriptor(element, 'value')
  const ownSetter = ownDescriptor?.set
  if (ownSetter) {
    ownSetter.call(element, value)
    return
  }

  const prototypeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  prototypeSetter?.call(element, value)
}

function dispatchReactInputEvent(element: HTMLInputElement) {
  const event = new Event('input', { bubbles: true })
  element.dispatchEvent(event)
}

interface AutoCapitalizeProviderProps {
  children: ReactNode
}

export default function AutoCapitalizeProvider({ children }: AutoCapitalizeProviderProps) {
  useEffect(() => {
    const handleBlur = (event: FocusEvent) => {
      const target = event.target

      if (!(target instanceof HTMLInputElement)) {
        return
      }

      if (target.type !== 'text' || target.readOnly || target.hasAttribute('data-skip-auto-capitalize')) {
        return
      }

      const nextValue = capitalizeFirstLetter(target.value)
      if (nextValue === target.value) {
        return
      }

      setNativeInputValue(target, nextValue)
      dispatchReactInputEvent(target)
    }

    document.addEventListener('blur', handleBlur, true)

    return () => {
      document.removeEventListener('blur', handleBlur, true)
    }
  }, [])

  return children
}
