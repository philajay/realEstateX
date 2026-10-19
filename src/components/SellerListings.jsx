import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  AREA_UNITS,
  EMPTY_LISTING,
  FIELD_LABELS,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  createListing,
  fetchSellerListings,
  friendlyListingError,
  resolveListingImage,
  updateListing,
  uploadListingImage,
  validateListing,
} from '../lib/listings'
import { formatPrice } from '../lib/format'

const STATUS_LABELS = { active: 'Active', inactive: 'Inactive' }

function Field({ name, label, error, children }) {
  return (
    <div className={`sform__field ${error ? 'sform__field--invalid' : ''}`}>
      <label className="sform__label" htmlFor={`listing-${name}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="sform__error" id={`listing-${name}-error`} role="alert" data-testid={`error-${name}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function StatusPicker({ value, error, onChange }) {
  return (
    <fieldset className="sform__status" data-testid="status-picker">
      <legend className="sform__label">Status</legend>
      <div className="sform__status-options">
        {LISTING_STATUSES.map((status) => (
          <label key={status} className={`sradio ${value === status ? 'sradio--on' : ''}`}>
            <input
              type="radio"
              name="listing-status"
              value={status}
              checked={value === status}
              data-testid={`status-${status}`}
              onChange={() => onChange(status)}
            />
            <span>{STATUS_LABELS[status]}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="sform__error" role="alert" data-testid="error-status">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

function ListingRow({ listing, onEdit }) {
  return (
    <li className="srow" data-testid="listing-row" data-owner={listing.ownerId} data-status={listing.status}>
      <img className="srow__thumb" src={listing.imageUrl} alt={`${listing.title} — saved image`} />
      <div className="srow__main">
        <h3 className="srow__title">{listing.title}</h3>
        <p className="srow__meta">
          {formatPrice(listing.price)} · {listing.propertyType} · {listing.bedrooms} beds · {listing.bathrooms}{' '}
          baths · {listing.area} {listing.areaUnit || 'sq ft'}
        </p>
        <p className="srow__meta">
          {listing.city} · <span className="srow__status">{STATUS_LABELS[listing.status] ?? listing.status}</span>
        </p>
      </div>
      <button
        type="button"
        className="btn btn--ghost srow__edit"
        data-testid="listing-edit"
        onClick={() => onEdit(listing)}
      >
        Edit<span className="sr-only"> {listing.title}</span>
      </button>
    </li>
  )
}

export default function SellerListings() {
  const { status, user, profile } = useAuth()
  const [values, setValues] = useState(EMPTY_LISTING)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [records, setRecords] = useState([])
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImage, setExistingImage] = useState(null)

  const role = profile?.role
  const uid = user?.uid
  const allowed = status === 'signed-in' && role === 'seller' && Boolean(uid)

  const load = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await fetchSellerListings(uid)
      setRecords(await Promise.all(rows.map(resolveListingImage)))
    } catch (error) {
      setLoadError(friendlyListingError(error))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    if (allowed) load()
    else setLoading(false)
  }, [allowed, load])

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  // The picked file is previewed locally before anything is uploaded.
  function pickImage(file) {
    setImage(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  function startCreate() {
    setValues(EMPTY_LISTING)
    setErrors({})
    setFormError(null)
    setSaved(null)
    setEditingId(null)
    setImage(null)
    setExistingImage(null)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  // FR-013: opening a listing loads its stored values back into the form.
  function startEdit(listing) {
    setValues({
      title: listing.title ?? '',
      description: listing.description ?? '',
      propertyType: listing.propertyType ?? PROPERTY_TYPES[0],
      city: listing.city ?? '',
      address: listing.address ?? '',
      price: listing.price ?? '',
      bedrooms: listing.bedrooms ?? '',
      bathrooms: listing.bathrooms ?? '',
      area: listing.area ?? '',
      areaUnit: listing.areaUnit ?? AREA_UNITS[0],
      status: listing.status ?? 'active',
    })
    setErrors({})
    setFormError(null)
    setSaved(null)
    setEditingId(listing.id)
    setImage(null)
    setExistingImage(listing.imageUrl ?? null)
    setImagePreview(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting || !allowed) return

    setSaved(null)

    const found = validateListing(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Fix the highlighted fields and try again. Nothing was saved.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    // NFR-002: Firestore queues writes while offline, so a save made with no
    // connection never settles — the seller would sit on a spinner forever.
    // Refusing up front keeps the button responsive and avoids a retry racing a
    // write that is still in the queue and landing a second document.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSubmitting(false)
      setFormError('You appear to be offline, so this listing was not saved. Reconnect and try again.')
      return
    }

    try {
      // The image goes to Storage first; the listing stores only its path.
      let imagePath
      if (image) imagePath = await uploadListingImage(uid, image)

      if (editingId) {
        await updateListing(uid, editingId, values, imagePath)
        setSaved('Listing updated.')
      } else {
        await createListing(uid, values, imagePath ?? '')
        setSaved('Listing saved.')
        setValues(EMPTY_LISTING)
        setEditingId(null)
      }
      setImage(null)
      setImagePreview(null)
      await load()
    } catch (error) {
      // FR-020: the entered values stay in the form so nothing typed is lost.
      setFormError(friendlyListingError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'unconfigured') {
    return (
      <section className="shell shell--narrow" data-testid="seller-surface">
        <div className="empty" role="status">
          <p className="empty__title">Seller listings are unavailable</p>
          <p className="empty__text">Firebase is not configured for this app.</p>
        </div>
      </section>
    )
  }

  // FR-001 / FR-002: no form renders for a visitor or a buyer.
  if (!allowed) {
    return (
      <section className="shell shell--narrow" data-testid="seller-surface">
        <div className="empty" data-testid="seller-denied">
          <p className="empty__title">
            {status === 'loading' || status === 'authenticating'
              ? 'Checking your account…'
              : 'Seller access only'}
          </p>
          <p className="empty__text">
            {status === 'signed-out'
              ? 'Sign in with a seller account to list and manage your properties.'
              : 'This page is for sellers. Your account is signed in as a buyer.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="shell shell--narrow sell" data-testid="seller-surface">
      <header className="sell__head">
        <p className="eyebrow">Seller</p>
        <h1 className="sell__heading">Your property listings</h1>
        <p className="sell__sub">
          Publish a property, keep it updated, and switch it off when it is no longer for sale. Only you can see
          and edit these listings.
        </p>
      </header>

      <form className="sform" onSubmit={handleSubmit} noValidate data-testid="listing-form">
        <h2 className="sform__heading">{editingId ? 'Edit listing' : 'New listing'}</h2>

        <Field name="title" label={FIELD_LABELS.title} error={errors.title}>
          <input
            id="listing-title"
            type="text"
            value={values.title}
            data-testid="field-title"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'listing-title-error' : undefined}
            onChange={(event) => setField('title', event.target.value)}
          />
        </Field>

        <Field name="description" label={FIELD_LABELS.description} error={errors.description}>
          <textarea
            id="listing-description"
            rows={3}
            value={values.description}
            data-testid="field-description"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'listing-description-error' : undefined}
            onChange={(event) => setField('description', event.target.value)}
          />
        </Field>

        <div className="sform__row">
          <Field name="propertyType" label={FIELD_LABELS.propertyType} error={errors.propertyType}>
            <select
              id="listing-propertyType"
              value={values.propertyType}
              data-testid="field-propertyType"
              aria-invalid={Boolean(errors.propertyType)}
              onChange={(event) => setField('propertyType', event.target.value)}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <Field name="price" label={FIELD_LABELS.price} error={errors.price}>
            <input
              id="listing-price"
              type="number"
              min="0"
              value={values.price}
              data-testid="field-price"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'listing-price-error' : undefined}
              onChange={(event) => setField('price', event.target.value)}
            />
          </Field>
        </div>

        <div className="sform__row">
          <Field name="bedrooms" label={FIELD_LABELS.bedrooms} error={errors.bedrooms}>
            <input
              id="listing-bedrooms"
              type="number"
              min="0"
              step="1"
              value={values.bedrooms}
              data-testid="field-bedrooms"
              aria-invalid={Boolean(errors.bedrooms)}
              aria-describedby={errors.bedrooms ? 'listing-bedrooms-error' : undefined}
              onChange={(event) => setField('bedrooms', event.target.value)}
            />
          </Field>

          <Field name="bathrooms" label={FIELD_LABELS.bathrooms} error={errors.bathrooms}>
            <input
              id="listing-bathrooms"
              type="number"
              min="0"
              step="1"
              value={values.bathrooms}
              data-testid="field-bathrooms"
              aria-invalid={Boolean(errors.bathrooms)}
              aria-describedby={errors.bathrooms ? 'listing-bathrooms-error' : undefined}
              onChange={(event) => setField('bathrooms', event.target.value)}
            />
          </Field>

          <Field name="area" label={FIELD_LABELS.area} error={errors.area}>
            <input
              id="listing-area"
              type="number"
              min="0"
              value={values.area}
              data-testid="field-area"
              aria-invalid={Boolean(errors.area)}
              aria-describedby={errors.area ? 'listing-area-error' : undefined}
              onChange={(event) => setField('area', event.target.value)}
            />
          </Field>

          <Field name="areaUnit" label="Area unit">
            <select
              id="listing-areaUnit"
              value={values.areaUnit}
              data-testid="field-areaUnit"
              onChange={(event) => setField('areaUnit', event.target.value)}
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field name="city" label={FIELD_LABELS.city} error={errors.city}>
          <input
            id="listing-city"
            type="text"
            value={values.city}
            data-testid="field-city"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? 'listing-city-error' : undefined}
            onChange={(event) => setField('city', event.target.value)}
          />
        </Field>

        <Field name="address" label={FIELD_LABELS.address} error={errors.address}>
          <input
            id="listing-address"
            type="text"
            value={values.address}
            data-testid="field-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? 'listing-address-error' : undefined}
            onChange={(event) => setField('address', event.target.value)}
          />
        </Field>

        <Field name="image" label="Property image" error={errors.image}>
          <input
            id="listing-image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            data-testid="field-image"
            aria-describedby="listing-image-help"
            onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
          />
          <p className="sform__hint" id="listing-image-help">
            PNG, JPEG, WebP or AVIF, up to 5 MB. Uploaded to Firebase Storage.
          </p>
          {imagePreview ? (
            <img className="sform__preview" src={imagePreview} alt="Selected property preview" data-testid="image-preview" />
          ) : null}
          {existingImage ? (
            <img className="sform__preview" src={existingImage} alt="Currently saved property image" data-testid="image-current" />
          ) : null}
        </Field>

        <StatusPicker value={values.status} error={errors.status} onChange={(next) => setField('status', next)} />

        {formError ? (
          <p className="sform__banner" role="alert" data-testid="form-error">
            {formError}
          </p>
        ) : null}

        {saved ? (
          <p className="sform__banner sform__banner--ok" role="status" data-testid="form-success">
            {saved}
          </p>
        ) : null}

        <div className="sform__actions">
          <button type="submit" className="btn btn--primary" data-testid="listing-save" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Save listing'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn--ghost" data-testid="listing-cancel" onClick={startCreate}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="slist">
        <h2 className="slist__heading">Your listings</h2>

        {loading ? (
          <p className="slist__state" role="status" data-testid="list-loading">
            Loading your listings…
          </p>
        ) : loadError ? (
          <p className="sform__banner" role="alert" data-testid="list-error">
            {loadError}
          </p>
        ) : records.length === 0 ? (
          <div className="empty" data-testid="list-empty" role="status">
            <p className="empty__title">You have no listings yet</p>
            <p className="empty__text">Use the form above to publish your first property.</p>
          </div>
        ) : (
          <ul className="slist__items" data-testid="listing-list">
            {records.map((listing) => (
              <ListingRow key={listing.id} listing={listing} onEdit={startEdit} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}