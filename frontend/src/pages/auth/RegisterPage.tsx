import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-2 text-white font-black text-base md:text-lg bg-black/20 hover:bg-black/30 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl backdrop-blur-sm transition-all"
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" /> Back
      </button>

      {/* Decorative background clouds/effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm md:max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md border-4 border-white rounded-[2rem] p-5 md:p-6 shadow-[0_8px_0_rgba(0,0,0,0.1)] relative overflow-hidden">
          
          {/* Glossy Top Effect */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-[2rem]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-4">
              <img src="/images/S-Logo.png" alt="PAMANA Logo" className="h-12 md:h-14 object-contain drop-shadow-md mb-2" />
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">Join the Quest!</h1>
              <p className="text-slate-500 font-bold text-sm mt-0.5">Create your account to begin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Juan dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50]"
                  disabled={isLoading}
                />
                {errors.name && <p className="text-red-500 font-bold text-[10px] ml-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="reg-email" className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50]"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-red-500 font-bold text-[10px] ml-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="reg-password" className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50] pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 font-bold text-[10px] ml-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="confirm-password" className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50]"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-red-500 font-bold text-[10px] ml-1">{errors.confirmPassword}</p>}
              </div>

              {/* Role Selection */}
              <div className="space-y-1 pt-1">
                <label className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LEARNER', 'PARENT', 'TEACHER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl font-black text-xs transition-all border-2 ${
                        role === r
                          ? "bg-[#FFC107] border-[#FFC107] text-amber-950 shadow-[0_3px_0_#D4A017] scale-[1.02]"
                          : "bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {r === 'LEARNER' ? 'Learner' : r === 'PARENT' ? 'Parent' : 'Teacher'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Code (optional) */}
              {role === 'LEARNER' && (
                <div className="space-y-1 pt-1">
                  <label htmlFor="join-code" className="text-xs text-slate-600 font-black uppercase tracking-wider ml-1 flex items-center gap-1">
                    Class Code <span className="text-slate-400 text-[10px]">(optional)</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </label>
                  <input
                    id="join-code"
                    type="text"
                    placeholder="6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all border-2 border-transparent focus:border-[#4CAF50] font-mono tracking-widest uppercase"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* General error */}
              {errors.general && (
                <div className="p-2 bg-red-100 border-2 border-red-300 rounded-xl">
                  <p className="text-red-600 font-bold text-xs text-center">{errors.general}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-b from-[#66BB6A] to-[#4CAF50] text-white py-3 rounded-xl border-4 border-white shadow-[0_5px_0_#2E7D32] hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none transition-all font-black text-lg tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    REGISTERING...
                  </span>
                ) : (
                  'REGISTER'
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-slate-500 font-bold text-sm mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-[#4CAF50] font-black hover:text-[#388E3C] hover:underline transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}