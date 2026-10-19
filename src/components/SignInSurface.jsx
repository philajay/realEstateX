import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ROLE_OPTIONS = [
  {
    value: 'buyer',
    label: 'Buy',
    title: 'I am looking to buy',
    description: 'Browse listings, save searches and enquire about properties.',
  },
  {
    value: 'seller',
    label: 'Sell',
    title: 'I am looking to sell',
    description: 'List your property and manage enquiries from buyers.',
  },
]

export default function SignInSurface({ open, onClose }) {
  const { signIn, status, error, clearError } = useAuth()
  const [role, setRole] = useState(null)
  const dialogRef = useRef(null)
  const firstOptionRef = useRef(null)

  // FR-022: the selection lives for this page load only.
  useEffect(() => {
    if (open) {
      setRole(null)
      clearError()
    }
  }, [open, clearError])

  useEffect(() => {
    if (!open) return undefined
    firstOptionRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const busy = status === 'authenticating'

  function choose(value) {
    setRole(value)
    clearError()
  }

  async function handleSubmit() {
    if (!role || busy) return
    await signIn(role)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        data-testid="sign-in-surface"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="auth-dialog__close" aria-label="Close sign in" onClick={onClose}>
          &times;
        </button>

        <h2 className="auth-dialog__title" id="auth-dialog-title">
          Sign in to EstateX
        </h2>
        <p className="auth-dialog__lede">
          Choose how you use EstateX. You can only pick one for now — it is stored with your account and
          stays the same every time you sign in.
        </p>

        <div className="auth-roles" role="radiogroup" aria-label="I am a">
          {ROLE_OPTIONS.map((option, index) => {
            const selected = role === option.value
            return (
              <button
                key={option.value}
                ref={index === 0 ? firstOptionRef : undefined}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`auth-role ${selected ? 'auth-role--selected' : ''}`}
                data-testid={`role-${option.value}`}
                onClick={() => choose(option.value)}
              >
                <span className="auth-role__label">{option.label}</span>
                <span className="auth-role__title">{option.title}</span>
                <span className="auth-role__description">{option.description}</span>
              </button>
            )
          })}
        </div>

        {error ? (
          <p className="auth-error" role="alert" data-testid="sign-in-error">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn--primary auth-submit"
          data-testid="google-signin"
          disabled={!role || busy}
          onClick={handleSubmit}
        >
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>

        <p className="auth-note">Use a Google account. We never see your password.</p>
      </div>
    </div>
  )
}
