interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
  description?: string
}

export function OrganizationJsonLd({
  name = 'Channah',
  url = 'https://channah.com',
  logo = 'https://channah.com/logo.png',
  description = 'Your Premium African Marketplace.',
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name, url, logo, description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+44-800-CHANNAH',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  )
}

export function WebsiteJsonLd({ name = 'Channah', url = 'https://channah.com' }: { name?: string; url?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name, url,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: url + '/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  )
}

interface ProductJsonLdProps {
  name: string
  description: string
  image: string
  price: number
  currency?: string
  sku?: string
  brand?: string
  rating?: number
  reviewCount?: number
  inStock?: boolean
  url: string
}

export function ProductJsonLd({ name, description, image, price, currency = 'GBP', sku, brand, rating, reviewCount, inStock = true, url }: ProductJsonLdProps) {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name, description, image, url,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: brand || 'Channah' },
    },
  }
  if (sku) jsonLd.sku = sku
  if (brand) jsonLd.brand = { '@type': 'Brand', name: brand }
  if (rating && reviewCount) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    }
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  )
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  )
}
