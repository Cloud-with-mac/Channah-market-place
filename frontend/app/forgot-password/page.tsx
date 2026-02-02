'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authAPI.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err: any) {
      // For security, show success even if email doesn't exist
      // This prevents email enumeration attacks
      if (err.response?.status === 404 || err.response?.status === 400) {
        setIsSubmitted(true)
      } else {
        setError(err.response?.data?.detail || 'Failed to send reset email. Please try again.')
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
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold font-display text-gradient-premium">Channah</span>
                <span className="text-[10px] font-semibold text-cyan uppercase tracking-wider -mt-1">The Trusted Center for Everything</span>
              </div>
            </Link>
            <Badge className="bg-cyan/10 text-cyan border border-cyan/30 px-4 py-1">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              Customer Portal
            </Badge>
          </div>

          {!isSubmitted ? (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold font-display">Forgot Password?</h1>
                <p className="text-muted-foreground mt-2">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

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

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-semibold shadow-lg shadow-cyan/20"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display mb-2">Check Your Email</h2>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-cyan hover:text-cyan-light font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-cyan/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-cyan-dark/30 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-cyan/30 rounded-2xl blur-2xl animate-pulse" />
              <div className="relative p-6 rounded-2xl bg-navy/50 backdrop-blur-sm border border-cyan/30">
                <ShoppingBag className="h-16 w-16 text-cyan mx-auto" />
                <Sparkles className="absolute top-3 right-3 h-5 w-5 text-cyan-light animate-pulse" />
              </div>
            </div>

            <div>
              <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Customer Portal
              </Badge>
              <h2 className="text-3xl font-bold font-display mb-4">
                Shop Worldwide
              </h2>
              <p className="text-white/70 leading-relaxed">
                Access millions of products from trusted sellers around the globe. Secure payments, fast shipping, and 24/7 support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
