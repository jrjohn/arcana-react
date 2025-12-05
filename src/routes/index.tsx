// =============================================================================
// Application Routes
// =============================================================================
// Route configuration using NavGraph for centralized navigation management.
// All route paths are defined in @core/navigation/navGraph.ts
// =============================================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { MainLayout } from '@presentation/layout/main-layout/MainLayout'
import { LoadingSpinner } from '@shared/components/LoadingSpinner/LoadingSpinner'
import { ErrorBoundary } from '@shared/components/ErrorBoundary/ErrorBoundary'
import { Routes as AppRoutes } from '@core/navigation'

// =============================================================================
// Lazy Load Feature Components
// =============================================================================

const HomeComponent = lazy(() =>
  import('@presentation/features/home/HomeComponent').then((m) => ({ default: m.HomeComponent }))
)
const UserListComponent = lazy(() =>
  import('@presentation/features/users/user-list/UserListComponent').then((m) => ({
    default: m.UserListComponent,
  }))
)
const UserDetailComponent = lazy(() =>
  import('@presentation/features/users/user-detail/UserDetailComponent').then((m) => ({
    default: m.UserDetailComponent,
  }))
)
const UserFormComponent = lazy(() =>
  import('@presentation/features/users/user-form/UserFormComponent').then((m) => ({
    default: m.UserFormComponent,
  }))
)

// =============================================================================
// Loading Wrapper with Error Boundary
// =============================================================================

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary level="feature">
      <Suspense fallback={<LoadingSpinner fullPage message="Loading..." />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

// =============================================================================
// Placeholder Component
// =============================================================================

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{title}</h2>
          <p className="text-muted mb-0">This page is under construction</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-tools" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
          <h4 className="mt-3 text-muted">Coming Soon</h4>
          <p className="text-muted">This feature will be available in a future update.</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Application Routes Component
// =============================================================================

export function ApplicationRoutes() {
  return (
    <Routes>
      <Route path={AppRoutes.ROOT} element={<MainLayout />}>
        {/* Index Route - Redirect to Home */}
        <Route index element={<Navigate to={AppRoutes.HOME} replace />} />

        {/* Home */}
        <Route
          path="home"
          element={
            <LazyWrapper>
              <HomeComponent />
            </LazyWrapper>
          }
        />

        {/* Users Feature */}
        <Route path="users">
          <Route
            index
            element={
              <LazyWrapper>
                <UserListComponent />
              </LazyWrapper>
            }
          />
          <Route
            path="new"
            element={
              <LazyWrapper>
                <UserFormComponent />
              </LazyWrapper>
            }
          />
          <Route
            path=":id"
            element={
              <LazyWrapper>
                <UserDetailComponent />
              </LazyWrapper>
            }
          />
          <Route
            path=":id/edit"
            element={
              <LazyWrapper>
                <UserFormComponent />
              </LazyWrapper>
            }
          />
        </Route>

        {/* Projects Feature (Placeholder) */}
        <Route path="projects">
          <Route index element={<PlaceholderPage title="All Projects" />} />
          <Route path="new" element={<PlaceholderPage title="Create Project" />} />
          <Route path="archived" element={<PlaceholderPage title="Archived Projects" />} />
          <Route path=":id" element={<PlaceholderPage title="Project Details" />} />
          <Route path=":id/edit" element={<PlaceholderPage title="Edit Project" />} />
        </Route>

        {/* Tasks Feature (Placeholder) */}
        <Route path="tasks">
          <Route index element={<PlaceholderPage title="My Tasks" />} />
          <Route path="recent" element={<PlaceholderPage title="Recent Tasks" />} />
          <Route path="important" element={<PlaceholderPage title="Important Tasks" />} />
          <Route path=":id" element={<PlaceholderPage title="Task Details" />} />
        </Route>

        {/* Calendar */}
        <Route path="calendar" element={<PlaceholderPage title="Calendar" />} />

        {/* Messages */}
        <Route path="messages">
          <Route index element={<PlaceholderPage title="Messages" />} />
          <Route path=":id" element={<PlaceholderPage title="Message" />} />
        </Route>

        {/* Documents */}
        <Route path="documents">
          <Route index element={<PlaceholderPage title="Documents" />} />
          <Route path=":id" element={<PlaceholderPage title="Document" />} />
        </Route>

        {/* Analytics Feature (Placeholder) */}
        <Route path="analytics">
          <Route index element={<PlaceholderPage title="Analytics Overview" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="performance" element={<PlaceholderPage title="Performance" />} />
        </Route>

        {/* Settings */}
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />

        {/* Profile */}
        <Route path="profile" element={<PlaceholderPage title="Profile" />} />

        {/* Catch-all - Redirect to Home */}
        <Route path="*" element={<Navigate to={AppRoutes.HOME} replace />} />
      </Route>
    </Routes>
  )
}

// Re-export for backwards compatibility
export { ApplicationRoutes as AppRoutes }
