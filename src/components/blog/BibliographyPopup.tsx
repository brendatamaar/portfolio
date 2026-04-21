import { useCallback } from 'react'
import type { BibliographyEntry } from '../../../shared/markdown/types.js'
import { useInteractivePopup } from '../../hooks/useInteractivePopup.js'
import { formatBibliographyText } from '../../lib/utils/bibliography.js'
import { POPUP_DIMENSIONS } from '../../lib/constants.js'

interface BibliographyPopupProps {
  bibliography: BibliographyEntry[]
  contentRef: React.RefObject<HTMLDivElement | null>
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  web: { label: 'Web', icon: '🌐' },
  docs: { label: 'Docs', icon: '📖' },
  journal: { label: 'Journal', icon: '📄' },
  article: { label: 'Article', icon: '📰' },
  book: { label: 'Book', icon: '📚' },
  video: { label: 'Video', icon: '🎬' },
  podcast: { label: 'Podcast', icon: '🎙' },
  repo: { label: 'Repository', icon: '💾' },
  other: { label: 'Other', icon: '·' },
}

export default function BibliographyPopup({
  bibliography,
  contentRef,
}: BibliographyPopupProps) {
  const findData = useCallback(
    (key: string): BibliographyEntry | null => {
      return bibliography.find((b) => b.key === key) ?? null
    },
    [bibliography],
  )

  const { tooltip, popup, tooltipPosition, popupPosition, clearPopup } =
    useInteractivePopup({
      contentRef,
      datasetAttr: 'data-cite-id',
      findData,
    })

  // Position popup above the reference
  const getPopupStyle = (x: number, y: number): React.CSSProperties => {
    const { estimatedHeight, estimatedWidth, margin } =
      POPUP_DIMENSIONS.bibliography

    let left = x - estimatedWidth / 2

    // Keep within viewport horizontally
    if (left < 8) left = 8
    if (left + estimatedWidth > window.innerWidth - 8) {
      left = window.innerWidth - estimatedWidth - 8
    }

    // Position above the reference
    const top = y - estimatedHeight - margin

    return {
      position: 'fixed',
      left,
      top: Math.max(8, top),
      zIndex: 50,
    }
  }

  const renderContent = (entry: BibliographyEntry) => {
    const cfg = SOURCE_TYPE_CONFIG[entry.sourceType] ?? SOURCE_TYPE_CONFIG.other
    return (
      <>
        <div className="bib-popup-source">
          <span className="bib-popup-icon">{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
        <div
          dangerouslySetInnerHTML={{
            __html: formatBibliographyText(entry.text),
          }}
        />
      </>
    )
  }

  return (
    <>
      {/* Tooltip (hover) - pointer-events-none so it doesn't block mouse */}
      {tooltip && tooltipPosition && (
        <div
          className="bib-popup"
          style={{
            ...getPopupStyle(tooltipPosition.x, tooltipPosition.y),
            pointerEvents: 'none',
          }}
        >
          {renderContent(tooltip)}
        </div>
      )}

      {/* Popup (click) - interactive */}
      {popup && popupPosition && (
        <div
          className="bib-popup"
          style={getPopupStyle(popupPosition.x, popupPosition.y)}
        >
          <button
            className="bib-popup-close"
            onClick={clearPopup}
            aria-label="Close popup"
          >
            ×
          </button>
          {renderContent(popup)}
        </div>
      )}
    </>
  )
}
