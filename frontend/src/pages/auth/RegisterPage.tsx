import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Sparkles, Loader2, Info } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    if (user) {
      navigate('/trail', { replace: true })
    }
  }, [user, navigate])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Kailangan ang pangalan.'
    if (!email.trim()) newErrors.email = 'Kailangan ang email.'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Hindi valid ang email.'
    if (!password) newErrors.password = 'Kailangan ang password.'
    else if (password.length < 6) newErrors.password = 'Kailangan ng 6 na karakter o higit.'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Hindi magkapantay ang mga password.'
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
      await register(name.trim(), email.trim(), password, joinCode || undefined)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message ?? 'May error. Subukan ulit.'
      setErrors({ general: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pamana-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pamana-green/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pamana-gold to-pamana-amber flex items-center justify-center shadow-lg mb-3 animate-float">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">Sumali sa PAMANA</h1>
            <p className="text-green-300 text-sm mt-1">Simulan ang iyong paglalakbay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-green-200 font-medium text-sm">Pangalan</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl"
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
                placeholder="halimbawa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl"
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
                  placeholder="Hindi bababa sa 6 na karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl pr-12"
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
              <Label htmlFor="confirm-password" className="text-green-200 font-medium text-sm">Kumpirmasyon ng Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulitin ang password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl"
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-red-300 text-xs">{errors.confirmPassword}</p>}
            </div>

            {/* Join Code (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="join-code" className="text-green-200 font-medium text-sm flex items-center gap-1.5">
                Klase Code
                <span className="text-green-400 text-xs font-normal">(opsyonal)</span>
                <Info className="w-3.5 h-3.5 text-green-400" />
              </Label>
              <Input
                id="join-code"
                type="text"
                placeholder="6-digit na code mula sa guro"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl font-mono tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

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
                  Nagre-rehistro...
                </span>
              ) : (
                'Magrehistro'
              )}
            </Button>
          </form>

          <p className="text-center text-green-300 text-sm mt-5">
            May account na?{' '}
            <Link to="/login" className="text-pamana-gold font-semibold hover:underline">
              Mag-login dito
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
