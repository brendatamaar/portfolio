import { useLang } from '../../context/LanguageContext'

export function LanguageSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
      className="border-2 border-black px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'ID' : 'EN'}
    </button>
  )
}
