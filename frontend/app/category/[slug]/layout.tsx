import { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  try {
    const res = await fetch(API_URL + '/categories/' + params.slug, { next: { revalidate: 3600 } })
    if (res.ok) {
      const cat = await res.json()
      return {
        title: cat.name || name,
        description: cat.description || 'Browse ' + (cat.name || name) + ' products from trusted vendors on Channah marketplace.',
        openGraph: {
          title: (cat.name || name) + ' | Channah',
          description: cat.description || 'Browse ' + (cat.name || name) + ' products on Channah.',
        },
        alternates: { canonical: '/category/' + params.slug },
      }
    }
  } catch {}
  return {
    title: name,
    description: 'Browse ' + name + ' products on Channah marketplace.',
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
