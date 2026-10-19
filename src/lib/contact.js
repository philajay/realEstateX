import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getFirebaseDb } from './firebase'

export const ENQUIRIES_COLLECTION = 'contactEnquiries'
export const ENQUIRY_STATUS_NEW = 'new'

export const ENQUIRY_LIMITS = {
  name: 100,
  email: 254,
  message: 2000,
}

export const ENQUIRY_TEXT_FIELDS = ['name', 'email', 'message']

export const ENQUIRY_FIELD_LABELS = {
  name: 'Name',
  email: 'Email address',
  message: 'Message',
}

export const EMPTY_ENQUIRY = {
  name: '',
  email: '',
  message: '',
}

// BR-002. Deliberately permissive: one @, a dotted domain, no leading or
// trailing dot in the domain, no whitespace. Plus-addressing and sub-domains
// pass — they are legal addresses and rejecting them loses real enquiries.
const EMAIL_PATTERN =
  /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

/**
 * BR-001 / BR-002. Returns a map of field -> message. An empty object means the
 * enquiry may be sent. Blank and whitespace-only values fail here rather than
 * reaching Firestore, and an over-long value is refused rather than truncated.
 */
export function validateEnquiry(values) {
  const errors = {}

  for (const field of ENQUIRY_TEXT_FIELDS) {
    const raw = String(values[field] ?? '').trim()
    const label = ENQUIRY_FIELD_LABELS[field]

    if (raw === '') {
      errors[field] = `${label} is required.`
      continue
    }

    if (raw.length > ENQUIRY_LIMITS[field]) {
      errors[field] = `${label} must be ${ENQUIRY_LIMITS[field]} characters or fewer.`
      continue
    }

    if (field === 'email' && !EMAIL_PATTERN.test(raw)) {
      errors[field] = `${label} is not a valid email address.`
    }
  }

  return errors
}

/**
 * FR-010 / FR-012 / FR-014. BR-004: nothing identifying the sender is written,
 * so a signed-in visitor's enquiry is indistinguishable from an anonymous one.
 * BR-005: stored strings are the submitted values, trimmed.
 */
export async function submitEnquiry(values) {
  const db = getFirebaseDb()
  if (!db) throw new Error('The contact form is not configured.')

  const ref = await addDoc(collection(db, ENQUIRIES_COLLECTION), {
    name: String(values.name).trim(),
    email: String(values.email).trim(),
    message: String(values.message).trim(),
    // BR-011: captured at write time so the later admin surface can triage.
    status: ENQUIRY_STATUS_NEW,
    submittedAt: serverTimestamp(),
  })

  return ref.id
}

export function friendlyContactError(error) {
  const code = error?.code ?? ''
  switch (code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Your message was not sent. Please try again in a moment.'
    case 'unavailable':
      return 'We could not reach the server just now. Please try again.'
    case 'invalid-api-key':
      return 'The contact form is not configured correctly for this app.'
    default:
      return error?.message || 'Something went wrong while sending your message.'
  }
}