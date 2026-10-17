import React, { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'pamana_show_english'

interface LanguageContextType {
  /** Show the English translation line under Filipino text (default true). */
  showEnglish: boolean
  setShowEnglish: (value: boolean) => void
}

const LanguageContext = createContext<LanguageContextType>({
  showEnglish: true,
  setShowEnglish: () => {},
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showEnglish, setShowEnglishState] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  })

  const setShowEnglish = useCallback((value: boolean) => {
    setShowEnglishState(value)
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
    window.dispatchEvent(new Event('pamana_settings_changed'))
  }, [])

  return (
    <LanguageContext.Provider value={{ showEnglish, setShowEnglish }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
