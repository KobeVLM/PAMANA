import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { LeaderboardEntry } from '@/types'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { cn } from '@/lib/utils'
import { Trophy, Wifi, WifiOff, Users, Hash } from 'lucide-react'

const MODULE_NAMES = ['', 'Pakinggan at Kilalanin', 'Basahin (Katawan)', 'Salitang Pamilya', 'Pangungusap']
const RANK_MEDALS = ['🥇', '🥈', '🥉']

export const KlaseLeaderboardPage: React.FC = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const stompRef = useRef<Client | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      let klaseId = user?.klaseId;
      
      // If teacher, dynamically get their klase ID from the backend first
      if (user?.role === 'TEACHER') {
        const teacherKlaseRes = await api.get('/klase/teacher');
        klaseId = teacherKlaseRes.data.id;
      }

      if (!klaseId && user?.role !== 'TEACHER') return;

      const res = await api.get(`/klase/${klaseId}/leaderboard`)
      setLeaderboard(res.data)
      setLastUpdated(new Date())
    } catch {
      // silent fail
    }
  }, [user?.klaseId, user?.role])

  // WebSocket subscription
  useEffect(() => {
    let activeKlaseId = user?.klaseId;

    const setupSocket = async () => {
      if (user?.role === 'TEACHER') {
        try {
          const teacherKlaseRes = await api.get('/klase/teacher');
          activeKlaseId = teacherKlaseRes.data.id;
        } catch {
          setIsLoading(false);
          return; // No class created yet
        }
      }

      if (!activeKlaseId) {
        setIsLoading(false);
        return;
      }

      await fetchLeaderboard()
      setIsLoading(false)

      const client = new Client({
        webSocketFactory: () => new SockJS('/ws-leaderboard'),
        onConnect: () => {
          setIsConnected(true)
          client.subscribe(`/topic/leaderboard/${activeKlaseId}`, () => {
            fetchLeaderboard()
          })
        },
        onDisconnect: () => setIsConnected(false),
        reconnectDelay: 3000,
      })

      client.activate()
      stompRef.current = client
    }

    setupSocket();

    return () => {
      stompRef.current?.deactivate()
    }
  }, [user?.klaseId, user?.role, fetchLeaderboard])

  const handleJoinKlase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim() || joinCode.length !== 6) {
      setJoinError('Kailangan ng 6-digit na code.')
      return
    }
    setJoinLoading(true)
    setJoinError('')
    try {
      const res = await api.post(`/klase/join?joinCode=${joinCode}`)
      
      // Update local storage so the reload picks up the real klaseId
      const storedUser = sessionStorage.getItem('pamana_user')
      if (storedUser) {
        const userObj = JSON.parse(storedUser)
        userObj.klaseId = res.data.klaseId 
        sessionStorage.setItem('pamana_user', JSON.stringify(userObj))
      }

      window.location.reload() // Refresh to get klaseId
    } catch {
      setJoinError('Hindi natagpuan ang klase. Suriin ang code at subukan ulit.')
    } finally {
      setJoinLoading(false)
    }
  }

  // If user hasn't joined a klase yet (and is NOT a teacher)
  if (user?.role !== 'TEACHER' && !user?.klaseId) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8 max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-heading font-bold text-white mb-1">Klase Mode 🏫</h1>
            <p className="text-green-300 text-sm">Makiisa sa klase para makita ang leaderboard!</p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-pamana-green/20 flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-pamana-green" />
              </div>
              <h2 className="text-white font-bold text-lg">Sumali sa Klase</h2>
              <p className="text-green-300 text-sm mt-1">Humingi ng code mula sa iyong guro.</p>
            </div>

            <form onSubmit={handleJoinKlase} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pamana-gold rounded-xl pl-9 font-mono text-center text-xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                {joinError && <p className="text-red-300 text-xs">{joinError}</p>}
              </div>
              <Button
                type="submit"
                disabled={joinLoading}
                className="w-full h-11 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl"
              >
                {joinLoading ? 'Sinusuri...' : 'Sumali sa Klase'}
              </Button>
            </form>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white mb-1">
              <Trophy className="inline w-6 h-6 text-pamana-gold mr-2" />
              Klase Leaderboard
            </h1>
            <p className="text-green-300 text-sm">
              {lastUpdated && `Na-update: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <Badge
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5',
              isConnected
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
            )}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Live' : 'Naka-disconnect'}
          </Badge>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16 text-green-300">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Walang miyembro pa ang klase.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?.id
              const medal = RANK_MEDALS[entry.rank - 1] ?? null

              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300',
                    isCurrentUser
                      ? 'bg-pamana-gold/10 border-pamana-gold/30 shadow-lg shadow-pamana-gold/10'
                      : 'bg-white/10 border-white/20'
                  )}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {medal ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      <span className="text-white/50 font-bold text-lg">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                    isCurrentUser
                      ? 'bg-gradient-to-br from-pamana-gold to-amber-500 text-white'
                      : 'bg-gradient-to-br from-pamana-green to-emerald-400 text-white'
                  )}>
                    {entry.learnerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Module */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-semibold text-sm truncate',
                        isCurrentUser ? 'text-pamana-gold' : 'text-white'
                      )}>
                        {entry.learnerName}
                        {isCurrentUser && <span className="ml-1 text-xs opacity-70">(Ikaw)</span>}
                      </p>
                    </div>
                    <p className="text-green-400 text-xs truncate">
                      {MODULE_NAMES[entry.modulesCompleted] ?? 'Nagsisimula pa lamang'}
                    </p>
                  </div>

                  {/* Modules completed */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-bold text-lg">{entry.modulesCompleted}</div>
                    <div className="text-green-400 text-xs">Module</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Live update notice */}
        {isConnected && (
          <p className="text-center text-green-400/50 text-xs mt-4">
            Awtomatikong ina-update kapag nagbago ang leaderboard 🔄
          </p>
        )}
      </div>
    </AppShell>
  )
}
