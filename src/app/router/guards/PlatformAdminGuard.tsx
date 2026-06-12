import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@app/providers/AuthProvider'
import { ENV } from '@shared/config/env'
import { ROUTES } from '@shared/constants/routes'

export function PlatformAdminGuard() {
  const { firebaseUser, isLoading } = useAuthContext()

  if (isLoading) return null

  if (!firebaseUser) {
    return <Navigate to={ROUTES.auth.login} replace />
  }

  if (!ENV.platformAdminUids.includes(firebaseUser.uid)) {
    return <Navigate to={ROUTES.admin.dashboard} replace />
  }

  return <Outlet />
}
