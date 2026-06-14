import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@app/providers/AuthProvider'
import { isPlatformAdminUser } from '@shared/config/platformAdmin'
import { ROUTES } from '@shared/constants/routes'

export function PlatformAdminGuard() {
  const { firebaseUser, isLoading } = useAuthContext()

  if (isLoading) return null

  if (!firebaseUser) {
    return <Navigate to={ROUTES.auth.login} replace />
  }

  if (!isPlatformAdminUser({ uid: firebaseUser.uid, email: firebaseUser.email })) {
    return <Navigate to={ROUTES.admin.dashboard} replace />
  }

  return <Outlet />
}
