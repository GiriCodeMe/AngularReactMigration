/**
 * AuthContext.tsx
 *
 * Mirrors Angular's UserService state machine:
 *   loading → authenticated    (stored token valid)
 *          → unauthenticated  (no token, or 4xx from /user)
 *          → unavailable      (5xx / network error — keeps token, retries)
 *
 * Exponential backoff retry: 2s → 4s → 8s → 16s (capped), same as Angular.
 *
 * The Axios client fires a 'conduit:logout' CustomEvent on any 401
 * (except /user). AuthProvider listens for it and clears state cleanly.
 */
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { User } from '../types/user'
import { getToken, saveToken, destroyToken } from '../utils/tokenStorage'
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser as apiGetCurrentUser,
  updateUser as apiUpdateUser,
  type LoginCredentials,
  type RegisterCredentials,
  type UpdateUserPayload,
} from '../services/auth.service'

// ─── State ────────────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable'

interface AuthState {
  user: User | null
  status: AuthStatus
}

type AuthAction =
  | { type: 'SET_AUTH'; user: User }
  | { type: 'PURGE_AUTH' }
  | { type: 'SET_UNAVAILABLE' }
  | { type: 'SET_LOADING' }
  | { type: 'UPDATE_USER'; user: User }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTH':
      return { user: action.user, status: 'authenticated' }
    case 'PURGE_AUTH':
      return { user: null, status: 'unauthenticated' }
    case 'SET_UNAVAILABLE':
      return { user: null, status: 'unavailable' }
    case 'SET_LOADING':
      return { ...state, status: 'loading' }
    case 'UPDATE_USER':
      return { user: action.user, status: 'authenticated' }
  }
}

// ─── Context value ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  updateUser: (payload: UpdateUserPayload) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    status: 'loading',
  })

  const retryAttempt = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelRetry() {
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
  }

  function scheduleRetry() {
    cancelRetry()
    if (!getToken()) return
    // Matches Angular UserService: 2s → 4s → 8s → 16s (capped at 16s)
    const delayMs = Math.min(2 * Math.pow(2, retryAttempt.current), 16) * 1000
    retryAttempt.current++
    retryTimer.current = setTimeout(() => loadCurrentUser(true), delayMs)
  }

  async function loadCurrentUser(isRetry = false) {
    if (!getToken()) {
      dispatch({ type: 'PURGE_AUTH' })
      return
    }
    if (isRetry) dispatch({ type: 'SET_LOADING' })

    try {
      const user = await apiGetCurrentUser()
      cancelRetry()
      retryAttempt.current = 0
      saveToken(user.token)
      dispatch({ type: 'SET_AUTH', user })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status ?? 0
      if (status >= 400 && status < 500) {
        // Invalid token (4xx) — clear it and move to unauthenticated
        cancelRetry()
        retryAttempt.current = 0
        destroyToken()
        dispatch({ type: 'PURGE_AUTH' })
      } else {
        // Server error (5xx) or network failure — keep token, retry
        dispatch({ type: 'SET_UNAVAILABLE' })
        scheduleRetry()
      }
    }
  }

  // Restore session from stored token on mount
  useEffect(() => {
    loadCurrentUser()
    return cancelRetry
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Respond to 401s fired by the Axios interceptor (token expired mid-session)
  useEffect(() => {
    const handler = () => {
      cancelRetry()
      retryAttempt.current = 0
      dispatch({ type: 'PURGE_AUTH' })
    }
    window.addEventListener('conduit:logout', handler)
    return () => window.removeEventListener('conduit:logout', handler)
  }, [])

  async function login(credentials: LoginCredentials) {
    const user = await apiLogin(credentials)
    cancelRetry()
    retryAttempt.current = 0
    saveToken(user.token)
    dispatch({ type: 'SET_AUTH', user })
  }

  async function register(credentials: RegisterCredentials) {
    const user = await apiRegister(credentials)
    cancelRetry()
    retryAttempt.current = 0
    saveToken(user.token)
    dispatch({ type: 'SET_AUTH', user })
  }

  function logout() {
    cancelRetry()
    retryAttempt.current = 0
    destroyToken()
    dispatch({ type: 'PURGE_AUTH' })
  }

  async function updateUser(payload: UpdateUserPayload) {
    const user = await apiUpdateUser(payload)
    if (user.token) saveToken(user.token)
    dispatch({ type: 'UPDATE_USER', user })
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        status: state.status,
        isAuthenticated: state.status === 'authenticated',
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
