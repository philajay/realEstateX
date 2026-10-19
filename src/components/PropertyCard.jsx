import { useState } from 'react'
import { formatArea, formatPrice } from '../lib/format'
import { FALLBACK_IMAGE } from '../lib/placeholder'

export default function PropertyCard({ listing }) {
  const [imgSrc, setImgSrc] = useState(listing.image)

  return (
    <a className="card" href={`/property/${listing.id}`} aria-label={listing.title}>
      <div className="card__media">
        <img
          className="card__image"
          src={imgSrc}
          alt={`${listing.title} — ${listing.location}`}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {listing.featured === true && <span className="card__badge">Featured</span>}
      </div>

      <div className="card__body">
        <p className="card__price">{formatPrice(listing.price)}</p>
        <h3 className="card__title">{listing.title}</h3>
        <p className="card__location">{listing.location}</p>

        <ul className="card__specs">
          <li>
            <strong>{listing.bedrooms}</strong> Beds
          </li>
          <li>
            <strong>{listing.bathrooms}</strong> Baths
          </li>
          <li>
            <strong>{formatArea(listing.areaSqft)}</strong>
          </li>
        </ul>

        <span className="card__type">{listing.type}</span>
      </div>
    </a>
  )
}