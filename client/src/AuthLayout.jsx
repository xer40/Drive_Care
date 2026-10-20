import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AuthLayout.css'

// Shared layout for the login and sign-up pages:
// a photo with the app's pitch on the left 2/3, and the form on the right 1/3

const FEATURES = [
  { label: 'Track Maintenance', icon: <WrenchIcon /> },
  { label: 'Get AI Insights', icon: <ChartIcon /> },
  { label: 'Join a Community', icon: <UsersIcon /> },
  { label: 'Manage Multiple Vehicles', icon: <CarFrontIcon /> },
]

function AuthLayout({ image, heading, tagline, prompt, linkText, linkTo, footer, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero" style={{ backgroundImage: `url(${image})` }}>
        <Brand />

        <div className="auth-hero-text">
          <h1>{heading}</h1>
          <p>{tagline}</p>

          <ul className="auth-features">
            {FEATURES.map((feature) => (
              <li key={feature.label}>
                <span className="auth-feature-icon">{feature.icon}</span>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="auth-panel">
        {/* Optional button in the top right, e.g. "New here? Create account" */}
        {linkTo && (
          <div className="auth-topbar">
            <span>{prompt}</span>
            <Link to={linkTo} className="auth-outline-btn">{linkText}</Link>
          </div>
        )}

        {/* The photo is hidden on narrow screens, so show the logo above the form instead */}
        <div className="auth-mobile-brand">
          <Brand />
        </div>

        <div className="auth-card">{children}</div>

        <p className="auth-footer">{footer}</p>
      </section>
    </div>
  )
}

function Brand() {
  return (
    <div className="auth-brand">
      <CarOutlineIcon />
      <span>Drive<span className="auth-brand-accent">Care</span></span>
    </div>
  )
}

// A labelled input with an icon on the left. Any other props go straight to the <input>
export function AuthField({ label, icon, ...inputProps }) {
  return (
    <label className="auth-field">
      <span className="auth-label">{label}</span>
      <span className="auth-input">
        {icon}
        <input {...inputProps} />
      </span>
    </label>
  )
}

// Password input with a button that shows or hides what was typed
export function PasswordField({ label, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="auth-field">
      <span className="auth-label">{label}</span>
      <span className="auth-input">
        <LockIcon />
        <input type={visible ? 'text' : 'password'} {...inputProps} />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  )
}

// ---------- Icons (simple line icons, sized and coloured by CSS) ----------

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function CarOutlineIcon() {
  return (
    <svg className="auth-brand-icon" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 22h-2.5a1.5 1.5 0 0 1-1.5-1.5v-4c0-1.6 1-3 2.6-3.4l9.4-2.6 7.2-5.6A6 6 0 0 1 24.9 4h14.6a6 6 0 0 1 4.3 1.8l6.2 6.2 7.6 1.4A4 4 0 0 1 61 17.3v3.2a1.5 1.5 0 0 1-1.5 1.5H57" />
      <path d="M19 22h25" />
      <circle cx="12.5" cy="22.5" r="5.5" />
      <circle cx="50.5" cy="22.5" r="5.5" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18" />
      <rect x="4.5" y="11" width="4" height="10" rx="1" />
      <rect x="10" y="4" width="4" height="17" rx="1" />
      <rect x="15.5" y="8" width="4" height="13" rx="1" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </svg>
  )
}

function CarFrontIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 11 6.6 6.2A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.2L19 11" />
      <rect x="3" y="11" width="18" height="6" rx="2" />
      <path d="M6 17v2M18 17v2" />
      <circle cx="7.5" cy="14" r="1" />
      <circle cx="16.5" cy="14" r="1" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

export function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <path d="M12 14.5v2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3 3.9" />
      <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export default AuthLayout
