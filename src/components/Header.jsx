import { useEffect, useState } from 'react'
import { NAV_LINKS } from '../data/navigation'
import Logo from './Logo'
import SignInSurface from './SignInSurface'
import { useAuth } from '../context/AuthContext'

function UserMenu({ profile, user, onSignOut }) {
  const name = profile?.displayName || user?.displayName || profile?.email || user?.email || ''
  const photo = profile?.photoURL || user?.photoURL || ''
  const role = profile?.role

  return (
    <div className="usermenu" data-testid="user-menu">
      {photo ? (
        <img className="usermenu__avatar" src={photo} alt="" data-testid="user-avatar" />
      ) : (
        <span className="usermenu__avatar usermenu__avatar--fallback" aria-hidden="true">
          {name ? name.charAt(0).toUpperCase() : '?'}
        </span>
      )}

      <span className="usermenu__name" data-testid="user-name">
        {name}
      </span>

      {role ? (
        <span className="usermenu__badge" data-testid="user-role">
          {role === 'buyer' ? 'Buyer' : 'Seller'}
        </span>
      ) : null}

      <button type="button" className="btn btn--ghost usermenu__out" data-testid="sign-out" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [surfaceOpen, setSurfaceOpen] = useState(false)
  const { status, user, profile, error, signOut, retryProfile, missingConfigVars } = useAuth()

  const signedIn = status === 'signed-in' || status === 'profile-error'

  // Signing in must dismiss the surface it was launched from.
  useEffect(() => {
    if (signedIn) setSurfaceOpen(false)
  }, [signedIn])

  return (
    <header className="header">
      <div className="header__inner">
        <Logo />

        <nav id="primary-nav" className={`nav ${open ? 'nav--open' : ''}`} aria-label="Primary">
          <ul className="nav__list">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a className="nav__link" href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          {signedIn ? (
            <UserMenu profile={profile} user={user} onSignOut={signOut} />
          ) : (
            <>
              <button
                type="button"
                className="btn btn--ghost"
                data-testid="sign-in-open"
                onClick={() => setSurfaceOpen(true)}
              >
                Sign in
              </button>
              <a className="btn btn--primary" href="/register">
                Register
              </a>
            </>
          )}

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className={`burger ${open ? 'burger--open' : ''}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {status === 'unconfigured' ? (
        <p className="auth-config-error" role="alert" data-testid="config-error">
          Firebase is not configured. Missing: {missingConfigVars.join(', ')}. Copy .env.example to .env.local
          and fill in the values.
        </p>
      ) : null}

      {status === 'profile-error' ? (
        <p className="auth-config-error" role="alert" data-testid="profile-error">
          {error} You are signed in, but we could not load your profile.{' '}
          <button type="button" className="btn btn--ghost auth-retry" data-testid="profile-retry" onClick={retryProfile}>
            Retry
          </button>
        </p>
      ) : null}

      <SignInSurface open={surfaceOpen} onClose={() => setSurfaceOpen(false)} />
    </header>
  )
}
