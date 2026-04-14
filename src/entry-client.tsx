import { RouterClient } from '@tanstack/react-router/ssr/client'
import { hydrateRoot } from 'react-dom/client'
import { createRouter } from './router'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './globals.css'

const router = createRouter()

hydrateRoot(document, <RouterClient router={router} />)
