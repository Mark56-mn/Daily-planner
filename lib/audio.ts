export function playAlarmSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Envelope to avoid clicks
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Alarm ringing sequence: digital electronic alarm
    for (let loop = 0; loop < 4; loop++) {
      const offset = loop * 0.8;
      playTone(1200, now + offset, 0.1, 'square');
      playTone(1200, now + offset + 0.2, 0.1, 'square');
      playTone(1200, now + offset + 0.4, 0.1, 'square');
    }
  } catch (e) {
    console.warn("Audio playback failed (interaction required):", e);
  }
}
