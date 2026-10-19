import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { getFirebaseDb, getFirebaseStorage } from './firebase'
import { FALLBACK_IMAGE } from './placeholder'

export const LISTINGS_COLLECTION = 'listings'
export const LISTING_IMAGES_FOLDER = 'listing-images'
export const LISTING_STATUSES = ['active', 'inactive']

// Placeholder vocabularies — the allowed values are not confirmed yet (Q-005).
export const PROPERTY_TYPES = ['Apartment', 'Villa', 'House', 'Commercial', 'Plot']
export const AREA_UNITS = ['sq ft', 'sq m', 'sq yd']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']

export const LISTING_TEXT_FIELDS = ['title', 'description', 'propertyType', 'city', 'address']

export const LISTING_NUMBER_FIELDS = [
  { name: 'price', whole: false, label: 'Price' },
  { name: 'bedrooms', whole: true, label: 'Bedrooms' },
  { name: 'bathrooms', whole: true, label: 'Bathrooms' },
  { name: 'area', whole: false, label: 'Area' },
]

export const LISTING_FIELDS = [...LISTING_TEXT_FIELDS, ...LISTING_NUMBER_FIELDS.map((f) => f.name)]

export const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  propertyType: 'Property type',
  city: 'City or locality',
  address: 'Address',
  price: 'Price',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  area: 'Area',
}

export const EMPTY_LISTING = {
  title: '',
  description: '',
  propertyType: PROPERTY_TYPES[0],
  city: '',
  address: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  areaUnit: AREA_UNITS[0],
  status: 'active',
}

/**
 * BR-001 / BR-002. Returns a map of field -> message. An empty object means the
 * listing may be saved. Everything is read off the raw form strings so that a
 * blank, a NaN and a negative all fail here rather than reaching Firestore.
 */
export function validateListing(values) {
  const errors = {}

  for (const field of LISTING_TEXT_FIELDS) {
    if (String(values[field] ?? '').trim() === '') {
      errors[field] = `${FIELD_LABELS[field]} is required.`
    }
  }

  for (const { name, whole, label } of LISTING_NUMBER_FIELDS) {
    const raw = String(values[name] ?? '').trim()

    if (raw === '') {
      errors[name] = `${label} is required.`
      continue
    }

    const parsed = Number(raw)

    if (!Number.isFinite(parsed)) {
      errors[name] = `${label} must be a number.`
      continue
    }

    if (parsed < 0) {
      errors[name] = `${label} cannot be negative.`
      continue
    }

    if (whole && !Number.isInteger(parsed)) {
      errors[name] = `${label} must be a whole number.`
    }
  }

  if (!LISTING_STATUSES.includes(values.status)) {
    errors.status = 'Status must be Active or Inactive.'
  }

  return errors
}

/** FR-010: numbers go to Firestore as numbers, never as the raw form strings. */
function toDocument(values, imagePath) {
  return {
    title: String(values.title).trim(),
    description: String(values.description).trim(),
    propertyType: String(values.propertyType).trim(),
    city: String(values.city).trim(),
    address: String(values.address).trim(),
    price: Number(values.price),
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    area: Number(values.area),
    areaUnit: values.areaUnit || AREA_UNITS[0],
    status: LISTING_STATUSES.includes(values.status) ? values.status : 'active',
    // Only the Storage path is persisted — the download URL is minted on read.
    imagePath: imagePath ?? '',
  }
}

/**
 * Uploads one image under the seller's own folder and returns the Storage path
 * to store on the listing document. The path is scoped to the UID so one
 * seller cannot overwrite another's image.
 */
export async function uploadListingImage(uid, file) {
  const storage = getFirebaseStorage()
  if (!storage) throw new Error('Firebase Storage is not configured.')

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Choose a PNG, JPEG, WebP or AVIF image.')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('That image is larger than 5 MB. Please upload a smaller one.')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${LISTING_IMAGES_FOLDER}/${uid}/${Date.now()}-${safeName}`

  await uploadBytes(storageRef(storage, path), file, { contentType: file.type })
  return path
}

/** Resolves a listing's Storage path into a downloadable URL. */
export async function resolveListingImage(record) {
  if (!record.imagePath) return { ...record, imageUrl: FALLBACK_IMAGE }

  const storage = getFirebaseStorage()
  if (!storage) return { ...record, imageUrl: FALLBACK_IMAGE }

  try {
    const url = await getDownloadURL(storageRef(storage, record.imagePath))
    return { ...record, imageUrl: url }
  } catch {
    return { ...record, imageUrl: FALLBACK_IMAGE }
  }
}

function toRecord(id, data) {
  return { id, ...data }
}

/** FR-012: a seller only ever reads listings whose ownerId is their own. */
export async function fetchSellerListings(uid) {
  const db = getFirebaseDb()
  if (!db || !uid) return []

  const snapshot = await getDocs(query(collection(db, LISTINGS_COLLECTION), where('ownerId', '==', uid)))
  return snapshot.docs.map((doc) => toRecord(doc.id, doc.data()))
}

/** FR-017: inactive listings never reach a buyer-facing surface. */
export async function fetchActiveListings() {
  const db = getFirebaseDb()
  if (!db) return []

  const snapshot = await getDocs(query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'active')))
  return snapshot.docs.map((doc) => toRecord(doc.id, doc.data()))
}

/**
 * FR-008 / FR-009 / FR-010. The document ID is server-generated and ownerId is
 * taken from the signed-in session, never from the form (BR-004).
 */
export async function createListing(uid, values, imagePath = '') {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase is not configured.')

  const ref = await addDoc(collection(db, LISTINGS_COLLECTION), {
    ...toDocument(values, imagePath),
    ownerId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

/**
 * FR-014 / FR-015 / FR-019. Updates the same document, never creates a new one,
 * and refuses outright when the stored ownerId is not this seller (BR-004).
 */
export async function updateListing(uid, listingId, values, imagePath = undefined) {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firebase is not configured.')

  const ref = doc(db, LISTINGS_COLLECTION, listingId)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    throw new Error('That listing no longer exists. Refresh your list and try again.')
  }

  if (snapshot.data().ownerId !== uid) {
    throw new Error('You can only edit listings that belong to you.')
  }

  // ownerId, createdAt and the document ID are left untouched (BR-007).
  await updateDoc(ref, {
    ...toDocument(values, imagePath),
    updatedAt: serverTimestamp(),
  })
}

export function friendlyListingError(error) {
  const code = error?.code ?? ''
  switch (code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firestore rejected the request. Check the security rules on this project.'
    case 'unavailable':
      return 'Firestore is unavailable right now. Please try again.'
    case 'not-found':
      return 'That listing no longer exists.'
    case 'storage/unauthorized':
    case 'storage/canceled':
      return 'The image upload was cancelled.'
    case 'storage/retry-limit-exceeded':
      return 'The image could not be uploaded. Please try again.'
    default:
      return error?.message || 'Something went wrong while saving your listing.'
  }
}

/** FR-022: buyer-facing cards are shaped from the stored document, not a constant. */
export function toCardListing(record) {
  return {
    id: record.id,
    title: record.title,
    price: record.price,
    type: record.propertyType,
    location: record.city,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    areaSqft: record.area,
    image: record.imageUrl ?? FALLBACK_IMAGE,
    featured: false,
    mine: true,
  }
}