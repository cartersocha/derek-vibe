"use client"

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type ChangeEventHandler,
  type FormEventHandler,
  type MutableRefObject,
  type TextareaHTMLAttributes,
} from "react"
import { cn } from "@/lib/utils"

export type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

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

    const resize = useCallback((textarea: HTMLTextAreaElement | null) => {
      if (!textarea) return
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }, [])

    useLayoutEffect(() => {
      resize(innerRef.current)
    }, [resize, rest.value, rest.defaultValue])

    const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
      resize(event.currentTarget)
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
        className={cn("resize-none", className)}
      />
    )
  }
)

AutoResizeTextarea.displayName = "AutoResizeTextarea"

export default AutoResizeTextarea
