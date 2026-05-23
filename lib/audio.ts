let activeInterval: NodeJS.Timeout | null = null;
let audioCtx: AudioContext | null = null;

export function initAudio() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("Failed to init audio ctx", e);
  }
}

export function playAlarmSound(soundType = 'beeps') {
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

    const playSoundPattern = () => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      
      if (soundType === 'chimes') {
        playTone(523.25, now, 0.2, 'sine'); // C5
        playTone(659.25, now + 0.2, 0.2, 'sine'); // E5
        playTone(783.99, now + 0.4, 0.4, 'sine'); // G5
      } else if (soundType === 'siren') {
        playTone(800, now, 0.4, 'sawtooth');
        playTone(600, now + 0.4, 0.4, 'sawtooth');
      } else {
        // default beeps
        playTone(1200, now, 0.1, 'square');
        playTone(1200, now + 0.2, 0.1, 'square');
        playTone(1200, now + 0.4, 0.1, 'square');
      }
    };

    // Play immediately
    playSoundPattern();
    
    // Clear any existing loop and start a new one
    if (activeInterval) clearInterval(activeInterval);
    const intervalDuration = soundType === 'chimes' ? 2000 : soundType === 'siren' ? 800 : 1500;
    activeInterval = setInterval(playSoundPattern, intervalDuration);
    
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

