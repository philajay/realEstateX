import { useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  ENQUIRY_FIELD_LABELS,
  ENQUIRY_LIMITS,
  EMPTY_ENQUIRY,
  friendlyContactError,
  submitEnquiry,
  validateEnquiry,
} from '../lib/contact'

function Field({ name, error, children }) {
  return (
    <div className={`cform__field ${error ? 'cform__field--invalid' : ''}`}>
      <label className="cform__label" htmlFor={`contact-${name}`}>
        {ENQUIRY_FIELD_LABELS[name]}
      </label>
      {children}
      {error ? (
        <p className="cform__error" id={`contact-${name}-error`} role="alert" data-testid={`error-${name}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

const WRITE_TIMEOUT_MS = 15000

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY_ENQUIRY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    // FR-015: a second click while the write is in flight must not slip through.
    if (submitting) return

    setFormError(null)

    const found = validateEnquiry(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Fix the highlighted fields and try again. Nothing was sent.')
      return
    }

    setSubmitting(true)

    // Firestore queues writes while offline, so a send made with no connection
    // never settles — the visitor would sit on a spinner forever.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSubmitting(false)
      setFormError('You appear to be offline, so your message was not sent. Reconnect and try again.')
      return
    }

    // BR-012: the SDK also retries a rejected write indefinitely, so a write
    // that never settles must not hold the button down forever. Neither
    // success nor failure is claimed on timeout — the message may still land.
    const write = submitEnquiry(values)
      .then(() => 'sent')
      .catch((error) => ({ message: friendlyContactError(error) }))

    let timer
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve('slow'), WRITE_TIMEOUT_MS)
    })

    // A write that lands after the timeout still earns the confirmation.
    write.then((result) => {
      if (result === 'sent') setSent(true)
    })

    const outcome = await Promise.race([write, timeout])
    clearTimeout(timer)
    setSubmitting(false)

    // FR-016: everything the visitor typed stays in the form either way.
    if (outcome === 'slow') {
      setFormError(
        'This is taking longer than expected. Your message may still be on its way — please do not send it again just yet.'
      )
      return
    }

    if (outcome !== 'sent') setFormError(outcome.message)
  }

  // NFR-008: say so plainly rather than offering a form that cannot work.
  if (!isFirebaseConfigured) {
    return (
      <section className="shell shell--narrow contact" data-testid="contact-surface">
        <div className="empty" role="status">
          <p className="empty__title">The contact form is unavailable</p>
          <p className="empty__text">Firebase is not configured for this app.</p>
        </div>
      </section>
    )
  }

  if (sent) {
    return (
      <section className="shell shell--narrow contact" data-testid="contact-surface">
        <h1 className="contact__heading">Message sent</h1>
        <div className="empty" role="status" data-testid="contact-sent">
          <p className="empty__title">Thanks — we have your message</p>
          <p className="empty__text">
            It has been recorded along with the email address you gave us, so we have everything we need to follow
            up if we need to.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="shell shell--narrow contact" data-testid="contact-surface">
      <header className="contact__head">
        <p className="eyebrow">Contact</p>
        <h1 className="contact__heading">Get in touch</h1>
        <p className="contact__sub">
          Buying, selling, or just asking something — send us a message and we will get back to you by email.
        </p>
      </header>

      <form className="cform" onSubmit={handleSubmit} noValidate data-testid="contact-form">
        {formError ? (
          <p className="cform__banner" role="alert" data-testid="contact-form-error">
            {formError}
          </p>
        ) : null}

        <Field name="name" error={errors.name}>
          <input
            id="contact-name"
            type="text"
            value={values.name}
            data-testid="field-name"
            autoComplete="name"
            maxLength={ENQUIRY_LIMITS.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            onChange={(event) => setField('name', event.target.value)}
          />
        </Field>

        <Field name="email" error={errors.email}>
          <input
            id="contact-email"
            type="email"
            value={values.email}
            data-testid="field-email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            onChange={(event) => setField('email', event.target.value)}
          />
        </Field>

        <Field name="message" error={errors.message}>
          <textarea
            id="contact-message"
            rows={6}
            value={values.message}
            data-testid="field-message"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            onChange={(event) => setField('message', event.target.value)}
          />
        </Field>

        <p className="cform__consent">
          We use these details only to respond to your enquiry. Message is limited to{' '}
          {ENQUIRY_LIMITS.message} characters.
        </p>

        <div className="cform__actions">
          <button className="btn btn--primary" type="submit" disabled={submitting} data-testid="contact-submit">
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>
    </section>
  )
}