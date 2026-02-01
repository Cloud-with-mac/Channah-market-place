import { BookOpen, Calendar, Clock, User, ArrowRight, Tag, TrendingUp, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const featuredPost = {
  title: 'The Future of E-commerce: How AI is Transforming Online Shopping',
  excerpt: 'Discover how artificial intelligence is revolutionizing the way we shop online, from personalized recommendations to intelligent customer service.',
  author: 'Sarah Chen',
  date: 'January 18, 2026',
  readTime: '8 min read',
  category: 'Technology',
  image: '🤖',
}

const blogPosts = [
  {
    title: '10 Tips for Successful Selling on Vendora',
    excerpt: 'Learn the strategies that top sellers use to maximize their sales and grow their businesses on our platform.',
    author: 'James Wilson',
    date: 'January 15, 2026',
    readTime: '5 min read',
    category: 'Seller Tips',
    image: '📈',
  },
  {
    title: 'Sustainable Shopping: A Complete Guide',
    excerpt: 'How to make environmentally conscious purchasing decisions and support eco-friendly sellers.',
    author: 'Emma Green',
    date: 'January 12, 2026',
    readTime: '6 min read',
    category: 'Sustainability',
    image: '🌱',
  },
  {
    title: 'Global Shipping Made Easy: What You Need to Know',
    excerpt: 'Everything you need to know about international shipping, customs, and getting your products worldwide.',
    author: 'David Park',
    date: 'January 10, 2026',
    readTime: '7 min read',
    category: 'Guides',
    image: '🌍',
  },
  {
    title: 'Building Trust: How Reviews Shape Online Shopping',
    excerpt: 'The psychology behind reviews and why authentic feedback is crucial for marketplace success.',
    author: 'Lisa Thompson',
    date: 'January 8, 2026',
    readTime: '4 min read',
    category: 'Insights',
    image: '⭐',
  },
  {
    title: 'From Side Hustle to Full-Time: Success Stories',
    excerpt: 'Inspiring stories of sellers who turned their Vendora shops into thriving full-time businesses.',
    author: 'Michael Brown',
    date: 'January 5, 2026',
    readTime: '6 min read',
    category: 'Success Stories',
    image: '🚀',
  },
  {
    title: 'Product Photography Tips for Better Sales',
    excerpt: 'Expert advice on taking stunning product photos that convert browsers into buyers.',
    author: 'Anna Martinez',
    date: 'January 2, 2026',
    readTime: '5 min read',
    category: 'Seller Tips',
    image: '📸',
  },
]

const categories = [
  { name: 'All Posts', count: 45 },
  { name: 'Seller Tips', count: 12 },
  { name: 'Technology', count: 8 },
  { name: 'Success Stories', count: 10 },
  { name: 'Guides', count: 9 },
  { name: 'Sustainability', count: 6 },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <BookOpen className="h-3 w-3 mr-1" />
            Vendora Blog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Insights & Stories</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Tips, trends, and inspiration for buyers and sellers in the global marketplace.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            {/* Featured Post */}
            <article className="bg-card border border-border rounded-2xl overflow-hidden mb-12 hover:border-cyan/30 transition-colors group">
              <div className="bg-gradient-to-br from-cyan-dark/30 to-navy p-12 flex items-center justify-center">
                <span className="text-8xl">{featuredPost.image}</span>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-cyan/10 text-cyan border-0">{featuredPost.category}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {featuredPost.date}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h2 className="text-2xl font-bold font-display mb-3 group-hover:text-cyan transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {featuredPost.author}
                  </div>
                  <button className="inline-flex items-center text-cyan hover:text-cyan-light font-medium">
                    Read More
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>

            {/* Post Grid */}
            <h2 className="text-xl font-bold font-display mb-6">Latest Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts.map((post, index) => (
                <article
                  key={index}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-cyan/30 transition-colors group"
                >
                  <div className="bg-gradient-to-br from-navy-light to-navy p-8 flex items-center justify-center">
                    <span className="text-5xl">{post.image}</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-cyan/10 text-cyan border-0 text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <h3 className="font-bold mb-2 group-hover:text-cyan transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{post.date}</span>
                      <button className="text-cyan hover:text-cyan-light">Read →</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="inline-flex items-center justify-center px-8 py-3 bg-navy border border-cyan/30 text-cyan rounded-xl hover:bg-cyan hover:text-navy font-medium transition-colors">
                Load More Articles
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-8">
            {/* Categories */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-cyan" />
                Categories
              </h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.name}>
                    <button className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-cyan/5 transition-colors text-sm">
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">{category.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trending */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                Trending
              </h3>
              <ul className="space-y-4">
                {blogPosts.slice(0, 3).map((post, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-2xl font-bold text-cyan/30">{index + 1}</span>
                    <div>
                      <h4 className="text-sm font-medium hover:text-cyan transition-colors cursor-pointer line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-cyan-dark/20 to-navy border border-cyan/30 rounded-xl p-6">
              <Sparkles className="h-6 w-6 text-cyan mb-3" />
              <h3 className="font-bold mb-2">Subscribe to Updates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest articles delivered to your inbox.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 bg-navy border border-border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-cyan"
              />
              <button className="w-full py-2.5 bg-gradient-to-r from-cyan to-cyan-light text-navy font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
