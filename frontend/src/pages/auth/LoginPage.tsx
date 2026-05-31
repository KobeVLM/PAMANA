import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      const dest = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail'
      navigate(dest, { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Punan ang lahat ng patlang.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await login(email, password)
      // AuthContext will update user, useEffect above will redirect
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'Mali ang email o password. Subukan ulit.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <Link 
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
        aria-label="Bumalik sa Landing Page"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-medium hidden sm:inline">Bumalik</span>
      </Link>

      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pamana-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pamana-green/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 flex items-center justify-center mb-2 animate-float overflow-hidden rounded-full p-2 bg-green-500/10 backdrop-blur-sm border border-white/20">
              <img src="/images/Logo1.png" alt="PAMANA Logo" className="w-full h-full object-cover rounded-full drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-white">PAMANA</h1>
            <p className="text-green-300 text-sm mt-1">Mag-login sa iyong account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-200 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="halimbawa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-200 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ilagay ang iyong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl pr-12"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-pamana-green to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base rounded-xl shadow-lg shadow-green-900/50 transition-all duration-200 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Naglo-load...
                </span>
              ) : (
                'Mag-login'
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-green-300 text-sm mt-6">
            Wala pang account?{' '}
            <Link to="/register" className="text-pamana-gold font-semibold hover:underline">
              Magrehistro dito
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
