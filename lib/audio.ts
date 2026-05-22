export function playAlarmSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Envelope to avoid clicks
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Alarm ringing sequence (short beeps)
    for (let loop = 0; loop < 3; loop++) {
      const offset = loop * 1.0;
      playTone(880, now + offset, 0.15);
      playTone(880, now + offset + 0.25, 0.15);
      playTone(1046, now + offset + 0.5, 0.25);
    }
  } catch (e) {
    console.warn("Audio playback failed (interaction required):", e);
  }
}
