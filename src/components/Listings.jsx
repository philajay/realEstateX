import { useMemo, useState } from 'react'
import PropertyCard from './PropertyCard'

const ALL = 'All'

export default function Listings({ listings, loading = false }) {
  const [activeFilter, setActiveFilter] = useState(ALL)

  const filters = useMemo(
    () => [ALL, ...Array.from(new Set(listings.map((l) => l.type)))],
    [listings],
  )

  const visible = useMemo(
    () => (activeFilter === ALL ? listings : listings.filter((l) => l.type === activeFilter)),
    [listings, activeFilter],
  )

  return (
    <section className="listings" id="listings" aria-labelledby="listings-heading">
      <div className="listings__head">
        <div>
          <p className="eyebrow">Properties for sale</p>
          <h1 className="listings__heading" id="listings-heading">
            Find a place you&apos;ll love coming home to
          </h1>
          <p className="listings__sub">
            Showing <strong>{visible.length}</strong> of <strong>{listings.length}</strong> properties for
            sale
          </p>
        </div>

        {filters.length > 1 ? (
          <div className="chips" role="group" aria-label="Filter by property type">
            {filters.map((type) => (
              <button
                key={type}
                type="button"
                className={`chip ${type === activeFilter ? 'chip--active' : ''}`}
                aria-pressed={type === activeFilter}
                onClick={() => setActiveFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="listings__state" role="status" data-testid="homepage-loading">
          Loading properties…
        </p>
      ) : listings.length === 0 ? (
        <div className="empty" role="status" data-testid="homepage-empty">
          <p className="empty__title">No properties are listed right now</p>
          <p className="empty__text">Check back soon, or list your own property with us.</p>
        </div>
      ) : visible.length > 0 ? (
        <div className="grid">
          {visible.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="empty" role="status">
          <p className="empty__title">No properties match this filter</p>
          <p className="empty__text">
            Try selecting <strong>All</strong> to see every property we have.
          </p>
        </div>
      )}
    </section>
  )
}