import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const MusicPage = lazy(() => import('./pages/MusicPage'))
const ReleaseDetailPage = lazy(() => import('./pages/ReleaseDetailPage'))
const UnreleasedPage = lazy(() => import('./pages/UnreleasedPage'))
const VisualArtPage = lazy(() => import('./pages/VisualArtPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

/** Old /photography links (including ?image=…) keep working. */
function LegacyPhotographyRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/visual-art${search}`} replace />
}

function PageFallback() {
  return (
    <p className="label px-4 py-24 sm:px-8" role="status">
      Loading…
    </p>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />
          <Route path="music" element={<MusicPage />} />
          <Route path="music/unreleased" element={<UnreleasedPage />} />
          <Route path="music/:slug" element={<ReleaseDetailPage />} />
          <Route path="visual-art" element={<VisualArtPage />} />
          <Route path="photography" element={<LegacyPhotographyRedirect />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
