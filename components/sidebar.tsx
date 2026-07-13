'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, LayoutDashboard, Calendar, Tag, Users, Layers, Menu, X, Package } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/importar', label: 'Importar Datos', icon: Upload },
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/por-fecha', label: 'Por Fecha', icon: Calendar },
  { href: '/dashboard/por-marca', label: 'Por Marca', icon: Tag },
  { href: '/dashboard/por-canal', label: 'Por Canal', icon: Users },
  { href: '/dashboard/por-categoria', label: 'Por Categoría', icon: Layers },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 text-white p-2 rounded-lg shadow-lg"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-40 transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
              <Package size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">Análisis</h1>
              <p className="text-xs text-slate-400">Logístico</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems?.map((item: any) => {
            const Icon = item?.icon
            const isActive = pathname === item?.href || (item?.href !== '/importar' && item?.href !== '/dashboard' && pathname?.startsWith?.(item?.href))
            return (
              <Link
                key={item?.href}
                href={item?.href ?? '#'}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                {Icon && <Icon size={18} />}
                <span>{item?.label ?? ''}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-slate-500">
          <p>© 2026 Análisis Logístico</p>
        </div>
      </aside>
    </>
  )
}
