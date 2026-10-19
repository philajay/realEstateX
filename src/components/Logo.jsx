export default function Logo({ variant = 'header' }) {
  return (
    <a
      className={`brand ${variant === 'footer' ? 'brand--footer' : ''}`}
      href="/"
      aria-label="EstateX — home"
    >
      <img
        className="brand__logo"
        src="/assets/logo.avif"
        alt=""
        width="390"
        height="146"
      />
    </a>
  )
}