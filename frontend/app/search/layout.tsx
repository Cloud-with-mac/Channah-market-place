import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search our marketplace for quality products from trusted African vendors. Find electronics, fashion, home goods, and more.',
  robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
