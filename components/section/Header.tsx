'use client'
import * as React from 'react'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Magnetic } from '@/components/ui/magnetic'

interface NavLinkProps {
  href: string
  label: string
}

function NavLink({ href, label }: NavLinkProps) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.2}>
      <Link href={href} className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 capitalize">
        {label}
      </Link>
    </Magnetic>
  )
}

export default function Header() {
  const { theme, setTheme } = useTheme()
  const menuItems = [
    { key: 'home', href: '/' },
    { key: 'blog', href: '/blog' },
  ]

  const toggleTheme = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(theme === 'light' ? 'dark' : 'light')
      })
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <header className="relative z-50 mb-16 leading-none">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center">
        </div>
        <nav className="relative flex items-center gap-6 rounded-full bg-zinc-50/50 px-4 py-2 ring-1 ring-zinc-200/50 backdrop-blur-md dark:bg-zinc-900/50 dark:ring-zinc-800/50">
          {menuItems.map(({ key, href }) => (
            <NavLink key={key} href={href} label={key} />
          ))}
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <Magnetic springOptions={{ bounce: 0 }} intensity={0.2}>
            <button 
              onClick={toggleTheme}
              className="group flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <SunIcon className="h-4 w-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle Theme</span>
            </button>
          </Magnetic>
        </nav>
      </div>
    </header>
  )
}
