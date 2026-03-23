import { NavLink } from 'react-router-dom'
import { Home, Receipt, PlusCircle, FolderOpen } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Hem', end: true },
  { to: '/kvitton', icon: Receipt, label: 'Kvitton', end: false },
  { to: '/lagg-till', icon: PlusCircle, label: 'Lägg till', end: false },
  { to: '/omraden', icon: FolderOpen, label: 'Områden', end: false },
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="max-w-lg mx-auto flex">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 pt-3 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-6 h-6 mb-1 ${
                    to === '/lagg-till' && !isActive ? 'text-blue-400' : ''
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
