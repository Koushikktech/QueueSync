// Web Audio API notification sound generator

class NotificationSound {
  private audioContext: AudioContext | null = null
  
  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
    }
  }

  async play() {
    if (!this.audioContext) return

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create a pleasant notification sound (two-tone chime)
      this.playTone(800, 0.1, 0.3) // First tone
      setTimeout(() => {
        this.playTone(1000, 0.1, 0.3) // Second tone
      }, 150)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  private playTone(frequency: number, duration: number, volume: number) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = 'sine'
    
    // Create a smooth envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }
}

export const notificationSound = new NotificationSound()