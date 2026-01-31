'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, useReducer, type ReactNode } from 'react'

type PageHeaderState = {
  title: string
  description?: string
  backHref?: string
}

type PageHeaderContextValue = {
  state: PageHeaderState
  set: (partial: Partial<PageHeaderState>) => void
  actionsRef: React.RefObject<ReactNode | undefined>
  /** Bumps a counter so LayoutPageHeader re-reads actionsRef */
  notifyActions: () => void
  /** Subscribe to action changes (used by LayoutPageHeader) */
  subscribeActions: (cb: () => void) => () => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageHeaderState>({ title: '' })
  const actionsRef = useRef<ReactNode | undefined>(undefined)
  const listenersRef = useRef(new Set<() => void>())

  const set = useCallback((partial: Partial<PageHeaderState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  const notifyActions = useCallback(() => {
    listenersRef.current.forEach(cb => cb())
  }, [])

  const subscribeActions = useCallback((cb: () => void) => {
    listenersRef.current.add(cb)
    return () => { listenersRef.current.delete(cb) }
  }, [])

  return (
    <PageHeaderContext.Provider value={{ state, set, actionsRef, notifyActions, subscribeActions }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function useCtx() {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) throw new Error('usePageHeader must be used within PageHeaderProvider')
  return ctx
}

/** Used by LayoutPageHeader to read title/description/backHref */
export function usePageHeader() {
  return useCtx().state
}

/** Used by LayoutPageHeader to subscribe to action changes and read actions */
export function usePageHeaderActions() {
  const { actionsRef, subscribeActions } = useCtx()
  const [, forceRender] = useReducer(x => x + 1, 0)

  useEffect(() => {
    return subscribeActions(forceRender)
  }, [subscribeActions])

  return actionsRef.current
}

/** Pages call this to set title/description/backHref */
export function useSetPageHeader(opts: { title: string; description?: string; backHref?: string }) {
  const { set, actionsRef, notifyActions } = useCtx()
  useEffect(() => {
    set(opts)
    return () => {
      set({ title: '', description: undefined, backHref: undefined })
      actionsRef.current = undefined
      notifyActions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.title, opts.description, opts.backHref, set, actionsRef, notifyActions])
}

/** Pages call this to set action buttons in the header */
export function useHeaderActions(actions: ReactNode) {
  const { actionsRef, notifyActions } = useCtx()
  actionsRef.current = actions
  useEffect(() => {
    notifyActions()
  })
}
