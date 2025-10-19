"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ChangeEventHandler,
  type FormEventHandler,
  type MutableRefObject,
  type TextareaHTMLAttributes,
} from "react"
import { cn } from "@/lib/utils"

export type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

const SCROLLABLE_OVERFLOW_PATTERN = /(auto|scroll)/i

const getScrollableAncestor = (element: HTMLTextAreaElement | null): HTMLElement | null => {
  if (!element || typeof window === "undefined") {
    return null
  }

  let parent: HTMLElement | null = element.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    if (
      SCROLLABLE_OVERFLOW_PATTERN.test(style.overflowY) ||
      SCROLLABLE_OVERFLOW_PATTERN.test(style.overflow) ||
      SCROLLABLE_OVERFLOW_PATTERN.test(style.overflowX)
    ) {
      return parent
    }
    parent = parent.parentElement
  }

  const ownerDocument = element.ownerDocument
  const scrollingElement = ownerDocument?.scrollingElement
  return scrollingElement instanceof HTMLElement ? scrollingElement : null
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, onInput, onChange, ...rest }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)
    const combinedRef = (instance: HTMLTextAreaElement | null) => {
      innerRef.current = instance
      if (typeof ref === "function") {
        ref(instance)
      } else if (ref) {
        ;(ref as MutableRefObject<HTMLTextAreaElement | null>).current = instance
      }
    }

    const frameRef = useRef<number | null>(null)

    const resizeImmediately = useCallback((textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto"
      const nextHeight = `${textarea.scrollHeight}px`
      textarea.style.height = nextHeight
    }, [])

    const scheduleResize = useCallback(
      (textarea: HTMLTextAreaElement | null) => {
        if (!textarea) return

        const perform = () => {
          resizeImmediately(textarea)
        }

        if (typeof window === "undefined") {
          perform()
          return
        }

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current)
        }

        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null
          perform()
        })
      },
      [resizeImmediately]
    )

    useLayoutEffect(() => {
      scheduleResize(innerRef.current)
    }, [scheduleResize, rest.value, rest.defaultValue])

    useEffect(() => {
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
      }
    }, [])

    const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
      scheduleResize(event.currentTarget)
      onInput?.(event)
    }

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
      onChange?.(event)
    }

    return (
      <textarea
        {...rest}
        ref={combinedRef}
        onInput={handleInput}
        onChange={handleChange}
        className={cn("resize-none overflow-hidden", className)}
      />
    )
  }
)

AutoResizeTextarea.displayName = "AutoResizeTextarea"

export default AutoResizeTextarea
