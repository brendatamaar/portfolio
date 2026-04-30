import { useCallback } from 'react'
import type { GlossaryEntry } from '../../../shared/markdown/types.js'
import { useInteractivePopup } from '../../hooks/useInteractivePopup.js'
import { POPUP_DIMENSIONS } from '../../lib/constants.js'

interface GlossaryPopupProps {
  glossary: GlossaryEntry[]
  contentRef: React.RefObject<HTMLDivElement | null>
}

export default function GlossaryPopup({
  glossary,
  contentRef,
}: GlossaryPopupProps) {
  const findData = useCallback(
    (key: string): GlossaryEntry | null => {
      return glossary.find((g) => g.key === key) ?? null
    },
    [glossary],
  )

  const { tooltip, popup, tooltipPosition, popupPosition, clearPopup } =
    useInteractivePopup({
      contentRef,
      datasetAttr: 'data-gloss-key',
      findData,
    })

  // Position popup above the reference without guessing its rendered height.
  const getPopupStyle = (x: number, y: number): React.CSSProperties => {
    const { estimatedWidth, margin } = POPUP_DIMENSIONS.glossary

    let left = x - estimatedWidth / 2

    // Keep within viewport horizontally
    if (left < 8) left = 8
    if (left + estimatedWidth > window.innerWidth - 8) {
      left = window.innerWidth - estimatedWidth - 8
    }

    return {
      position: 'fixed',
      left,
      bottom: window.innerHeight - y + margin,
      zIndex: 50,
    }
  }

  return (
    <>
      {/* Tooltip (hover) - pointer-events-none so it doesn't block mouse */}
      {tooltip && tooltipPosition && (
        <div
          className="gloss-popup"
          style={{
            ...getPopupStyle(tooltipPosition.x, tooltipPosition.y),
            pointerEvents: 'none',
          }}
        >
          <div className="gloss-popup-term">{tooltip.term}</div>
          <div dangerouslySetInnerHTML={{ __html: tooltip.definition }} />
        </div>
      )}

      {/* Popup (click) - interactive */}
      {popup && popupPosition && (
        <div
          className="gloss-popup"
          style={getPopupStyle(popupPosition.x, popupPosition.y)}
        >
          <div className="gloss-popup-header">
            <div className="gloss-popup-term">{popup.term}</div>
            <button
              className="gloss-popup-close"
              onClick={clearPopup}
              aria-label="Close popup"
            >
              ×
            </button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: popup.definition }} />
        </div>
      )}
    </>
  )
}
