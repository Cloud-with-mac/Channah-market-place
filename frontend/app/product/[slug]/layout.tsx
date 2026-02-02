import { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(API_URL + '/products/' + params.slug, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Product Not Found' }
    const product = await res.json()

    const image = product.primary_image || product.images?.[0]?.url || ''

    return {
      title: product.name,
      description: product.description?.slice(0, 160) || 'View this product on Channah marketplace.',
      openGraph: {
        title: product.name + ' | Channah',
        description: product.description?.slice(0, 160) || '',
        type: 'website',
        images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description?.slice(0, 160) || '',
        images: image ? [image] : [],
      },
      alternates: { canonical: '/product/' + params.slug },
    }
  } catch {
    return { title: 'Product' }
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
