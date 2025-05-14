'use client'
import * as React from 'react'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import Link from 'next/link'

// Types
interface NavLinkProps {
  href: string
  label: string
}

// Subcomponents
function NavLink({ href, label }: NavLinkProps) {
  return (
    <Link href={href} className="text-sm hover:underline">
      {label}
    </Link>
  )
}

// Exported Component
export default function Header() {
  const { theme, setTheme } = useTheme()
  const menuItems = [
    { key: 'home', href: '/' },
    { key: 'project', href: '/project' },
    { key: 'blog', href: '/blog' },
  ]

  const toggleTheme = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(theme === 'light' ? 'dark' : 'light')
      })
    } else {
      // Fallback for browsers that don't support View Transitions
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <header className="relative z-50 leading-none font-medium tracking-[-0.41px] mb-10">
      <div className="relative z-10">
        <nav className="relative flex items-center justify-end gap-8">
          {menuItems.map(({ key, href }) => (
            <NavLink key={key} href={href} label={key} />
          ))}
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            <SunIcon className="h-[1rem] w-[1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute h-[1rem] w-[1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">{'toggleTheme'}</span>
          </Button>
          {/* <LocaleSwitcher /> */}
        </nav>
      </div>
    </header>
  )
}
