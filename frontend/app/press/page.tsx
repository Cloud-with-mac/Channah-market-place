import { Newspaper, Download, Calendar, ExternalLink, Mail, Image as ImageIcon, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const pressReleases = [
  {
    date: 'January 15, 2026',
    title: 'Channah Raises £50M Series B to Expand Global Marketplace',
    excerpt: 'London-based e-commerce platform Channah announces major funding round to accelerate international expansion and AI development.',
    category: 'Funding',
  },
  {
    date: 'December 10, 2025',
    title: 'Channah Launches AI-Powered Shopping Assistant',
    excerpt: 'Revolutionary AI technology helps customers find products, compare prices, and make smarter purchasing decisions.',
    category: 'Product',
  },
  {
    date: 'November 5, 2025',
    title: 'Channah Reaches 500,000 Active Sellers Worldwide',
    excerpt: 'Global marketplace celebrates milestone as sellers from 190+ countries join the platform.',
    category: 'Milestone',
  },
  {
    date: 'October 20, 2025',
    title: 'Channah Partners with Major Logistics Providers for Faster Global Shipping',
    excerpt: 'Strategic partnerships with DHL, FedEx, and regional carriers to improve delivery times and reduce costs.',
    category: 'Partnership',
  },
  {
    date: 'September 8, 2025',
    title: 'Channah Introduces Zero-Fee Program for Small Sellers',
    excerpt: 'New initiative waives commission fees for sellers earning under £1,000/month to support small businesses.',
    category: 'Announcement',
  },
]

const mediaFeatures = [
  { outlet: 'TechCrunch', quote: 'Channah is redefining global e-commerce with AI-first approach' },
  { outlet: 'Forbes', quote: 'One of the most promising UK startups to watch in 2026' },
  { outlet: 'The Guardian', quote: 'The marketplace that\'s making global selling accessible to everyone' },
  { outlet: 'Wired UK', quote: 'Channah\'s AI assistant is the future of online shopping' },
]

const companyStats = [
  { label: 'Founded', value: '2023' },
  { label: 'Headquarters', value: 'London, UK' },
  { label: 'Employees', value: '150+' },
  { label: 'Countries', value: '190+' },
  { label: 'Active Sellers', value: '500K+' },
  { label: 'Products', value: '10M+' },
]

export default function PressPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Newspaper className="h-3 w-3 mr-1" />
            Press & Media
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Newsroom</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            The latest news, announcements, and resources for journalists covering Channah.
          </p>
        </div>
      </section>

      {/* Media Contact */}
      <section className="py-8 border-b border-border">
        <div className="container">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan/10">
                <Mail className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <h3 className="font-bold">Media Inquiries</h3>
                <p className="text-sm text-muted-foreground">For press inquiries, interviews, and media resources</p>
              </div>
            </div>
            <a
              href="mailto:press@channah.com"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-cyan to-cyan-light text-navy font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              press@channah.com
            </a>
          </div>
        </div>
      </section>

      {/* Press Coverage */}
      <section className="py-12 bg-card/50">
        <div className="container">
          <h2 className="text-xl font-bold font-display text-center mb-8">Featured In</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {mediaFeatures.map((feature) => (
              <div key={feature.outlet} className="bg-card border border-border rounded-xl p-6 text-center">
                <h3 className="font-bold text-lg text-cyan mb-2">{feature.outlet}</h3>
                <p className="text-sm text-muted-foreground italic">"{feature.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display mb-8">Press Releases</h2>
          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <article
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-cyan/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-cyan/10 text-cyan border-0 text-xs">{release.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {release.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-cyan transition-colors">{release.title}</h3>
                    <p className="text-muted-foreground text-sm">{release.excerpt}</p>
                  </div>
                  <button className="flex-shrink-0 p-2 rounded-lg hover:bg-cyan/10 transition-colors">
                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-cyan" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Company Facts */}
      <section className="py-16 bg-card/50">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display text-center mb-8">Company Facts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {companyStats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-2xl font-bold text-cyan mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display text-center mb-2">Media Kit</h2>
          <p className="text-muted-foreground text-center mb-8">
            Download official Channah brand assets and resources
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-cyan/30 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-cyan" />
              </div>
              <h3 className="font-bold mb-2">Logo Pack</h3>
              <p className="text-sm text-muted-foreground mb-4">PNG, SVG, and EPS formats in various colors</p>
              <button className="inline-flex items-center text-sm text-cyan hover:text-cyan-light">
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-cyan/30 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mx-auto mb-4">
                <FileText className="h-8 w-8 text-cyan" />
              </div>
              <h3 className="font-bold mb-2">Brand Guidelines</h3>
              <p className="text-sm text-muted-foreground mb-4">Colors, typography, and usage guidelines</p>
              <button className="inline-flex items-center text-sm text-cyan hover:text-cyan-light">
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-cyan/30 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-cyan" />
              </div>
              <h3 className="font-bold mb-2">Product Screenshots</h3>
              <p className="text-sm text-muted-foreground mb-4">High-res screenshots of our platform</p>
              <button className="inline-flex items-center text-sm text-cyan hover:text-cyan-light">
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
