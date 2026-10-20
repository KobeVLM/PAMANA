import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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
      const dest = user.role === 'PARENT' ? '/dashboard' : '/home'
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
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white font-black text-lg bg-black/20 hover:bg-black/30 px-4 py-2 rounded-2xl backdrop-blur-sm transition-all"
      >
        <ArrowLeft className="w-6 h-6 stroke-[3]" /> Back
      </button>

      {/* Decorative background clouds/effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md border-4 border-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_12px_0_rgba(0,0,0,0.1)] relative overflow-hidden">
          
          {/* Glossy Top Effect */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-[2.5rem]" />

          <div className="relative z-10">
            {/* Logo - Replaced with S-Logo */}
            <div className="flex flex-col items-center mb-8">
              <img src="/images/S-Logo.png" alt="PAMANA Logo" className="h-20 object-contain drop-shadow-md mb-4" />
              <h1 className="text-3xl font-black text-slate-800">Welcome Back!</h1>
              <p className="text-slate-500 font-bold mt-1">Log in to continue your quest.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm text-slate-600 font-black uppercase tracking-wider ml-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-slate-100 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50]"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm text-slate-600 font-black uppercase tracking-wider ml-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-slate-100 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50] pr-12"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-100 border-2 border-red-300 rounded-xl">
                  <p className="text-red-600 font-bold text-sm text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-b from-[#66BB6A] to-[#4CAF50] text-white py-4 rounded-2xl border-4 border-white shadow-[0_6px_0_#2E7D32] hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none transition-all font-black text-xl tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    LOADING...
                  </span>
                ) : (
                  'LOG IN'
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-slate-500 font-bold mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#4CAF50] font-black hover:text-[#388E3C] hover:underline transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}