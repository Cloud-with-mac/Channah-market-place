import { Briefcase, MapPin, Clock, Users, Rocket, Heart, Globe, Sparkles, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const departments = [
  { name: 'Engineering', count: 12, icon: '💻' },
  { name: 'Product', count: 5, icon: '🎯' },
  { name: 'Design', count: 4, icon: '🎨' },
  { name: 'Marketing', count: 6, icon: '📣' },
  { name: 'Operations', count: 8, icon: '⚙️' },
  { name: 'Customer Support', count: 10, icon: '💬' },
]

const openPositions = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'London, UK',
    type: 'Full-time',
    remote: true,
    description: 'Build and scale our marketplace platform using Next.js, Python, and cloud technologies.',
  },
  {
    title: 'AI/ML Engineer',
    department: 'Engineering',
    location: 'London, UK',
    type: 'Full-time',
    remote: true,
    description: 'Develop AI-powered features including personalized recommendations and smart search.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'London, UK',
    type: 'Full-time',
    remote: true,
    description: 'Create beautiful, intuitive experiences for millions of users worldwide.',
  },
  {
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    remote: false,
    description: 'Drive user acquisition and seller growth across global markets.',
  },
  {
    title: 'Customer Success Lead',
    department: 'Customer Support',
    location: 'Remote',
    type: 'Full-time',
    remote: true,
    description: 'Lead our global support team and ensure exceptional customer experiences.',
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'London, UK',
    type: 'Full-time',
    remote: true,
    description: 'Build and maintain our cloud infrastructure for global scale and reliability.',
  },
]

const benefits = [
  {
    icon: Globe,
    title: 'Remote First',
    description: 'Work from anywhere in the world with flexible hours.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance and wellness programs.',
  },
  {
    icon: Rocket,
    title: 'Growth Budget',
    description: '£2,000 annual learning budget for courses and conferences.',
  },
  {
    icon: Users,
    title: 'Team Events',
    description: 'Regular team retreats and social events worldwide.',
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-20">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Briefcase className="h-3 w-3 mr-1" />
            We're Hiring
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Join the Channah Team</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Help us build the future of global e-commerce. We're looking for passionate people to join our mission.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan" />
              <span>London HQ + Remote</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan" />
              <span>150+ Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan" />
              <span>30+ Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 border-b border-border">
        <div className="container">
          <h2 className="text-2xl font-bold font-display text-center mb-8">Our Teams</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept) => (
              <div key={dept.name} className="bg-card border border-border rounded-xl p-4 text-center hover:border-cyan/30 transition-colors">
                <span className="text-3xl mb-2 block">{dept.icon}</span>
                <h3 className="font-semibold text-sm mb-1">{dept.name}</h3>
                <p className="text-xs text-cyan">{dept.count} openings</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-card/50">
        <div className="container">
          <h2 className="text-2xl font-bold font-display text-center mb-2">Why Channah?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            We offer competitive benefits and a culture that values work-life balance.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-card border border-border rounded-xl p-6">
                <div className="p-3 rounded-xl bg-cyan/10 w-fit mb-4">
                  <benefit.icon className="h-6 w-6 text-cyan" />
                </div>
                <h3 className="font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display text-center mb-2">Open Positions</h2>
          <p className="text-muted-foreground text-center mb-12">
            Find your next opportunity at Channah
          </p>
          <div className="space-y-4">
            {openPositions.map((job, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-cyan/30 transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg group-hover:text-cyan transition-colors">{job.title}</h3>
                      {job.remote && (
                        <Badge className="bg-cyan/10 text-cyan border-0 text-xs">Remote OK</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <button className="inline-flex items-center justify-center px-6 py-2.5 bg-navy border border-cyan/30 text-cyan rounded-xl hover:bg-cyan hover:text-navy font-medium transition-colors whitespace-nowrap">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-cyan-dark/20 to-navy">
        <div className="container text-center">
          <Sparkles className="h-10 w-10 text-cyan mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display mb-4">Don't See Your Role?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            We're always looking for talented people. Send us your CV and we'll keep you in mind for future opportunities.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan to-cyan-light text-navy font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  )
}
