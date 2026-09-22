import { createContext, useContext } from 'react'
export const NotifyContext = createContext<(message: string) => void>(() => {})
export const useNotify = () => useContext(NotifyContext)
