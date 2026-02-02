'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Store, Eye, EyeOff, AlertCircle, CheckCircle2, TrendingUp, Wallet, BarChart3, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store'

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  agree_terms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type RegisterForm = z.infer<typeof registerSchema>

const benefits = [
  { icon: TrendingUp, text: 'Reach millions of customers worldwide' },
  { icon: Wallet, text: 'Competitive commission rates' },
  { icon: BarChart3, text: 'Powerful analytics dashboard' },
  { icon: Package, text: 'Easy order management' },
]

export default function VendorRegisterPage() {
  const router = useRouter()
  const { login, isAuthenticated, _hasHydrated } = useAuthStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agree_terms: false,
    },
  })

  const agreeTerms = watch('agree_terms')

  // Redirect if already authenticated
  React.useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, _hasHydrated, router])

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      // Register as vendor via standalone signup endpoint
      const response = await authAPI.registerVendor({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        business_name: data.business_name,
        phone: data.phone,
      })

      // Auto-login: store tokens and user info
      if (response.access_token) {
        localStorage.setItem('vendor_access_token', response.access_token)
        localStorage.setItem('vendor_refresh_token', response.refresh_token)

        login(response.access_token, {
          id: response.user.id,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          role: 'vendor',
          is_active: true,
          created_at: new Date().toISOString(),
          vendor_profile: {
            id: response.user.vendor_id,
            business_name: data.business_name,
            status: response.user.vendor_status || 'pending',
            rating: 0,
            total_sales: 0,
          },
        })
      }

      setSuccess(true)

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.response?.status === 400) {
        if (err.response.data?.detail?.includes('email')) {
          setError('An account with this email already exists')
        } else {
          setError(err.response.data?.detail || 'Registration failed. Please try again.')
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking auth
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your vendor account has been created. Your account is pending admin approval.
              You can start setting up your store while you wait.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-cyan/20 p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center mb-6">
            <Store className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4">
            Start Selling on Channah
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of successful vendors and grow your business with our global marketplace.
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-4 bg-card/50 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">10% commission</span> on each sale.
              No monthly fees, no listing fees. Start selling for free!
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold">Become a Seller</h1>
          </div>

          <Card className="border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Create your vendor account</CardTitle>
              <CardDescription>
                Fill in your details to start selling on Channah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      {...register('first_name')}
                      className={errors.first_name ? 'border-destructive' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-destructive">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      {...register('last_name')}
                      className={errors.last_name ? 'border-destructive' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-destructive">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    placeholder="Your Store Name"
                    {...register('business_name')}
                    className={errors.business_name ? 'border-destructive' : ''}
                  />
                  {errors.business_name && (
                    <p className="text-xs text-destructive">{errors.business_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vendor@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    {...register('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
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
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      {...register('confirm_password')}
                      className={errors.confirm_password ? 'border-destructive pr-10' : 'pr-10'}
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
                  {errors.confirm_password && (
                    <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree_terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setValue('agree_terms', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agree_terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions
                    </label>
                    <p className="text-xs text-muted-foreground">
                      By creating an account, you agree to our{' '}
                      <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                      and{' '}
                      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                  </div>
                </div>
                {errors.agree_terms && (
                  <p className="text-xs text-destructive">{errors.agree_terms.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Vendor Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have a vendor account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
