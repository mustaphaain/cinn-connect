import { Link } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { useEffect, useRef, type CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export type PillNavItem = {
  label: string
  href: string
  ariaLabel?: string
}

type PillNavTheme = 'color' | 'mono'

export interface PillNavProps {
  /** Si absent, aucun logo n’est affiché (seulement les pills). */
  logo?: string
  logoAlt?: string
  items: PillNavItem[]
  activeHref?: string
  className?: string
  ease?: string
  /** Surcharges optionnelles (sinon couleurs dérivées du thème clair/sombre). */
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  theme?: PillNavTheme
  initialLoadAnimation?: boolean
}

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power2.out',
  baseColor: baseColorOverride,
  pillColor: pillColorOverride,
  hoveredPillTextColor: hoveredPillTextColorOverride,
  pillTextColor: pillTextColorOverride,
  theme: themeVariant = 'color',
  initialLoadAnimation = false,
}: PillNavProps) {
  const { theme: appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Calcul des couleurs (plus linéaire / plus facile à lire)
  let colors: {
    navBg: string
    pillBg: string
    pillText: string
    hoverText: string
    bubble: string
    activeBg: string
  }

  if (themeVariant === 'mono') {
    if (isDark) {
      colors = {
        navBg: '#3f3f46',
        pillBg: '#52525b',
        pillText: '#fafafa',
        hoverText: '#fafafa',
        bubble: '#71717a',
        activeBg: '#71717a',
      }
    } else {
      colors = {
        navBg: '#3f3f46',
        pillBg: '#f4f4f5',
        pillText: '#18181b',
        hoverText: '#fafafa',
        bubble: '#52525b',
        activeBg: '#52525b',
      }
    }
  } else if (isDark) {
    colors = {
      navBg: '#121214',
      pillBg: '#27272a',
      pillText: '#f4f4f5',
      hoverText: '#ffffff',
      bubble: '#52525b',
      activeBg: '#4f46e5',
    }
  } else {
    colors = {
      navBg: '#f4f4f5',
      pillBg: '#ffffff',
      pillText: '#111827',
      hoverText: '#ffffff',
      bubble: '#52525b',
      activeBg: '#4f46e5',
    }
  }

  // Le fond du "rail" peut être désactivé (transparent) par défaut.
  // Si `baseColor` est fourni, on l'utilise comme couleur de fond.
  const navBg = baseColorOverride ?? 'transparent'
  const pillBg = pillColorOverride ?? colors.pillBg
  const pillText = pillTextColorOverride ?? colors.pillText
  const hoverText = hoveredPillTextColorOverride ?? colors.hoverText
  const bubbleFill = colors.bubble
  const activeBg = colors.activeBg

  const logoBg =
    themeVariant === 'color'
      ? 'linear-gradient(135deg,#4f46e5,#d946ef)'
      : isDark
        ? '#27272a'
        : '#52525b'

  useEffect(() => {
    if (!rootRef.current) return
    const buttons = Array.from(rootRef.current.querySelectorAll<HTMLElement>('[data-pill]'))
    const enterHandlers: Array<() => void> = []
    const leaveHandlers: Array<() => void> = []

    for (const btn of buttons) {
      const bubble = btn.querySelector<HTMLElement>('[data-bubble]')
      if (!bubble) continue
      gsap.set(bubble, { scale: 0, transformOrigin: '50% 50%' })
      const onEnter = () =>
        gsap.to(bubble, {
          scale: 1,
          duration: 0.28,
          ease,
          overwrite: 'auto',
        })
      const onLeave = () =>
        gsap.to(bubble, {
          scale: 0,
          duration: 0.22,
          ease,
          overwrite: 'auto',
        })
      btn.addEventListener('mouseenter', onEnter)
      btn.addEventListener('mouseleave', onLeave)
      enterHandlers.push(() => btn.removeEventListener('mouseenter', onEnter))
      leaveHandlers.push(() => btn.removeEventListener('mouseleave', onLeave))
    }

    if (initialLoadAnimation) {
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4, ease, overwrite: 'auto' }
      )
    }

    return () => {
      enterHandlers.forEach((fn) => fn())
      leaveHandlers.forEach((fn) => fn())
    }
  }, [items, ease, initialLoadAnimation, isDark, themeVariant])

  return (
    <div ref={rootRef} className={className}>
      <div
        className="inline-flex h-11 items-center gap-1 rounded-full p-1"
        style={{ background: navBg }}
        aria-label="Navigation principale"
      >
        {logo ? (
          <Link
            to="/"
            aria-label={logoAlt}
            className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
            style={{ background: logoBg }}
          >
            <img src={logo} alt={logoAlt} className="h-5 w-5 object-contain" />
          </Link>
        ) : null}

        {items.map((item) => {
          const isActive =
            activeHref === item.href ||
            (item.href !== '/' && activeHref?.startsWith(item.href + '/'))

          const labelStyle = {
            ['--pill-hover']: hoverText,
            color: isActive ? '#fff' : undefined,
          } as CSSProperties

          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label={item.ariaLabel ?? item.label}
              data-pill
              className={`group relative inline-flex h-9 items-center overflow-hidden rounded-full px-4 text-sm font-semibold transition ${
                isActive ? 'text-white' : ''
              }`}
              style={{
                background: isActive ? activeBg : pillBg,
                color: isActive ? '#fff' : pillText,
              }}
            >
              <span
                data-bubble
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: bubbleFill }}
                aria-hidden
              />
              <span className="relative z-10 transition-[color] duration-200 group-hover:text-[var(--pill-hover)]" style={labelStyle}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
