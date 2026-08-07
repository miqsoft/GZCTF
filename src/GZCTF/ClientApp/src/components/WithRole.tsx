import { Center, Loader } from '@mantine/core'
import React, { FC, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useUserRole } from '@Hooks/useUser'
import { Role } from '@Api'

interface WithRoleProps {
  requiredRole: Role
  /**
   * When true, also allow through users granted self-service game management
   * (UserInfo.CanManageGames), even if their global role is below requiredRole.
   * Use only on pages that are themselves scoped to a manager's own games.
   */
  allowManager?: boolean
  children?: React.ReactNode
}

export const RoleMap = new Map<Role, number>([
  [Role.Admin, 3],
  [Role.Monitor, 1],
  [Role.User, 0],
  [Role.Banned, -1],
])

export const RequireRole = (requiredRole: Role, role?: Role | null) =>
  RoleMap.get(role ?? Role.User)! >= RoleMap.get(requiredRole)!

export const WithRole: FC<WithRoleProps> = ({ requiredRole, allowManager, children }) => {
  const { role, canManageGames, error } = useUserRole()
  const navigate = useNavigate()
  const location = useLocation()

  const required = RoleMap.get(requiredRole)!
  const isAllowed = (currentRole: Role) => RoleMap.get(currentRole)! >= required || (allowManager && canManageGames)

  useEffect(() => {
    if (error && error.status === 401) {
      navigate(`/account/login?from=${location.pathname}`, { replace: true })
    }

    if (!role) return

    if (!isAllowed(role)) navigate('/404')
  }, [role, canManageGames, error, required, navigate])

  if (role && !isAllowed(role) /* show loader before redirect */) {
    return (
      <Center h="calc(100vh - 32px)">
        <Loader />
      </Center>
    )
  }

  return <>{children}</>
}
