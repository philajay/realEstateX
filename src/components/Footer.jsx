import { useState } from 'react'
import { CONTACT, FOOTER_COLUMNS, SOCIAL_LINKS } from '../data/navigation'
import Logo from './Logo'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <footer className="footer" id="contact">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo variant="footer" />
          <p className="footer__desc">
            We help people find homes they genuinely want to live in — from city studios to
            family houses and everything between.
          </p>
          <address className="footer__contact">
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
            <span>{CONTACT.address}</span>
          </address>
        </div>

        <div className="footer__columns">
          {FOOTER_COLUMNS.map((column) => (
            <nav className="footer__col" key={column.title} aria-label={column.title}>
              <h2 className="footer__col-title">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="footer__newsletter">
        <div>
          <h2 className="footer__nl-title">Get new listings first</h2>
          <p className="footer__nl-text">
            One email a week. Only the properties that actually match what you saved.
          </p>
        </div>
        <form className="footer__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setSubmitted(false)
            }}
          />
          <button className="btn btn--primary" type="submit">
            Subscribe
          </button>
          {submitted && (
            <p className="footer__nl-status" role="status">
              Thanks — you&apos;re on the list.
            </p>
          )}
        </form>
      </div>

      <div className="footer__bar">
        <p>&copy; {new Date().getFullYear()} EstateX. All rights reserved.</p>
        <ul className="footer__social">
          {SOCIAL_LINKS.map((network) => (
            <li key={network}>
              <a href="#" aria-label={network}>
                {network.slice(0, 1)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}