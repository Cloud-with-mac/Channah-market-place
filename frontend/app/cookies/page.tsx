import { Cookie, Settings, Shield, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Cookie className="h-3 w-3 mr-1" />
            Cookies
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Cookie Policy</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            How we use cookies to improve your experience
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground text-lg mb-8">
              Last updated: January 2026
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold font-display mb-4 flex items-center gap-2">
                  <Cookie className="h-6 w-6 text-cyan" />
                  What Are Cookies?
                </h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-muted-foreground">
                    Cookies are small text files that are stored on your device when you visit a website.
                    They help websites remember your preferences and provide a better user experience.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-display mb-4 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-cyan" />
                  Types of Cookies We Use
                </h2>
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-2">Essential Cookies</h3>
                    <p className="text-muted-foreground text-sm">
                      Required for the website to function properly. These cannot be disabled.
                      They include cookies for authentication, shopping cart, and security.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-2">Functional Cookies</h3>
                    <p className="text-muted-foreground text-sm">
                      Remember your preferences such as language, region, and display settings.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-2">Analytics Cookies</h3>
                    <p className="text-muted-foreground text-sm">
                      Help us understand how visitors interact with our website, allowing us to improve our services.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-2">Marketing Cookies</h3>
                    <p className="text-muted-foreground text-sm">
                      Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-display mb-4 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-cyan" />
                  Managing Cookies
                </h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-muted-foreground mb-4">
                    You can manage your cookie preferences at any time through your browser settings.
                    Most browsers allow you to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• View what cookies are stored on your device</li>
                    <li>• Delete some or all cookies</li>
                    <li>• Block all cookies or specific types</li>
                    <li>• Set up notifications when cookies are placed</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-display mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-cyan" />
                  Your Privacy
                </h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-muted-foreground">
                    We are committed to protecting your privacy. Our use of cookies complies with GDPR and other
                    applicable data protection regulations. For more information, please see our{' '}
                    <a href="/privacy" className="text-cyan hover:text-cyan-light">Privacy Policy</a>.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-display mb-4">Contact Us</h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-muted-foreground">
                    If you have any questions about our Cookie Policy, please contact us at{' '}
                    <a href="mailto:privacy@channah.com" className="text-cyan hover:text-cyan-light">
                      privacy@channah.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
