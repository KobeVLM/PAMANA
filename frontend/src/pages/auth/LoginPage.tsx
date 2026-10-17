import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const state = location.state as { registeredEmail?: string; registeredPassword?: string } | null

  const [email, setEmail] = useState(state?.registeredEmail || '')
  const [password, setPassword] = useState(state?.registeredPassword || '')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      const dest = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/home'
      navigate(dest, { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await login(email, password)
      // AuthContext will update user, useEffect above will redirect
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f14] via-[#0d2b1e] to-[#0a2418] flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <Link 
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-[#B8E8C8]/70 hover:text-[#FEFCF3] transition-colors p-2 rounded-full hover:bg-[#50C878]/10"
        aria-label="Back to Landing Page"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-medium hidden sm:inline">Back</span>
      </Link>

      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#50C878]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#B8E8C8]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#FEFCF3]/5 backdrop-blur-2xl border border-[#B8E8C8]/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 flex items-center justify-center mb-2 animate-float overflow-hidden rounded-full p-2 bg-[#50C878]/15 backdrop-blur-sm border border-[#50C878]/30">
              <img src="/images/Logo1.png" alt="PAMANA Logo" className="w-full h-full object-cover rounded-full drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-[#FEFCF3]">PAMANA</h1>
            <p className="text-[#B8E8C8] text-sm mt-1">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#B8E8C8] font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-[#FEFCF3]/10 border-[#B8E8C8]/20 text-[#FEFCF3] placeholder:text-[#B8E8C8]/40 focus:border-[#50C878] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#B8E8C8] font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-[#FEFCF3]/10 border-[#B8E8C8]/20 text-[#FEFCF3] placeholder:text-[#B8E8C8]/40 focus:border-[#50C878] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl pr-12"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8E8C8]/50 hover:text-[#FEFCF3]/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#50C878] to-[#3da860] hover:from-[#6ddb92] hover:to-[#50C878] text-[#0a1f14] font-bold text-base rounded-xl shadow-lg shadow-[#50C878]/30 transition-all duration-200 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-[#B8E8C8] text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#50C878] font-semibold hover:text-[#6ddb92] hover:underline transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}