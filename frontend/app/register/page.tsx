'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Bot, ArrowRight, ShieldCheck, CheckCircle2, Store, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Password strength checker
  const getPasswordStrength = () => {
    const { password } = formData
    if (!password) return { strength: 0, label: '' }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-cyan', 'bg-green-500']
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const passwordStrength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Validate password requirements
    const password = formData.password
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    setIsLoading(true)

    try {
      const { data } = await authAPI.register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
      })
      // Django returns 'access' and 'refresh', not 'access_token' and 'refresh_token'
      login(data.user, data.access || data.access_token, data.refresh || data.refresh_token)
      router.push('/')
    } catch (err: any) {
      console.error('Registration error:', err.response?.data)
      // Extract error message from various possible formats
      let errorMessage = 'Registration failed. Please try again.'

      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors
          const firstError = errorData.detail[0]
          if (firstError?.msg) {
            errorMessage = firstError.msg.replace('Value error, ', '')
          }
        } else if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - AI Feature Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute top-20 left-10 h-80 w-80 rounded-full bg-cyan/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-cyan-dark/30 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            {/* Main illustration */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-cyan/30 rounded-3xl blur-2xl animate-pulse" />
              <div className="relative p-8 rounded-3xl bg-navy/50 backdrop-blur-sm border border-cyan/30">
                <div className="flex items-center justify-center gap-4">
                  <Store className="h-12 w-12 text-cyan" />
                  <ArrowRight className="h-6 w-6 text-cyan/50" />
                  <Package className="h-12 w-12 text-cyan" />
                  <ArrowRight className="h-6 w-6 text-cyan/50" />
                  <TrendingUp className="h-12 w-12 text-cyan" />
                </div>
                <Sparkles className="absolute top-3 right-3 h-5 w-5 text-cyan-light animate-pulse" />
              </div>
            </div>

            <div>
              <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Join 50,000+ Users
              </Badge>
              <h2 className="text-3xl font-bold font-display mb-4">
                Start Your Journey
              </h2>
              <p className="text-white/70 leading-relaxed">
                Create your free account and unlock a world of possibilities. Buy from sellers worldwide, or start your own business.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-cyan flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">AI-Powered Shopping</h3>
                  <p className="text-xs text-white/60">Smart recommendations just for you</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-cyan flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Global Marketplace</h3>
                  <p className="text-xs text-white/60">Access products from 190+ countries</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-cyan flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Secure Transactions</h3>
                  <p className="text-xs text-white/60">100% buyer and seller protection</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-cyan flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Become a Seller</h3>
                  <p className="text-xs text-white/60">Start your online business today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-cyan-light text-navy font-bold shadow-lg shadow-cyan/20">
                <span className="text-2xl font-display">C</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold font-display text-gradient-premium">Channah</span>
                <span className="text-[10px] font-semibold text-cyan uppercase tracking-wider -mt-1">Global Marketplace</span>
              </div>
            </Link>
            <h1 className="text-3xl font-bold font-display">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              Join Channah and start shopping worldwide
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                    placeholder="Create a strong password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Password strength: <span className={passwordStrength.strength >= 4 ? 'text-cyan' : ''}>{passwordStrength.label}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                        {formData.password.length >= 8 ? '✓' : '○'} 8+ characters
                      </span>
                      <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase
                      </span>
                      <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>
                        {/[a-z]/.test(formData.password) ? '✓' : '○'} Lowercase
                      </span>
                      <span className={/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>
                        {/[0-9]/.test(formData.password) ? '✓' : '○'} Number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-border bg-card checked:bg-cyan checked:border-cyan"
                required
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-cyan hover:text-cyan-light transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-cyan hover:text-cyan-light transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-semibold shadow-lg shadow-cyan/20 hover:shadow-xl hover:shadow-cyan/30 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
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
            Already have an account?{' '}
            <Link href="/login" className="text-cyan hover:text-cyan-light font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <div className="pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Want to sell on Channah?{' '}
              <Link href="/seller/register" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                Become a Seller
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
