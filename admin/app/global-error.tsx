'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical global error for admin
    console.error('Admin global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#dc2626' }}>
            Admin System Error
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            A critical system error occurred in the admin dashboard.
            <br />
            Please refresh the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '12px',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f3f4f6',
              color: '#000',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </body>
    </html>
  )
}
