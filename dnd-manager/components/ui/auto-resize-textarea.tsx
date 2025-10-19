"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
  type MutableRefObject,
  type TextareaHTMLAttributes,
} from "react"
import { cn } from "@/lib/utils"

export type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxHeight?: number // Maximum height in pixels before switching to scroll mode
}

/**
 * Smart auto-resize that switches to scroll mode after reaching max height
 * This prevents the parent container from jumping around
 */
const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, onInput, onChange, maxHeight = 400, ...rest }, ref) => {
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
    const [isScrollMode, setIsScrollMode] = useState(false)

    const resizeImmediately = useCallback((textarea: HTMLTextAreaElement) => {
      if (isScrollMode) return // Don't resize in scroll mode

      const currentScrollTop = textarea.scrollTop
      
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      
      if (scrollHeight > maxHeight) {
        // Switch to scroll mode
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = "auto"
        setIsScrollMode(true)
        // Restore scroll position
        textarea.scrollTop = currentScrollTop
      } else {
        textarea.style.height = `${scrollHeight}px`
        textarea.style.overflowY = "hidden"
      }
    }, [isScrollMode, maxHeight])

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
        className={cn("resize-none", isScrollMode ? "overflow-y-auto" : "overflow-hidden", className)}
      />
    )
  }
)

AutoResizeTextarea.displayName = "AutoResizeTextarea"

export default AutoResizeTextarea

