import { useEffect, useState } from 'react'

type Listener = (msg: string) => void
const listeners = new Set<Listener>()

export function toast(msg: string) {
  listeners.forEach((l) => l(msg))
}

export function useToastMessage(): string | null {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let timer: number | undefined
    const listener: Listener = (m) => {
      setMsg(m)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMsg(null), 2200)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      window.clearTimeout(timer)
    }
  }, [])
  return msg
}
