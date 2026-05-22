let activeInterval: NodeJS.Timeout | null = null;
let audioCtx: AudioContext | null = null;

export function playAlarmSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Envelope to avoid clicks
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playBeeps = () => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      playTone(1200, now, 0.1, 'square');
      playTone(1200, now + 0.2, 0.1, 'square');
      playTone(1200, now + 0.4, 0.1, 'square');
    };

    // Play immediately
    playBeeps();
    
    // Clear any existing loop and start a new one (every 1.5 seconds)
    if (activeInterval) clearInterval(activeInterval);
    activeInterval = setInterval(playBeeps, 1500);
    
  } catch (e) {
    console.warn("Audio playback failed (interaction required):", e);
  }
}

export function stopAlarmSound() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
}

