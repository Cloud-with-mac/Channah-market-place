'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Lock, CheckCircle2, ShoppingBag, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { authAPI } from '@/lib/api'

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
})

type ResetFormData = z.infer<typeof resetSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [token])

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await authAPI.resetPassword({
        token,
        password: data.password,
        password_confirm: data.password_confirm,
      })
      setIsSuccess(true)
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.token?.[0]
      setError(detail || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">Invalid Link</h2>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Button asChild>
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">Password Reset!</h2>
          <p className="text-muted-foreground">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold font-display">Reset Password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password_confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="pl-10 pr-10"
              {...register('password_confirm')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password_confirm && (
            <p className="text-sm text-destructive">{errors.password_confirm.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-semibold shadow-lg shadow-cyan/20"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
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
              Secure Reset
            </Badge>
          </div>

          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
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
                <Lock className="h-16 w-16 text-cyan mx-auto" />
                <Sparkles className="absolute top-3 right-3 h-5 w-5 text-cyan-light animate-pulse" />
              </div>
            </div>

            <div>
              <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Secure
              </Badge>
              <h2 className="text-3xl font-bold font-display mb-4">
                Password Security
              </h2>
              <p className="text-white/70 leading-relaxed">
                Create a strong password to keep your account secure. Use a mix of letters, numbers, and symbols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
