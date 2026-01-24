import { Leaf, Recycle, Globe, Package, TrendingDown, Heart, CheckCircle, TreePine, Droplets, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const initiatives = [
  {
    icon: Package,
    title: 'Eco-Friendly Packaging',
    description: 'We partner with sellers to reduce plastic packaging and promote recyclable materials.',
    stat: '80%',
    statLabel: 'Reduction in plastic',
  },
  {
    icon: TrendingDown,
    title: 'Carbon Neutral Shipping',
    description: 'We offset 100% of carbon emissions from all shipments through verified carbon credits.',
    stat: '50K+',
    statLabel: 'Tonnes offset',
  },
  {
    icon: Recycle,
    title: 'Circular Economy',
    description: 'Supporting sellers who use recycled materials and promoting product longevity.',
    stat: '10K+',
    statLabel: 'Eco products',
  },
  {
    icon: TreePine,
    title: 'Reforestation',
    description: 'For every 100 orders, we plant a tree in partnership with reforestation charities.',
    stat: '100K+',
    statLabel: 'Trees planted',
  },
]

const commitments = [
  'Carbon neutral operations by 2025',
  '100% renewable energy in our offices',
  'Zero single-use plastic in packaging',
  'Supporting 1,000+ eco-friendly sellers',
  'Annual sustainability report',
  'Employee green initiatives program',
]

const ecoCategories = [
  { name: 'Organic Products', icon: '🌿', count: '2,500+' },
  { name: 'Recycled Materials', icon: '♻️', count: '3,200+' },
  { name: 'Plastic-Free', icon: '🚫', count: '1,800+' },
  { name: 'Fair Trade', icon: '🤝', count: '900+' },
  { name: 'Vegan', icon: '🌱', count: '1,500+' },
  { name: 'Handmade', icon: '✋', count: '4,000+' },
]

const sdgGoals = [
  { number: 12, title: 'Responsible Consumption', description: 'Ensuring sustainable consumption and production patterns' },
  { number: 13, title: 'Climate Action', description: 'Taking urgent action to combat climate change' },
  { number: 15, title: 'Life on Land', description: 'Protecting, restoring and promoting sustainable ecosystems' },
]

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-20">
        <div className="container text-center">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
            <Leaf className="h-3 w-3 mr-1" />
            Our Commitment
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Sustainability at Channah</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Building a marketplace that's good for people and the planet. Every purchase makes a difference.
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <Droplets className="h-8 w-8 text-cyan mx-auto mb-2" />
              <p className="text-2xl font-bold text-cyan">100%</p>
              <p className="text-sm text-white/60">Carbon Neutral</p>
            </div>
            <div className="text-center">
              <TreePine className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-400">100K+</p>
              <p className="text-sm text-white/60">Trees Planted</p>
            </div>
            <div className="text-center">
              <Sun className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-400">100%</p>
              <p className="text-sm text-white/60">Renewable Energy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Initiatives */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold font-display text-center mb-2">Our Initiatives</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Concrete actions we're taking to reduce our environmental impact.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {initiatives.map((initiative) => (
              <div key={initiative.title} className="bg-card border border-border rounded-xl p-6 hover:border-emerald-500/30 transition-colors">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <initiative.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold mb-2">{initiative.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{initiative.description}</p>
                <div className="pt-4 border-t border-border">
                  <p className="text-2xl font-bold text-emerald-400">{initiative.stat}</p>
                  <p className="text-xs text-muted-foreground">{initiative.statLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eco Categories */}
      <section className="py-16 bg-card/50">
        <div className="container">
          <h2 className="text-2xl font-bold font-display text-center mb-2">Shop Sustainably</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Discover eco-friendly products from verified sustainable sellers.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ecoCategories.map((category) => (
              <Link
                key={category.name}
                href={`/products?eco=${category.name.toLowerCase().replace(' ', '-')}`}
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-emerald-500/30 transition-colors group"
              >
                <span className="text-4xl mb-3 block">{category.icon}</span>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-emerald-400 transition-colors">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
                <Heart className="h-3 w-3 mr-1" />
                Our Promise
              </Badge>
              <h2 className="text-3xl font-bold font-display mb-4">Committed to Change</h2>
              <p className="text-muted-foreground mb-6">
                We believe businesses have a responsibility to operate sustainably. Here are our commitments to a greener future.
              </p>
              <ul className="space-y-3">
                {commitments.map((commitment) => (
                  <li key={commitment} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{commitment}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-navy border border-emerald-500/30 rounded-2xl p-8">
              <Globe className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-center mb-4">UN Sustainable Development Goals</h3>
              <div className="space-y-4">
                {sdgGoals.map((goal) => (
                  <div key={goal.number} className="bg-navy/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-emerald-500 text-navy font-bold text-sm flex items-center justify-center">
                        {goal.number}
                      </span>
                      <span className="font-semibold">{goal.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-11">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Program */}
      <section className="py-16 bg-gradient-to-br from-emerald-500/10 to-navy">
        <div className="container text-center">
          <Leaf className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display mb-4">Green Seller Program</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join our certified eco-friendly seller program. Get verified badges, featured placement, and connect with conscious consumers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sell/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Become a Green Seller
            </Link>
            <Link
              href="/seller-policies"
              className="inline-flex items-center justify-center px-8 py-3 bg-navy border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl hover:bg-emerald-500/10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Report */}
      <section className="py-16">
        <div className="container max-w-2xl text-center">
          <h2 className="text-2xl font-bold font-display mb-4">Transparency Report</h2>
          <p className="text-muted-foreground mb-8">
            Read our annual sustainability report for detailed metrics on our environmental impact and progress towards our goals.
          </p>
          <button className="inline-flex items-center justify-center px-8 py-3 bg-card border border-border rounded-xl hover:border-cyan/30 transition-colors">
            <Package className="h-5 w-5 mr-2 text-cyan" />
            Download 2025 Report (PDF)
          </button>
        </div>
      </section>
    </div>
  )
}
