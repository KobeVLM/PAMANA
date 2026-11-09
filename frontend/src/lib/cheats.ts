import api from './api'

interface UnlockOptions {
  reload?: boolean
  markComplete?: boolean
}

function getAuthUser(): { id: string; name?: string; role?: string } | null {
  try {
    const raw = sessionStorage.getItem('pamana_user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function unlockModule(moduleNumber: number, options: UnlockOptions = { reload: true }): Promise<void> {
  const user = getAuthUser()
  if (!user || !user.id) {
    console.warn(
      '%c[PAMANA CHEAT]%c ⚠️ Hindi ka pa naka-login bilang mag-aaral / You are not logged in. Please log in first.',
      'color: #eab308; font-weight: bold;',
      'color: inherit;'
    )
    return
  }

  if (moduleNumber < 1 || moduleNumber > 4) {
    console.error(
      '%c[PAMANA CHEAT]%c ❌ Invalid module number: ' + moduleNumber + '. Use 1, 2, 3, or 4.',
      'color: #ef4444; font-weight: bold;',
      'color: inherit;'
    )
    return
  }

  console.log(
    `%c[PAMANA CHEAT]%c Unlocking Module ${moduleNumber} for ${user.name || user.id}...`,
    'color: #3b82f6; font-weight: bold;',
    'color: inherit;'
  )

  try {
    const res = await api.post(`/modules/unlock/${user.id}/${moduleNumber}`)
    console.log(
      `%c[PAMANA CHEAT]%c ✅ Tagumpay! Na-unlock na ang Module ${moduleNumber}!\n(Module ${moduleNumber} unlocked successfully!)`,
      'color: #22c55e; font-weight: bold;',
      'color: inherit;',
      res.data
    )

    if (options.reload !== false) {
      console.log('%c[PAMANA CHEAT]%c 🔄 Refreshing page to update map...', 'color: #3b82f6; font-style: italic;', 'color: inherit;')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  } catch (err) {
    console.error(
      `%c[PAMANA CHEAT]%c ❌ Error unlocking Module ${moduleNumber}:`,
      'color: #ef4444; font-weight: bold;',
      'color: inherit;',
      err
    )
  }
}

export async function unlockAllModules(options: UnlockOptions = { reload: true, markComplete: false }): Promise<void> {
  const user = getAuthUser()
  if (!user || !user.id) {
    console.warn(
      '%c[PAMANA CHEAT]%c ⚠️ Hindi ka pa naka-login bilang mag-aaral / You are not logged in. Please log in first.',
      'color: #eab308; font-weight: bold;',
      'color: inherit;'
    )
    return
  }

  console.log(
    `%c[PAMANA CHEAT]%c Unlocking ALL modules for ${user.name || user.id}...`,
    'color: #3b82f6; font-weight: bold;',
    'color: inherit;'
  )

  try {
    const res = await api.post(`/modules/unlock-all/${user.id}`, null, {
      params: { markComplete: options.markComplete ?? false }
    })
    console.log(
      '%c[PAMANA CHEAT]%c ✅ Tagumpay! Na-unlock na ang LAHAT ng modules (1-4)!\n(All modules unlocked successfully!)',
      'color: #22c55e; font-weight: bold;',
      'color: inherit;',
      res.data
    )

    if (options.reload !== false) {
      console.log('%c[PAMANA CHEAT]%c 🔄 Refreshing page to update map...', 'color: #3b82f6; font-style: italic;', 'color: inherit;')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  } catch (err) {
    console.error(
      `%c[PAMANA CHEAT]%c ❌ Error unlocking all modules:`,
      'color: #ef4444; font-weight: bold;',
      'color: inherit;',
      err
    )
  }
}

export function printCheatHelp(): void {
  console.log(
    `%c🎮 PAMANA CHEAT COMMANDS (Para sa mga Na-stuck na Mag-aaral)
%cGamitin ang alinman sa mga sumusunod na commands sa browser console:

  • %cunlockModule(number)%c   - I-unlock ang partikular na module (1, 2, 3, o 4)
  • %cunlockModule1()%c        - I-unlock ang Module 1 (Pantig)
  • %cunlockModule2()%c        - I-unlock ang Module 2 (Salita)
  • %cunlockModule3()%c        - I-unlock ang Module 3 (Talasalitaan)
  • %cunlockModule4()%c        - I-unlock ang Module 4 (Pangungusap)
  • %cunlockAllModules()%c     - I-unlock ang lahat ng modules (Modules 1 - 4)
  • %cunlockAll()%c            - Shortcut para sa unlockAllModules()
  • %cpamana.help()%c          - Ipakita muli ang tulong na ito

Halimbawa: %cunlockModule(2)%c kung na-stuck sa Module 1 at nais magpatuloy sa Module 2.`,
    'color: #f59e0b; font-size: 13px; font-weight: bold;',
    'color: #94a3b8; font-size: 11px;',
    'color: #38bdf8; font-weight: bold;', 'color: inherit;',
    'color: #38bdf8; font-weight: bold;', 'color: inherit;',
    'color: #38bdf8; font-weight: bold;', 'color: inherit;',
    'color: #38bdf8; font-weight: bold;', 'color: inherit;',
    'color: #38bdf8; font-weight: bold;', 'color: inherit;',
    'color: #22c55e; font-weight: bold;', 'color: inherit;',
    'color: #22c55e; font-weight: bold;', 'color: inherit;',
    'color: #e2e8f0; font-weight: bold;', 'color: inherit;',
    'color: #a855f7; font-weight: bold;', 'color: inherit;'
  )
}

export function setupCheats(): void {
  if (typeof window === 'undefined') return

  const unlockMod = (num: number, opts?: UnlockOptions) => unlockModule(num, opts)
  const unlockMod1 = (opts?: UnlockOptions) => unlockModule(1, opts)
  const unlockMod2 = (opts?: UnlockOptions) => unlockModule(2, opts)
  const unlockMod3 = (opts?: UnlockOptions) => unlockModule(3, opts)
  const unlockMod4 = (opts?: UnlockOptions) => unlockModule(4, opts)
  const unlockAll = (opts?: UnlockOptions) => unlockAllModules(opts)

  // Attach directly to window for easiest typing in DevTools console
  window.unlockModule = unlockMod
  window.unlockModule1 = unlockMod1
  window.unlockModule2 = unlockMod2
  window.unlockModule3 = unlockMod3
  window.unlockModule4 = unlockMod4
  window.unlockAllModules = unlockAll
  window.unlockAll = unlockAll

  // Namespace object
  const pamanaCheat = {
    unlockModule: unlockMod,
    unlockModule1: unlockMod1,
    unlockModule2: unlockMod2,
    unlockModule3: unlockMod3,
    unlockModule4: unlockMod4,
    unlockAllModules: unlockAll,
    unlockAll: unlockAll,
    unlock: unlockMod,
    help: printCheatHelp,
  }

  window.pamana = pamanaCheat
  window.cheat = pamanaCheat

  // Announce availability in console
  printCheatHelp()
}

// Global TypeScript declarations
declare global {
  interface Window {
    unlockModule: (moduleNumber: number, options?: UnlockOptions) => Promise<void>
    unlockModule1: (options?: UnlockOptions) => Promise<void>
    unlockModule2: (options?: UnlockOptions) => Promise<void>
    unlockModule3: (options?: UnlockOptions) => Promise<void>
    unlockModule4: (options?: UnlockOptions) => Promise<void>
    unlockAllModules: (options?: UnlockOptions) => Promise<void>
    unlockAll: (options?: UnlockOptions) => Promise<void>
    pamana: Record<string, unknown>
    cheat: Record<string, unknown>
  }
}
