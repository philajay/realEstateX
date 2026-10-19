import { useEffect, useState } from 'react'
import Header from './components/Header'
import Listings from './components/Listings'
import Footer from './components/Footer'
import SellerListings from './components/SellerListings'
import ContactForm from './components/ContactForm'
import { fetchActiveListings, friendlyListingError, resolveListingImage, toCardListing } from './lib/listings'

const SELLER_ROUTE = '/sell'
const CONTACT_ROUTE = '/contact'

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    function onPopState() {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return path
}

// FR-017 / FR-022: buyer-facing cards are the seller's active listings, read
// from Firestore. The old seed data is no longer rendered.
function useActiveListings(enabled) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    // FR-018: the contact page never shows the grid, so it never fetches it
    // either — a failing listings query cannot disturb the contact form.
    if (!enabled) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    fetchActiveListings()
      .then(async (rows) => {
        // Buyer-facing images are minted from Firebase Storage on read.
        const withImages = await Promise.all(rows.map(resolveListingImage))
        if (!cancelled) {
          setRecords(withImages)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(friendlyListingError(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { records, loading, error }
}

export default function App() {
  const path = usePath()
  const isContact = path === CONTACT_ROUTE
  const { records, loading, error } = useActiveListings(!isContact)

  const cards = records.map(toCardListing)

  return (
    <>
      <Header />

      <main>
        {isContact ? (
          <ContactForm />
        ) : path === SELLER_ROUTE ? (
          <SellerListings />
        ) : (
          <>
            {error ? (
              <p className="auth-config-error" role="alert" data-testid="listings-error">
                {error}
              </p>
            ) : null}
            <Listings listings={cards} loading={loading} />
          </>
        )}
      </main>

      <Footer />
    </>
  )
}