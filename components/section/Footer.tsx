'use client'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-dashed border-zinc-200 py-6 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-geist-mono)] text-xs text-zinc-400 dark:text-zinc-600">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
