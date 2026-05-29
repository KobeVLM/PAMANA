import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Loader2, Users, PlusCircle, ArrowRight, ClipboardCopy } from 'lucide-react'
import api from '@/lib/api'

export const TeacherKlasePage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [klase, setKlase] = useState<{ id: string; name: string; joinCode: string } | null>(null)
  const [klaseName, setKlaseName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchKlase = async () => {
      try {
        const res = await api.get('/klase/teacher')
        setKlase(res.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setKlase(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchKlase()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!klaseName.trim()) return

    setIsCreating(true)
    setError('')
    try {
      const res = await api.post('/klase', { name: klaseName })
      setKlase(res.data)
      // Removed navigate('/dashboard') so the teacher can see the join code!
    } catch (err: any) {
      setError(err.response?.data?.message || 'May error sa paggawa ng klase.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyJoinCode = () => {
    if (klase) {
      navigator.clipboard.writeText(klase.joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-pamana-gold animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto mt-10">
        {!klase ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pamana-gold to-amber-500" />
            <div className="w-20 h-20 bg-pamana-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Users className="w-10 h-10 text-pamana-gold" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Gumawa ng Klase
            </h1>
            <p className="text-green-300 mb-8 max-w-sm mx-auto">
              I-set up ang iyong virtual na silid-aralan para subaybayan ang pag-unlad ng iyong mga mag-aaral.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 max-w-xs mx-auto">
              <div>
                <input
                  type="text"
                  placeholder="Pangalan ng Klase (hal. Grade 1 - Rizal)"
                  value={klaseName}
                  onChange={(e) => setKlaseName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pamana-gold transition-colors text-center"
                  maxLength={50}
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isCreating || !klaseName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Gumawa <PlusCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pamana-green to-emerald-400" />
            <div className="w-20 h-20 bg-pamana-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-pamana-green" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Ang Iyong Klase: <span className="text-pamana-green">{klase.name}</span>
            </h1>
            <p className="text-green-300 mb-8 max-w-md mx-auto">
              Ibigay ang Join Code na ito sa iyong mga mag-aaral para sila ay makasali.
            </p>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col items-center">
              <span className="text-xs text-white/50 uppercase tracking-widest font-bold mb-2">Class Join Code</span>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-mono font-bold text-white tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                  {klase.joinCode}
                </span>
                <button
                  onClick={copyJoinCode}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-white group relative"
                  title="Copy code"
                >
                  <ClipboardCopy className="w-6 h-6" />
                  {copied && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-pamana-green text-white text-xs py-1 px-2 rounded font-bold whitespace-nowrap">
                      Na-copy!
                    </div>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
            >
              Pumunta sa Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
