import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, Info, ArrowLeft } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'LEARNER' | 'PARENT' | 'TEACHER'>('LEARNER')
  const [joinCode, setJoinCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    if (user) {
      const dest = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail'
      navigate(dest, { replace: true })
    }
  }, [user, navigate])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required.'
    if (!email.trim()) newErrors.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address.'
    if (!password) newErrors.password = 'Password is required.'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setIsLoading(true)
    setErrors({})
    try {
      localStorage.setItem('show_intro_story', 'true')
      await register(name.trim(), email.trim(), password, role, joinCode || undefined)
      navigate('/login', { state: { registeredEmail: email.trim(), registeredPassword: password } })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message ?? 'An error occurred. Please try again.'
      setErrors({ general: msg })
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
        aria-label="Back to Landing Page"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-medium hidden sm:inline">Back</span>
      </Link>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pamana-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pamana-green/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 flex items-center justify-center mb-1 animate-float overflow-hidden rounded-full p-2 bg-green-500/10 backdrop-blur-sm border border-white/20">
              <img src="/images/Logo1.png" alt="PAMANA Logo" className="w-full h-full object-cover rounded-full drop-shadow-2xl" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">PAMANA</h1>
            <p className="text-green-300 text-sm mt-1">Start your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-green-200 font-medium text-sm">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-300 text-xs">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-green-200 font-medium text-sm">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-green-200 font-medium text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-300 text-xs">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-green-200 font-medium text-sm">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-red-300 text-xs">{errors.confirmPassword}</p>}
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label className="text-green-200 font-medium text-sm">Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['LEARNER', 'PARENT', 'TEACHER'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-10 text-xs font-bold rounded-xl transition-all ${
                      role === r
                        ? 'bg-pamana-gold text-green-950 shadow-md scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {r === 'LEARNER' ? 'Learner' : r === 'PARENT' ? 'Parent' : 'Teacher'}
                  </button>
                ))}
              </div>
            </div>

            {/* Join Code (optional) */}
            {role === 'LEARNER' && (
              <div className="space-y-1.5">
                <Label htmlFor="join-code" className="text-green-200 font-medium text-sm flex items-center gap-1.5">
                  Class Code
                  <span className="text-green-400 text-xs font-normal">(optional)</span>
                  <Info className="w-3.5 h-3.5 text-green-400" />
                </Label>

                <Input
                  id="join-code"
                  type="text"
                  placeholder="6-digit code from your teacher"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-lime-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl font-mono tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* General error */}
            {errors.general && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                <p className="text-red-300 text-sm text-center">{errors.general}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-pamana-green to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base rounded-xl shadow-lg shadow-green-900/50 transition-all duration-200 active:scale-95 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <p className="text-center text-green-300 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-pamana-gold font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}