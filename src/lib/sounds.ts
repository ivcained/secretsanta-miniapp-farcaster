"use client";

// Christmas sound effects utility
// Uses Web Audio API for lightweight sound generation

class ChristmasSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Jingle bell sound
  playJingle() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }

  // Success chime (for joining chain, sending gift)
  playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.type = "sine";

        const startTime = ctx.currentTime + i * 0.1;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }

  // Click sound
  playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }

  // Gift unwrap sound
  playUnwrap() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();

      // Create noise for paper rustling effect
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2000, ctx.currentTime);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(ctx.currentTime);
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }

  // Celebration sound (for reveals)
  playCelebration() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();

      // Play ascending arpeggio
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.type = "triangle";

        const startTime = ctx.currentTime + i * 0.08;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }

  // Ho ho ho sound effect
  playHoHoHo() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const hoTimes = [0, 0.25, 0.5];

      hoTimes.forEach((delay) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + delay;
        oscillator.frequency.setValueAtTime(150, startTime);
        oscillator.frequency.linearRampToValueAtTime(100, startTime + 0.15);
        oscillator.type = "sawtooth";

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      });
    } catch (e) {
      console.log("Sound not available:", e);
    }
  }
}

// Singleton instance
export const christmasSounds = new ChristmasSounds();

// Hook for React components
export function useChristmasSounds() {
  return christmasSounds;
}
