import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Sourcing | Vendora-Market',
  description: 'Connect with verified suppliers and source products at competitive prices. Post your requirements and receive bids from qualified vendors.',
  keywords: ['product sourcing', 'b2b marketplace', 'supplier bidding', 'bulk procurement', 'vendor quotes', 'rfq'],
}

export default function SourcingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
