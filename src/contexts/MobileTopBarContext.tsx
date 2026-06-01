import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface TopBarState {
  title?: string
  backLabel?: string
  backPath?: string
  onBack?: () => void
}

interface MobileTopBarContextValue {
  state: TopBarState
  setTopBar: (s: TopBarState) => void
  resetTopBar: () => void
}

const MobileTopBarContext = createContext<MobileTopBarContextValue | null>(null)

export function MobileTopBarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TopBarState>({})
  const setTopBar  = useCallback((s: TopBarState) => setState(s), [])
  const resetTopBar = useCallback(() => setState({}), [])
  return (
    <MobileTopBarContext.Provider value={{ state, setTopBar, resetTopBar }}>
      {children}
    </MobileTopBarContext.Provider>
  )
}

export function useMobileTopBar() {
  const ctx = useContext(MobileTopBarContext)
  if (!ctx) throw new Error('useMobileTopBar must be used inside MobileTopBarProvider')
  return ctx
}
