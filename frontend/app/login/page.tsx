'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Sparkles, Bot, ArrowRight, ShieldCheck, Zap, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect)
    }
  }, [isAuthenticated, redirect, router])

  if (isAuthenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await authAPI.login(email, password) as any
      const user = data.user
      const accessToken = data.access || data.access_token
      const refreshToken = data.refresh || data.refresh_token

      if (!user || !accessToken) {
        setError('Invalid response from server. Please try again.')
        return
      }

      // Check if user is a vendor trying to login as customer
      const isVendor = user?.is_vendor || user?.role === 'vendor' || user?.role === 'seller'

      // Login the user
      login(user, accessToken, refreshToken)

      // If user is a vendor, suggest they use vendor portal but still allow access
      if (isVendor && redirect === '/') {
        // Show a notification or redirect to vendor dashboard
        router.push('/vendor/dashboard')
      } else {
        router.push(redirect)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      // Handle different error types
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Connection timeout. Please check if the server is running.')
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-cyan-light text-navy font-bold shadow-lg shadow-cyan/20">
                <span className="text-2xl font-display">C</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold font-display text-gradient-premium">Vendora</span>
                <span className="text-[10px] font-semibold text-cyan uppercase tracking-wider -mt-1">Global Marketplace</span>
              </div>
            </Link>

            {/* Customer Badge */}
            <Badge className="mb-4 bg-cyan/10 text-cyan border border-cyan/30 px-4 py-1">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              Customer Portal
            </Badge>

            <h1 className="text-3xl font-bold font-display">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to continue shopping worldwide
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-card checked:bg-cyan checked:border-cyan" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-cyan hover:text-cyan-light transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-semibold shadow-lg shadow-cyan/20 hover:shadow-xl hover:shadow-cyan/30 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button" className="h-12 border-border hover:border-cyan hover:bg-cyan/5">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" type="button" className="h-12 border-border hover:border-cyan hover:bg-cyan/5">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-cyan hover:text-cyan-light font-medium transition-colors">
              Sign up for free
            </Link>
          </p>

          <div className="pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Want to sell on Vendora?{' '}
              <Link href="/seller/login" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                Seller Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - AI Feature Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-cyan/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-cyan-dark/30 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          {/* AI Assistant Preview */}
          <div className="max-w-md text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-cyan/30 rounded-2xl blur-2xl animate-pulse" />
              <div className="relative p-6 rounded-2xl bg-navy/50 backdrop-blur-sm border border-cyan/30">
                <Bot className="h-16 w-16 text-cyan mx-auto" />
                <Sparkles className="absolute top-3 right-3 h-5 w-5 text-cyan-light animate-pulse" />
              </div>
            </div>

            <div>
              <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <h2 className="text-3xl font-bold font-display mb-4">
                Meet Vendora AI
              </h2>
              <p className="text-white/70 leading-relaxed">
                Your intelligent shopping assistant. Get personalized recommendations, compare products, find the best deals, and shop smarter.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <Zap className="h-6 w-6 text-cyan mb-2" />
                <h3 className="font-semibold text-sm">Smart Search</h3>
                <p className="text-xs text-white/60">Find exactly what you need</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <Globe className="h-6 w-6 text-cyan mb-2" />
                <h3 className="font-semibold text-sm">Global Shipping</h3>
                <p className="text-xs text-white/60">Deliver to 190+ countries</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <ShieldCheck className="h-6 w-6 text-cyan mb-2" />
                <h3 className="font-semibold text-sm">Secure Payments</h3>
                <p className="text-xs text-white/60">100% buyer protection</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <Sparkles className="h-6 w-6 text-cyan mb-2" />
                <h3 className="font-semibold text-sm">AI Deals</h3>
                <p className="text-xs text-white/60">Personalized offers</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan">10K+</p>
                <p className="text-xs text-white/60">Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan">500+</p>
                <p className="text-xs text-white/60">Sellers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan">50K+</p>
                <p className="text-xs text-white/60">Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
