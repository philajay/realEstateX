import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_ROLE,
  friendlyAuthError,
  isFirebaseConfigured,
  loadOrCreateUser,
  missingConfigVars,
  observeAuth,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase'

const AuthContext = createContext(null)

const INITIAL = {
  status: isFirebaseConfigured ? 'loading' : 'unconfigured',
  user: null,
  profile: null,
  error: null,
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(INITIAL)

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev))
  }, [])

  // FR-008: auth state drives rendering, no reload involved.
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    let cancelled = false

    return observeAuth(async (user) => {
      if (cancelled) return

      if (!user) {
        setState({ status: 'signed-out', user: null, profile: null, error: null })
        return
      }

      setState((prev) => ({ ...prev, status: 'signed-in', user }))

      try {
        const profile = await loadOrCreateUser(user, DEFAULT_ROLE)
        if (!cancelled) setState({ status: 'signed-in', user, profile, error: null })
      } catch (error) {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          status: 'profile-error',
          profile: null,
          error: friendlyAuthError(error),
        }))
      }
    })
  }, [])

  const signIn = useCallback(async (role) => {
    setState((prev) => ({ ...prev, status: 'authenticating', error: null }))

    let user
    try {
      user = await signInWithGoogle()
    } catch (error) {
      const message = friendlyAuthError(error)
      setState((prev) => ({
        ...prev,
        status: 'signed-out',
        user: null,
        profile: null,
        error: message,
      }))
      return { ok: false, cancelled: !message }
    }

    try {
      const profile = await loadOrCreateUser(user, role)
      setState({ status: 'signed-in', user, profile, error: null })
      return { ok: true }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'profile-error',
        profile: null,
        error: friendlyAuthError(error),
      }))
      return { ok: false }
    }
  }, [])

  const retryProfile = useCallback(async () => {
    if (!state.user) return
    setState((prev) => ({ ...prev, status: 'authenticating', error: null }))
    try {
      const profile = await loadOrCreateUser(state.user, DEFAULT_ROLE)
      setState({ status: 'signed-in', user: state.user, profile, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'profile-error',
        profile: null,
        error: friendlyAuthError(error),
      }))
    }
  }, [state.user])

  const signOut = useCallback(async () => {
    try {
      await signOutUser()
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyAuthError(error) }))
    }
  }, [])

  const value = useMemo(
    () => ({ ...state, signIn, signOut, retryProfile, clearError, missingConfigVars }),
    [state, signIn, signOut, retryProfile, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
