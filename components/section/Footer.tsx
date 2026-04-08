export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-black pt-6 pb-10 dark:border-white">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-black/60 uppercase dark:text-white/60">
          © {new Date().getFullYear()} Brendatama Akbar Ramadan
        </span>
        <span className="font-mono text-[11px] tracking-widest text-black/60 uppercase dark:text-white/60">
          Jakarta, Indonesia
        </span>
      </div>
    </footer>
  )
}
