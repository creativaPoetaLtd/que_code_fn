const STORAGE_KEY = "que_notif_prefs"

export interface NotifPrefs {
  soundEnabled: boolean
  vibrationEnabled: boolean
}

function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return { soundEnabled: true, vibrationEnabled: true }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { soundEnabled: true, vibrationEnabled: true, ...JSON.parse(raw) }
  } catch {
    // ignore parse errors
  }
  return { soundEnabled: true, vibrationEnabled: true }
}

export function savePrefs(prefs: Partial<NotifPrefs>) {
  if (typeof window === "undefined") return
  try {
    const current = loadPrefs()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }))
  } catch {
    // ignore storage errors
  }
}

export function getPrefs(): NotifPrefs {
  return loadPrefs()
}

let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    if (!_ctx || _ctx.state === "closed") {
      const Ctor =
        window.AudioContext ??
        (window as unknown as Record<string, unknown>)["webkitAudioContext"] as typeof AudioContext | undefined
      if (!Ctor) return null
      _ctx = new Ctor()
    }
    return _ctx
  } catch {
    return null
  }
}

function registerUnlockListeners() {
  if (typeof window === "undefined") return

  const unlock = () => {
    const ctx = getCtx()
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => { })
    }
  }

  window.addEventListener("click", unlock, { once: true, capture: true })
  window.addEventListener("touchstart", unlock, { once: true, capture: true })
  window.addEventListener("keydown", unlock, { once: true, capture: true })
  window.addEventListener("pointerdown", unlock, { once: true, capture: true })
}

registerUnlockListeners()


class SoundService {
  playMessageSound() {
    if (!getPrefs().soundEnabled) return
    try {
      const ctx = getCtx()
      if (!ctx) return

      if (ctx.state === "suspended") {
        ctx.resume().then(() => this._ding(ctx)).catch(() => { })
        return
      }

      this._ding(ctx)
    } catch {
      // Silently fail — notification sound is non-critical
    }
  }

  private _ding(ctx: AudioContext) {
    try {
      const t = ctx.currentTime

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.85, t)
      masterGain.connect(ctx.destination)

      const playNote = (freq: number, startAt: number, duration: number) => {
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = "triangle"
        osc1.frequency.setValueAtTime(freq, startAt)
        gain1.gain.setValueAtTime(0, startAt)
        gain1.gain.linearRampToValueAtTime(0.7, startAt + 0.006) // sharp punch
        gain1.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
        osc1.connect(gain1)
        gain1.connect(masterGain)
        osc1.start(startAt)
        osc1.stop(startAt + duration + 0.01)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(freq * 2, startAt)
        gain2.gain.setValueAtTime(0, startAt)
        gain2.gain.linearRampToValueAtTime(0.25, startAt + 0.006)
        gain2.gain.exponentialRampToValueAtTime(0.001, startAt + duration * 0.7)
        osc2.connect(gain2)
        gain2.connect(masterGain)
        osc2.start(startAt)
        osc2.stop(startAt + duration + 0.01)
      }

      playNote(1046, t, 0.18)
      playNote(1318, t + 0.12, 0.22)
    } catch {
      // Ignore — can fail if context was closed mid-play
    }
  }

  vibrate(pattern: number | number[] = [70, 40, 70]) {
    if (!getPrefs().vibrationEnabled) return
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern)
      }
    } catch {
      // Silently fail on unsupported devices
    }
  }
}

export const soundService = new SoundService()
export default soundService
