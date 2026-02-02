import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://channah.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/sell`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/best-sellers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ]

  let productPages: MetadataRoute.Sitemap = []
  let categoryPages: MetadataRoute.Sitemap = []

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const [productsRes, categoriesRes] = await Promise.allSettled([
      fetch(`${apiUrl}/products?limit=1000`).then(r => r.json()),
      fetch(`${apiUrl}/categories`).then(r => r.json()),
    ])

    if (productsRes.status === 'fulfilled') {
      const products = Array.isArray(productsRes.value) ? productsRes.value : (productsRes.value?.results || [])
      productPages = products.map((p: any) => ({
        url: `${BASE_URL}/product/${p.slug}`,
        lastModified: new Date(p.updated_at || p.created_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }

    if (categoriesRes.status === 'fulfilled') {
      const categories = Array.isArray(categoriesRes.value) ? categoriesRes.value : (categoriesRes.value?.results || [])
      categoryPages = categories.map((c: any) => ({
        url: `${BASE_URL}/category/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return [...staticPages, ...categoryPages, ...productPages]
}
