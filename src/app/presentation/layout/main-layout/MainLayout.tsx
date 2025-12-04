import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../header/Header'
import { Sidebar } from '../sidebar/Sidebar'
import { RightPanel } from '../right-panel/RightPanel'
import { APP_CONSTANTS } from '@core/constants/app.constants'
import './MainLayout.scss'

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
  })

  const [rightPanelOpen, setRightPanelOpen] = useState(() => {
    return localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.RIGHT_PANEL_OPEN) === 'true'
  })

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    // On mobile, toggle mobile sidebar
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen(prev => !prev)
    } else {
      // On desktop, toggle collapsed state
      setSidebarCollapsed(prev => {
        const newValue = !prev
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.SIDEBAR_COLLAPSED, String(newValue))
        return newValue
      })
    }
  }, [])

  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen(prev => {
      const newValue = !prev
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.RIGHT_PANEL_OPEN, String(newValue))
      return newValue
    })
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [])

  return (
    <div className="main-layout">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={closeMobileSidebar} />
      )}

      {/* Header */}
      <Header
        onToggleSidebar={toggleSidebar}
        onToggleRightPanel={toggleRightPanel}
        rightPanelOpen={rightPanelOpen}
      />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Content */}
      <main
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${rightPanelOpen ? 'right-panel-open' : ''}`}
      >
        <Outlet />
      </main>

      {/* Right Panel */}
      <RightPanel
        isOpen={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
      />
    </div>
  )
}
