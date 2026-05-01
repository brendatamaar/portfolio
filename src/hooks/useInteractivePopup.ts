import { useState, useEffect, useCallback, useRef } from 'react'
import { TIMEOUTS } from '../lib/constants.js'

interface UseInteractivePopupOptions<T> {
  contentRef: React.RefObject<HTMLElement | null>
  datasetAttr: string // 'data-gloss-term' or 'data-cite-id'
  findData: (id: string) => T | null
}

interface UseInteractivePopupReturn<T> {
  tooltip: T | null
  popup: T | null
  tooltipPosition: { x: number; y: number; bottom: number } | null
  popupPosition: { x: number; y: number; bottom: number } | null
  clearPopup: () => void
}

export function useInteractivePopup<T>(
  options: UseInteractivePopupOptions<T>,
): UseInteractivePopupReturn<T> {
  const { contentRef, datasetAttr, findData } = options

  const [tooltip, setTooltip] = useState<T | null>(null)
  const [popup, setPopup] = useState<T | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number
    y: number
    bottom: number
  } | null>(null)
  const [popupPosition, setPopupPosition] = useState<{
    x: number
    y: number
    bottom: number
  } | null>(null)

  const hideTimeoutRef = useRef<number | null>(null)
  const popupRef = useRef(popup)

  // Keep ref in sync to avoid dependency issues
  popupRef.current = popup

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const clearPopup = useCallback(() => {
    setPopup(null)
    setPopupPosition(null)
  }, [])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        `[${datasetAttr}]`,
      ) as HTMLElement | null

      clearHideTimeout()

      if (!target) {
        setTooltip(null)
        setTooltipPosition(null)
        return
      }

      // Don't show tooltip if popup is open
      if (popupRef.current) return

      const id = target.getAttribute(datasetAttr)
      if (!id) return

      const data = findData(id)
      if (!data) return

      const rect = target.getBoundingClientRect()
      setTooltip(data)
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
        bottom: rect.bottom,
      })
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const related = e.relatedTarget as HTMLElement | null

      // Check if moving to the popup itself
      const isMovingToPopup = related?.closest('.gloss-popup, .bib-popup')
      const isLeavingTrigger = target.closest(`[${datasetAttr}]`)

      if (isLeavingTrigger && !isMovingToPopup) {
        hideTimeoutRef.current = window.setTimeout(() => {
          setTooltip(null)
          setTooltipPosition(null)
        }, TIMEOUTS.hideDelay)
      }
    }

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        `[${datasetAttr}]`,
      ) as HTMLElement | null

      if (target) {
        e.preventDefault()
        const id = target.getAttribute(datasetAttr)
        if (!id) return

        const data = findData(id)
        if (!data) return

        const rect = target.getBoundingClientRect()
        setPopup(data)
        setPopupPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
          bottom: rect.bottom,
        })
        setTooltip(null)
        setTooltipPosition(null)
        return
      }

      // Click outside closes popup
      const popupElement = (e.target as HTMLElement).closest(
        '.gloss-popup, .bib-popup',
      )
      if (popupRef.current && !popupElement) {
        clearPopup()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popupRef.current) {
        clearPopup()
      }
    }

    const handleScroll = () => {
      if (popupRef.current) {
        clearPopup()
      }
    }

    content.addEventListener('mouseover', handleMouseOver)
    content.addEventListener('mouseout', handleMouseOut)
    content.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearHideTimeout()
      content.removeEventListener('mouseover', handleMouseOver)
      content.removeEventListener('mouseout', handleMouseOut)
      content.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [contentRef, datasetAttr, findData, clearHideTimeout, clearPopup])

  return {
    tooltip,
    popup,
    tooltipPosition,
    popupPosition,
    clearPopup,
  }
}
