export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-black dark:border-white pt-6 pb-10">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
          © {new Date().getFullYear()} Brendatama Akbar Ramadan
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
          Jakarta, Indonesia
        </span>
      </div>
    </footer>
  )
}
