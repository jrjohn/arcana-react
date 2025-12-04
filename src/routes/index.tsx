import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { MainLayout } from '@presentation/layout/main-layout/MainLayout'
import { LoadingSpinner } from '@shared/components/LoadingSpinner/LoadingSpinner'

// Lazy load feature components
const HomeComponent = lazy(() => import('@presentation/features/home/HomeComponent').then(m => ({ default: m.HomeComponent })))
const UserListComponent = lazy(() => import('@presentation/features/users/user-list/UserListComponent').then(m => ({ default: m.UserListComponent })))
const UserDetailComponent = lazy(() => import('@presentation/features/users/user-detail/UserDetailComponent').then(m => ({ default: m.UserDetailComponent })))
const UserFormComponent = lazy(() => import('@presentation/features/users/user-form/UserFormComponent').then(m => ({ default: m.UserFormComponent })))

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading..." />}>
      {children}
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route
          path="home"
          element={
            <LazyWrapper>
              <HomeComponent />
            </LazyWrapper>
          }
        />
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
        {/* Placeholder routes for other sections */}
        <Route path="projects/*" element={<PlaceholderPage title="Projects" />} />
        <Route path="tasks/*" element={<PlaceholderPage title="Tasks" />} />
        <Route path="calendar" element={<PlaceholderPage title="Calendar" />} />
        <Route path="messages" element={<PlaceholderPage title="Messages" />} />
        <Route path="documents" element={<PlaceholderPage title="Documents" />} />
        <Route path="analytics/*" element={<PlaceholderPage title="Analytics" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}

// Placeholder component for unimplemented routes
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
