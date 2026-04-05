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
import * as authApi from '../api/auth'
import type { LoginCredentials, RegisterCredentials } from '../api/auth'

// ─── State ────────────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable'

interface AuthState {
  user: User | null
  status: AuthStatus
}

// ─── Actions ──────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<Omit<User, 'token'>> & { password?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    status: 'loading',
  })

  const retryAttemptRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelRetry() {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }

  function scheduleRetry() {
    cancelRetry()
    if (!getToken()) return
    // Exponential backoff: 2s → 4s → 8s → 16s (capped), matches Angular UserService
    const delayMs = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16) * 1000
    retryAttemptRef.current++
    retryTimerRef.current = setTimeout(() => loadCurrentUser(true), delayMs)
  }

  async function loadCurrentUser(isRetry = false) {
    if (!getToken()) {
      dispatch({ type: 'PURGE_AUTH' })
      return
    }
    if (isRetry) {
      dispatch({ type: 'SET_LOADING' })
    }
    try {
      const user = await authApi.getCurrentUser()
      cancelRetry()
      retryAttemptRef.current = 0
      saveToken(user.token)
      dispatch({ type: 'SET_AUTH', user })
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } }).response?.status ?? 0
      if (status >= 400 && status < 500) {
        // 4xx — token is invalid, clear everything
        cancelRetry()
        retryAttemptRef.current = 0
        destroyToken()
        dispatch({ type: 'PURGE_AUTH' })
      } else {
        // 5xx or network error — server is down, keep token and retry
        dispatch({ type: 'SET_UNAVAILABLE' })
        scheduleRetry()
      }
    }
  }

  // On mount: try to restore session from stored token
  // On unmount: cancel any pending retry timer
  useEffect(() => {
    loadCurrentUser()
    return cancelRetry
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for 401s fired by the Axios interceptor (token expired mid-session)
  useEffect(() => {
    const handler = () => {
      cancelRetry()
      retryAttemptRef.current = 0
      dispatch({ type: 'PURGE_AUTH' })
    }
    window.addEventListener('conduit:logout', handler)
    return () => window.removeEventListener('conduit:logout', handler)
  }, [])

  async function login(credentials: LoginCredentials) {
    const user = await authApi.login(credentials)
    cancelRetry()
    retryAttemptRef.current = 0
    saveToken(user.token)
    dispatch({ type: 'SET_AUTH', user })
  }

  async function register(credentials: RegisterCredentials) {
    const user = await authApi.register(credentials)
    cancelRetry()
    retryAttemptRef.current = 0
    saveToken(user.token)
    dispatch({ type: 'SET_AUTH', user })
  }

  function logout() {
    cancelRetry()
    retryAttemptRef.current = 0
    destroyToken()
    dispatch({ type: 'PURGE_AUTH' })
  }

  async function updateUser(updates: Partial<Omit<User, 'token'>> & { password?: string }) {
    const user = await authApi.updateUser(updates)
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
