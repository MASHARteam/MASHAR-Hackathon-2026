import React, { useRef, useEffect, useState } from 'react';
import { UserLevel } from '../types';
import { Volume2, VolumeX, Mic, MicOff, Activity, HelpCircle, AlertCircle, RefreshCw, Sparkles, Play, Square, Music, Sliders } from 'lucide-react';

interface MusicSimulatorProps {
  level: UserLevel;
}

export default function MusicSimulator({ level }: MusicSimulatorProps) {
  // Sound Synthesis & Chord States
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [instrumentTab, setInstrumentTab] = useState<'concepts' | 'guitar' | 'flute' | 'drum'>('concepts');
  const [guitarType, setGuitarType] = useState<'classical' | 'electric'>('classical');
  const [hearingPathTab, setHearingPathTab] = useState<'tympanic' | 'bone_conduction'>('tympanic');

  // New Wind Instrument States (Requirement 5)
  const [selectedWindInstrument, setSelectedWindInstrument] = useState<'recorder' | 'concert_flute' | 'clarinet' | 'trumpet'>('recorder');
  const [windHoles, setWindHoles] = useState<boolean[]>([true, true, true, true, false, false]); // 6 holes
  const [windValves, setWindValves] = useState<boolean[]>([false, false, false]); // 3 trumpet valves
  const [isBlowingWind, setIsBlowingWind] = useState<boolean>(false);
  const [windMatchAlert, setWindMatchAlert] = useState<string | null>(null);

  // Violin Mode state (Requirement 7)
  const [violinMode, setViolinMode] = useState<boolean>(false);

  // Mic canvas hover ref (Requirement 1)
  const micHoverXRef = useRef<number | null>(null);
  const [isHoveringMic, setIsHoveringMic] = useState<boolean>(false);

  // Mic analysis states
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [harmonicPurity, setHarmonicPurity] = useState<'pure' | 'harmonic_rich' | 'silent'>('silent');
  const [micError, setMicError] = useState<string | null>(null);

  // Recording and playback states (Replay feature)
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const replaySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Interactive Glossary (Concepts tab) States
  const [selectedConcept, setSelectedConcept] = useState<'sound' | 'note' | 'scale' | 'octave' | 'tone' | 'quarter_tone'>('sound');
  const [conceptBaseFreq, setConceptBaseFreq] = useState<number>(220); // 220Hz (A3)
  const [conceptIntervalType, setConceptIntervalType] = useState<'unison' | 'octave' | 'tone' | 'quarter_tone'>('octave');
  const [isConceptPlaying, setIsConceptPlaying] = useState<boolean>(false);
  const conceptOscRef = useRef<{ base: OscillatorNode | null; interval: OscillatorNode | null }>({ base: null, interval: null });
  const conceptGainRef = useRef<{ base: GainNode | null; interval: GainNode | null }>({ base: null, interval: null });
  const conceptCanvasRef = useRef<HTMLCanvasElement>(null);

  // Physical Guitar Pluck Lab States (Requirement 3)
  const [pluckLength, setPluckLength] = useState<number>(65); // 65 cm
  const [pluckTension, setPluckTension] = useState<number>(80); // 80 N
  const [pluckDensity, setPluckDensity] = useState<number>(3.0); // 3.0 g/m
  const [pluckPosition, setPluckPosition] = useState<number>(0.25); // Pluck ratio
  const [isPluckedVibrating, setIsPluckedVibrating] = useState<boolean>(false);
  const [showConstituentsInPluck, setShowConstituentsInPluck] = useState<boolean>(true);

  const pluckCanvasRef = useRef<HTMLCanvasElement>(null);
  const pluckAudioNodesRef = useRef<OscillatorNode[]>([]);
  const pluckGainRef = useRef<GainNode | null>(null);
  const pluckDecayTimeoutRef = useRef<any>(null);
  const isDraggingPluckRef = useRef<boolean>(false);

  // Wind simulator audio nodes (Requirement 5)
  const windAudioNodesRef = useRef<OscillatorNode[]>([]);
  const windGainRef = useRef<GainNode | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const chordNodesRef = useRef<OscillatorNode[]>([]);
  const chordGainRef = useRef<GainNode | null>(null);
  const micCanvasRef = useRef<HTMLCanvasElement>(null);
  const hearingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Notes dictionary for mapping
  const notes = [
    { name: 'C', freq: 261.63 },
    { name: 'C#', freq: 277.18 },
    { name: 'D', freq: 293.66 },
    { name: 'D#', freq: 311.13 },
    { name: 'E', freq: 329.63 },
    { name: 'F', freq: 349.23 },
    { name: 'F#', freq: 369.99 },
    { name: 'G', freq: 392.00 },
    { name: 'G#', freq: 415.30 },
    { name: 'A', freq: 440.00 },
    { name: 'A#', freq: 466.16 },
    { name: 'B', freq: 493.88 }
  ];

  const getClosestNote = (freq: number): string => {
    if (freq < 50 || freq > 4000) return 'מחוץ לטווח';
    let minDiff = Infinity;
    let closest = 'N/A';
    // Match across multiple octaves
    for (let octave = -1; octave <= 3; octave++) {
      const multiplier = Math.pow(2, octave);
      for (const note of notes) {
        const targetFreq = note.freq * multiplier;
        const diff = Math.abs(freq - targetFreq);
        if (diff < minDiff) {
          minDiff = diff;
          closest = `${note.name}${4 + octave}`;
        }
      }
    }
    return closest;
  };

  // --- Real-time Microphone Analyzer ---
  const toggleMic = async () => {
    if (isMicOn) {
      stopMic();
    } else {
      await startMic();
    }
  };

  const startMic = async () => {
    setMicError(null);
    try {
      // Stop any playing replays first
      stopReplay();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Lazy init audio context
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      micAnalyserRef.current = analyser;
      setIsMicOn(true);

      // Start Recording for Replay
      if (typeof MediaRecorder !== 'undefined') {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          if (recordedBlobUrl) {
            URL.revokeObjectURL(recordedBlobUrl);
          }
          setRecordedBlobUrl(URL.createObjectURL(blob));
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
      }
    } catch (err: any) {
      console.error(err);
      setMicError('לא ניתן לגשת למיקרופון. אנא ודאו שאישרתם הרשאות שמע בדפדפן.');
      setIsMicOn(false);
    }
  };

  const stopMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    micAnalyserRef.current = null;
    setIsMicOn(false);
    setDetectedFrequency(null);
    setDetectedNote(null);
    setHarmonicPurity('silent');
  };

  const startReplay = async () => {
    if (!recordedBlobUrl) return;
    try {
      stopReplay();
      stopMic(); // Stop live mic if active
      setIsReplaying(true);

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const response = await fetch(recordedBlobUrl);
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = decodedBuffer;

      // Connect to the analyzer so we visualize the playback!
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;
      micAnalyserRef.current = analyser;

      sourceNode.connect(analyser);
      analyser.connect(ctx.destination);

      sourceNode.onended = () => {
        setIsReplaying(false);
        setIsMicOn(false);
      };

      replaySourceRef.current = sourceNode;
      setIsMicOn(true); // Triggers the visual canvas loop to draw!
      sourceNode.start();
    } catch (err) {
      console.error("Replay failed:", err);
      setIsReplaying(false);
    }
  };

  const stopReplay = () => {
    if (replaySourceRef.current) {
      try {
        replaySourceRef.current.stop();
      } catch (e) {}
      replaySourceRef.current = null;
    }
    setIsReplaying(false);
    setIsMicOn(false);
  };

  // --- Transfer recorded/detected pitch to instruments (Requirement 6) ---
  const transferToGuitar = (freq: number) => {
    setInstrumentTab('guitar');
    // Calculate required string length (or tension) to match freq
    // v = √ (T / μ). Let's use current tension and density
    const mu_kg = pluckDensity / 1000;
    const v = Math.sqrt(pluckTension / mu_kg);
    // f1 = v / 2L => L = v / 2f1
    const L_m = v / (2 * freq);
    const L_cm = Math.round(L_m * 100);
    // Bound length between 30 and 100 cm
    const clampedL = Math.max(30, Math.min(100, L_cm));
    setPluckLength(clampedL);
    
    // Auto pluck with a small delay so state updates and audio triggers
    setTimeout(() => {
      playPluckedString();
    }, 150);
  };

  const transferToFlute = (freq: number) => {
    setInstrumentTab('flute');
    setWindMatchAlert(null);
    
    // Find closest match in wind instruments
    const recorderNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    const clarinetNotes = [220.00, 233.08, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00];
    const trumpetValvesNotes = [392.00, 369.99, 349.23, 329.63, 311.13, 293.66, 277.18];
    
    let bestDist = Infinity;
    let bestInstrument: string = 'recorder';
    let bestHoles: boolean[] = [true, true, true, true, false, false];
    let bestValves: boolean[] = [false, false, false];
    let matchedNoteName = '';

    // Test Recorder
    recorderNotes.forEach((f, idx) => {
      const dist = Math.abs(freq - f);
      if (dist < bestDist) {
        bestDist = dist;
        bestInstrument = 'recorder';
        // closed count is idx
        const holes = Array(6).fill(false).map((_, i) => i < idx);
        bestHoles = holes;
        matchedNoteName = getClosestNote(f);
      }
    });

    // Test Concert Flute
    recorderNotes.forEach((f, idx) => {
      const dist = Math.abs(freq - f);
      if (dist < bestDist) {
        bestDist = dist;
        bestInstrument = 'concert_flute';
        const holes = Array(6).fill(false).map((_, i) => i < idx);
        bestHoles = holes;
        matchedNoteName = getClosestNote(f);
      }
    });

    // Test Clarinet
    clarinetNotes.forEach((f, idx) => {
      const dist = Math.abs(freq - f);
      if (dist < bestDist) {
        bestDist = dist;
        bestInstrument = 'clarinet';
        const holes = Array(6).fill(false).map((_, i) => i < idx);
        bestHoles = holes;
        matchedNoteName = getClosestNote(f);
      }
    });

    // Test Trumpet
    trumpetValvesNotes.forEach((f, idx) => {
      const dist = Math.abs(freq - f);
      if (dist < bestDist) {
        bestDist = dist;
        bestInstrument = 'trumpet';
        let valves = [false, false, false];
        if (idx === 1) valves = [false, true, false];
        else if (idx === 2) valves = [true, false, false];
        else if (idx === 3) valves = [true, true, false];
        else if (idx === 4) valves = [false, true, true];
        else if (idx === 5) valves = [true, false, true];
        else if (idx === 6) valves = [true, true, true];
        bestValves = valves;
        matchedNoteName = getClosestNote(f);
      }
    });

    setSelectedWindInstrument(bestInstrument as any);
    if (bestInstrument === 'trumpet') {
      setWindValves(bestValves);
    } else {
      setWindHoles(bestHoles);
    }

    const instHeb = bestInstrument === 'recorder' ? 'חלילית' : bestInstrument === 'concert_flute' ? 'חליל צד' : bestInstrument === 'clarinet' ? 'קלרינט' : 'חצוצרה';
    setWindMatchAlert(`פוענח בהצלחה! התדר המוקלט (${Math.round(freq)} הרץ) פוענח כתו ${matchedNoteName} בכלי ${instHeb}. הוגדרו החורים והשסתומים המתאימים!`);
    
    // Auto-clear alert after 6 seconds
    setTimeout(() => {
      setWindMatchAlert(null);
    }, 6000);

    // Auto-play wind sound with a small delay
    setTimeout(() => {
      playWindSound();
    }, 150);
  };

  // Render mic analyser bars & detect pitch
  useEffect(() => {
    if (!isMicOn || !micAnalyserRef.current) return;

    const canvas = micCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = micAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isMicOn || !analyser) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const startX = 45;
      const usableWidth = w - startX;
      const usableHeight = h - 25;

      // Draw background grid
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < usableHeight; y += 30) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw frequency spectrum
      const barWidth = (usableWidth / bufferLength) * 2.5;
      let barHeight;
      let x = startX;

      // Pitch detection helper (Find dominant frequency peak)
      let maxVal = -1;
      let maxIdx = -1;
      let energyTotal = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        energyTotal += barHeight;

        // Peak finder
        if (barHeight > maxVal && i > 5) { // Skip DC offset
          maxVal = barHeight;
          maxIdx = i;
        }

        // Draw spectrum bar with colorful gradient
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (1 - (i / bufferLength));
        const b = 150;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        const drawHeight = barHeight * (usableHeight / 255);
        ctx.fillRect(x, usableHeight - drawHeight, barWidth - 1, drawHeight);

        x += barWidth;
      }

      // Draw Axes Lines (Requirement 1)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, usableHeight);
      ctx.lineTo(w, usableHeight);
      ctx.stroke();

      // Draw Amplitude Scale on Vertical Axis (Requirement 1)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('100%', startX - 6, 10);
      ctx.fillText('75%', startX - 6, usableHeight * 0.25 + 4);
      ctx.fillText('50%', startX - 6, usableHeight * 0.5 + 4);
      ctx.fillText('25%', startX - 6, usableHeight * 0.75 + 4);
      ctx.fillText('0%', startX - 6, usableHeight - 2);

      // Draw Frequency Scale on Horizontal Axis (Requirement 1)
      const sampleRate = audioCtxRef.current?.sampleRate || 44100;
      const getXFromFreq = (f: number) => {
        const i = (f * analyser.fftSize) / sampleRate;
        return startX + i * barWidth;
      };
      
      const ticks = [250, 500, 1000, 2000, 4000, 6000, 8000];
      ctx.textAlign = 'center';
      
      ticks.forEach(tFreq => {
        const tx = getXFromFreq(tFreq);
        if (tx >= startX && tx <= w) {
          ctx.strokeStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(tx, usableHeight);
          ctx.lineTo(tx, usableHeight + 4);
          ctx.stroke();
          
          const label = tFreq >= 1000 ? `${(tFreq / 1000).toFixed(0)}kHz` : `${tFreq}Hz`;
          ctx.fillText(label, tx, usableHeight + 14);
        }
      });

      // Draw dynamic mouse hover cursor and tooltip (Requirement 1)
      if (micHoverXRef.current !== null && micHoverXRef.current >= startX && micHoverXRef.current <= w) {
        const hX = micHoverXRef.current;
        const i = (hX - startX) / barWidth;
        const hoverFreq = i * sampleRate / analyser.fftSize;
        
        if (hoverFreq > 0 && hoverFreq < 22000) {
          // Draw vertical golden dotted line
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(hX, 0);
          ctx.lineTo(hX, usableHeight);
          ctx.stroke();
          ctx.setLineDash([]); // reset

          // Tooltip rendering inside canvas
          const noteStr = getClosestNote(hoverFreq);
          const text = `${Math.round(hoverFreq)} Hz (${noteStr})`;
          ctx.font = 'bold 10px Inter, sans-serif';
          const textWidth = ctx.measureText(text).width;
          
          const boxW = textWidth + 16;
          const boxH = 22;
          let boxX = hX + 10;
          if (boxX + boxW > w) {
            boxX = hX - boxW - 10;
          }
          const boxY = Math.max(10, usableHeight / 2 - 11);
          
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; // dark background
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 4);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.fillText(text, boxX + 8, boxY + 14);
        }
      }

      // Convert peak index to actual Hz
      if (maxVal > 110 && maxIdx !== -1) {
        const freq = maxIdx * sampleRate / analyser.fftSize;

        setDetectedFrequency(Math.round(freq));
        setDetectedNote(getClosestNote(freq));

        // Evaluate spectral density / purity
        let peakCounts = 0;
        for (let i = 10; i < bufferLength - 10; i++) {
          if (dataArray[i] > 120 && dataArray[i] > dataArray[i-1] && dataArray[i] > dataArray[i+1]) {
            peakCounts++;
          }
        }

        if (peakCounts <= 2) {
          setHarmonicPurity('pure');
        } else {
          setHarmonicPurity('harmonic_rich');
        }
      } else {
        setDetectedFrequency(null);
        setDetectedNote(null);
        setHarmonicPurity('silent');
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMicOn]);

  // Clean up mic, oscillators & replays on unmount
  useEffect(() => {
    return () => {
      stopMic();
      stopChord();
      stopReplay();
      stopConceptTones();
      stopPluckedString();
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
      if (pluckDecayTimeoutRef.current) {
        clearTimeout(pluckDecayTimeoutRef.current);
      }
    };
  }, [recordedBlobUrl]);

  // --- Interactive Audio Chord Synthesizer ---
  const playChord = (chordName: string) => {
    try {
      stopChord(); // Stop previous first

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const chordGain = ctx.createGain();
      chordGain.gain.setValueAtTime(0.01, ctx.currentTime); // Fade-in start
      chordGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      chordGain.connect(ctx.destination);
      chordGainRef.current = chordGain;

      // Map chord tones
      let chordFreqs: number[] = [];
      if (chordName === 'C_Major') {
        chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (happy major chord)
      } else if (chordName === 'A_Minor') {
        chordFreqs = [220.00, 261.63, 440.00, 523.25]; // A3, C4, A4, C5 (sad minor chord)
      } else if (chordName === 'G_Major') {
        chordFreqs = [196.00, 246.94, 293.66, 392.00]; // G3, B3, D4, G4 (bright major)
      }

      const oscillators = chordFreqs.map(freq => {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // If electric guitar is on, make it slightly warmer saw/triangle
        osc.type = instrumentTab === 'guitar' && guitarType === 'electric' ? 'triangle' : 'sine';
        osc.connect(chordGain);
        osc.start();
        return osc;
      });

      chordNodesRef.current = oscillators;
      setActiveChord(chordName);
    } catch (e) {
      console.error(e);
    }
  };

  const stopChord = () => {
    if (chordGainRef.current) {
      try {
        const ctx = audioCtxRef.current;
        if (ctx) {
          chordGainRef.current.gain.setValueAtTime(chordGainRef.current.gain.value, ctx.currentTime);
          chordGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        }
      } catch (e){}
    }

    setTimeout(() => {
      chordNodesRef.current.forEach(osc => {
        try { osc.stop(); } catch(e){}
        osc.disconnect();
      });
      chordNodesRef.current = [];
      setActiveChord(null);
    }, 300);
  };

  // --- Interactive Music Concepts (Glossary) Player & Canvas Loop ---
  const playConceptTones = (mode: 'base' | 'interval' | 'both') => {
    try {
      stopConceptTones();
      setIsConceptPlaying(true);

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      let multiplier = 1.0;
      if (conceptIntervalType === 'octave') multiplier = 2.0;
      else if (conceptIntervalType === 'tone') multiplier = Math.pow(2, 2/12); // 1.12246
      else if (conceptIntervalType === 'quarter_tone') multiplier = Math.pow(2, 0.5/12); // 1.0293
      else if (conceptIntervalType === ('scale' as any)) multiplier = 1.5; // 3:2 Perfect Fifth ratio representing scale harmony

      const baseF = conceptBaseFreq;
      const intervalF = conceptBaseFreq * multiplier;

      // Base tone oscillator
      if (mode === 'base' || mode === 'both') {
        const oscBase = ctx.createOscillator();
        const gainBase = ctx.createGain();
        oscBase.frequency.setValueAtTime(baseF, ctx.currentTime);
        oscBase.type = 'sine';
        gainBase.gain.setValueAtTime(0.12, ctx.currentTime);
        oscBase.connect(gainBase);
        gainBase.connect(ctx.destination);
        conceptOscRef.current.base = oscBase;
        conceptGainRef.current.base = gainBase;
        oscBase.start();
      }

      // Interval tone oscillator
      if (mode === 'interval' || mode === 'both') {
        const oscInterval = ctx.createOscillator();
        const gainInterval = ctx.createGain();
        oscInterval.frequency.setValueAtTime(intervalF, ctx.currentTime);
        oscInterval.type = 'sine';
        gainInterval.gain.setValueAtTime(0.12, ctx.currentTime);
        oscInterval.connect(gainInterval);
        gainInterval.connect(ctx.destination);
        conceptOscRef.current.interval = oscInterval;
        conceptGainRef.current.interval = gainInterval;
        oscInterval.start();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopConceptTones = () => {
    if (conceptOscRef.current.base) {
      try {
        conceptOscRef.current.base.stop();
        conceptOscRef.current.base.disconnect();
      } catch (e) {}
      conceptOscRef.current.base = null;
    }
    if (conceptOscRef.current.interval) {
      try {
        conceptOscRef.current.interval.stop();
        conceptOscRef.current.interval.disconnect();
      } catch (e) {}
      conceptOscRef.current.interval = null;
    }
    if (conceptGainRef.current.base) {
      conceptGainRef.current.base.disconnect();
      conceptGainRef.current.base = null;
    }
    if (conceptGainRef.current.interval) {
      conceptGainRef.current.interval.disconnect();
      conceptGainRef.current.interval = null;
    }
    setIsConceptPlaying(false);
  };

  // Concept Canvas loop
  useEffect(() => {
    const canvas = conceptCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle background grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      for (let y = 15; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Base string line (dark grey dashed)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, centerY);
      ctx.lineTo(w - 20, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      let multiplier = 1.0;
      if (conceptIntervalType === 'octave') multiplier = 2.0;
      else if (conceptIntervalType === 'tone') multiplier = Math.pow(2, 2/12);
      else if (conceptIntervalType === 'quarter_tone') multiplier = Math.pow(2, 0.5/12);
      else if (conceptIntervalType === ('scale' as any)) multiplier = 1.5;

      const amp = isConceptPlaying ? 30 : 10;

      // 1. Draw Base Wave (wavelength relates to n=1) - Blue
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 20; x < w - 20; x++) {
        const ratio = (x - 20) / (w - 40);
        const y = amp * Math.sin(Math.PI * ratio) * Math.cos(t * 1.5);
        if (x === 20) ctx.moveTo(x, centerY - y);
        else ctx.lineTo(x, centerY - y);
      }
      ctx.stroke();

      // 2. Draw Interval Wave (shows relative cycles) - Pink
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 20; x < w - 20; x++) {
        const ratio = (x - 20) / (w - 40);
        // Wavelength multiplier corresponds directly to interval factor!
        const y = amp * Math.sin(multiplier * Math.PI * ratio) * Math.cos(t * 1.5 * multiplier);
        if (x === 20) ctx.moveTo(x, centerY - y);
        else ctx.lineTo(x, centerY - y);
      }
      ctx.stroke();

      // 3. Draw Composite Superposition Wave (Thick Violet)
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 20; x < w - 20; x++) {
        const ratio = (x - 20) / (w - 40);
        const y1 = amp * Math.sin(Math.PI * ratio) * Math.cos(t * 1.5);
        const y2 = amp * Math.sin(multiplier * Math.PI * ratio) * Math.cos(t * 1.5 * multiplier);
        const ySum = (y1 + y2) / 2;
        if (x === 20) ctx.moveTo(x, centerY - ySum);
        else ctx.lineTo(x, centerY - ySum);
      }
      ctx.stroke();

      // Anchor node pins
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(20, centerY, 5, 0, Math.PI * 2);
      ctx.arc(w - 20, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // HUD Text Info in Hebrew
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`גל בסיס: ${conceptBaseFreq}Hz`, 25, 25);
      
      ctx.fillStyle = '#db2777';
      ctx.fillText(`גל מושווה (פי ${multiplier.toFixed(4)}): ${(conceptBaseFreq * multiplier).toFixed(1)}Hz`, 25, 42);

      ctx.fillStyle = '#4f46e5';
      ctx.fillText(`סופרפוזיציה אקוסטית (גלי לחץ משולבים בהתאבכות)`, 25, 59);

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [conceptBaseFreq, conceptIntervalType, isConceptPlaying]);


  // --- Physical Guitar Pluck Laboratory Sound & Physics Engine ---
  const playPluckedString = () => {
    try {
      stopPluckedString();
      setIsPluckedVibrating(true);

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Physics Calculation
      const L_m = pluckLength / 100;
      const mu_kg = pluckDensity / 1000;
      const v = Math.sqrt(pluckTension / mu_kg);
      const f1 = v / (2 * L_m);

      const r = pluckPosition; // Plucking ratio (0.05 to 0.95)
      const amps: number[] = [];
      let sum = 0;
      
      for (let n = 1; n <= 6; n++) {
        if (violinMode) {
          // Bowed string (Helmholtz motion) produces a sawtooth wave, amplitude decays as 1/n (Requirement 7)
          const val = 1 / n;
          amps.push(val);
          sum += val;
        } else {
          // Plucked string (triangle-like peak) Fourier coefficient
          const val = Math.sin(n * Math.PI * r) / (n * n * r * (1 - r));
          amps.push(val);
          sum += Math.abs(val);
        }
      }
      
      // Normalize amplitudes to keep gain safe
      const normAmps = amps.map(a => (a / sum) * (violinMode ? 0.14 : 0.18));

      const pluckGain = ctx.createGain();
      pluckGain.gain.setValueAtTime(0.01, ctx.currentTime);
      
      if (violinMode) {
        // Slow expressive bowing attack and continuous sustain (Requirement 7)
        pluckGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.25);
        pluckGain.gain.exponentialRampToValueAtTime(0.20, ctx.currentTime + 6.0); // very slow decay to keep bowed sound alive
      } else {
        // Realistic instantaneous transient pluck attack
        pluckGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
        pluckGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      }
      
      pluckGain.connect(ctx.destination);
      pluckGainRef.current = pluckGain;

      const oscillators = [];
      for (let n = 1; n <= 6; n++) {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(f1 * n, ctx.currentTime);
        osc.type = 'sine';

        const harmonicGain = ctx.createGain();
        harmonicGain.gain.setValueAtTime(normAmps[n-1], ctx.currentTime);
        
        if (violinMode) {
          // Continuous bowing sustains all harmonics (Requirement 7)
          harmonicGain.gain.exponentialRampToValueAtTime(normAmps[n-1] * 0.8, ctx.currentTime + 6.0);
        } else {
          // High frequency modes decay faster physically
          const decayTime = 2.5 / Math.sqrt(n);
          harmonicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decayTime);
        }

        osc.connect(harmonicGain);
        harmonicGain.connect(pluckGain);
        osc.start();
        oscillators.push(osc);
      }

      pluckAudioNodesRef.current = oscillators;

      if (pluckDecayTimeoutRef.current) clearTimeout(pluckDecayTimeoutRef.current);
      pluckDecayTimeoutRef.current = setTimeout(() => {
        setIsPluckedVibrating(false);
      }, violinMode ? 6000 : 2500);

    } catch (e) {
      console.error(e);
    }
  };

  const stopPluckedString = () => {
    pluckAudioNodesRef.current.forEach(osc => {
      try { osc.stop(); } catch(e){}
      try { osc.disconnect(); } catch(e){}
    });
    pluckAudioNodesRef.current = [];
    if (pluckGainRef.current) {
      try { pluckGainRef.current.disconnect(); } catch(e){}
      pluckGainRef.current = null;
    }
    setIsPluckedVibrating(false);
  };

  // --- Wind Instrument Sound Synthesis & Physics (Requirement 5) ---
  const getWindFrequency = (): number => {
    if (selectedWindInstrument === 'trumpet') {
      const v1 = windValves[0];
      const v2 = windValves[1];
      const v3 = windValves[2];
      if (!v1 && !v2 && !v3) return 392.00; // G4
      if (!v1 && v2 && !v3) return 369.99;  // F#4
      if (v1 && !v2 && !v3) return 349.23;  // F4
      if (v1 && v2 && !v3) return 329.63;   // E4
      if (!v1 && v2 && v3) return 311.13;   // Eb4
      if (v1 && !v2 && v3) return 293.66;   // D4
      if (v1 && v2 && v3) return 277.18;    // C#4
      return 392.00;
    } else if (selectedWindInstrument === 'clarinet') {
      const closedCount = windHoles.filter(h => h).length;
      const clarinetNotes = [220.00, 233.08, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00];
      return clarinetNotes[closedCount] || 220.00;
    } else {
      const closedCount = windHoles.filter(h => h).length;
      const fluteNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
      return fluteNotes[closedCount] || 261.63;
    }
  };

  const playWindSound = () => {
    try {
      stopWindSound();
      setIsBlowingWind(true);

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const freq = getWindFrequency();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.15); // soft breathing attack
      gainNode.connect(ctx.destination);
      windGainRef.current = gainNode;

      const oscs: OscillatorNode[] = [];

      if (selectedWindInstrument === 'trumpet') {
        // Bright brassy sawtooth spectrum (Requirement 5)
        for (let i = 1; i <= 5; i++) {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(freq * i, ctx.currentTime);
          osc.type = 'sine';
          const hGain = ctx.createGain();
          const amp = 0.28 / (i * i);
          hGain.gain.setValueAtTime(amp, ctx.currentTime);
          osc.connect(hGain);
          hGain.connect(gainNode);
          osc.start();
          oscs.push(osc);
        }
      } else if (selectedWindInstrument === 'clarinet') {
        // Cylindrical closed tube -> strictly odd harmonics (Requirement 5)
        for (let i = 1; i <= 7; i += 2) {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(freq * i, ctx.currentTime);
          osc.type = 'sine';
          const hGain = ctx.createGain();
          const amp = 0.28 / i;
          hGain.gain.setValueAtTime(amp, ctx.currentTime);
          osc.connect(hGain);
          hGain.connect(gainNode);
          osc.start();
          oscs.push(osc);
        }
      } else if (selectedWindInstrument === 'concert_flute') {
        // Pure sinusoidal wave
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.28, ctx.currentTime);
        osc.connect(hGain);
        hGain.connect(gainNode);
        osc.start();
        oscs.push(osc);
      } else {
        // Recorder: standard woodwind with subtle 2nd harmonic
        for (let i = 1; i <= 2; i++) {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(freq * i, ctx.currentTime);
          osc.type = 'sine';
          const hGain = ctx.createGain();
          hGain.gain.setValueAtTime(i === 1 ? 0.28 : 0.06, ctx.currentTime);
          osc.connect(hGain);
          hGain.connect(gainNode);
          osc.start();
          oscs.push(osc);
        }
      }

      windAudioNodesRef.current = oscs;
    } catch (e) {
      console.error(e);
    }
  };

  const stopWindSound = () => {
    windAudioNodesRef.current.forEach(osc => {
      try { osc.stop(); } catch(e){}
      try { osc.disconnect(); } catch(e){}
    });
    windAudioNodesRef.current = [];
    if (windGainRef.current) {
      try { windGainRef.current.disconnect(); } catch(e){}
      windGainRef.current = null;
    }
    setIsBlowingWind(false);
  };

  // Drag pluck handlers
  const handlePluckPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = pluckCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerY = canvas.height / 2;
    if (Math.abs(y - centerY) < 45) {
      isDraggingPluckRef.current = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      updatePluckFromMouse(x, y, canvas);
    }
  };

  const handlePluckPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingPluckRef.current) return;
    const canvas = pluckCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updatePluckFromMouse(x, y, canvas);
  };

  const handlePluckPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingPluckRef.current) return;
    isDraggingPluckRef.current = false;
    const canvas = pluckCanvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    // Release the pluck! Pluck the string!
    playPluckedString();
  };

  const updatePluckFromMouse = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const ratio = Math.max(0.05, Math.min(0.95, (x - 20) / (w - 40)));
    setPluckPosition(ratio);
  };

  // Pluck Canvas rendering loop
  useEffect(() => {
    const canvas = pluckCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const render = () => {
      t += 0.08;
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Draw horizontal reference string center line
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Physics properties
      const L_m = pluckLength / 100;
      const mu_kg = pluckDensity / 1000;
      const v = Math.sqrt(pluckTension / mu_kg);
      const f1 = v / (2 * L_m);

      const r = pluckPosition;
      // Visually model thickness based on mass density
      const thick = Math.max(1, pluckDensity * 1.3);

      // Color models tension: high tension is blue, low is warm/orange
      const tensionRatio = Math.max(0, Math.min(1, (pluckTension - 50) / 150)); // 50 to 200
      const strokeColor = `hsl(${25 + tensionRatio * 185}, 85%, 52%)`;

      if (isDraggingPluckRef.current) {
        // 1. User is holding & pulling the string: triangular shape!
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = thick;
        ctx.beginPath();
        ctx.moveTo(20, centerY);
        const pluckX = 20 + r * (w - 40);
        ctx.lineTo(pluckX, centerY - 38); // 38px plucked height
        ctx.lineTo(w - 20, centerY);
        ctx.stroke();

        // Plucking locator guideline
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pluckX, 10);
        ctx.lineTo(pluckX, h - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive pluck bead
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(pluckX, centerY - 38, 6, 0, Math.PI * 2);
        ctx.fill();

      } else if (isPluckedVibrating) {
        // 2. String released/vibrating! Vibrating composite shape using Fourier superposition.
        const decay = violinMode ? 1.0 : Math.max(0, 1 - (t * 0.022));

        const amps: number[] = [];
        let sum = 0;
        for (let n = 1; n <= 6; n++) {
          if (violinMode) {
            // Bowed sawtooth harmonics decay as 1/n
            const val = 1 / n;
            amps.push(val);
            sum += val;
          } else {
            // Plucked triangle coefficients
            const val = Math.sin(n * Math.PI * r) / (n * n * r * (1 - r));
            amps.push(val);
            sum += Math.abs(val);
          }
        }
        const normAmps = amps.map(a => (a / sum) * 35 * decay);

        // Draw constituent harmonics underneath (dimmer individual waves)
        if (showConstituentsInPluck) {
          for (let n = 1; n <= 4; n++) {
            ctx.strokeStyle = `hsla(${(n * 55) % 360}, 65%, 50%, 0.12)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 20; x < w - 20; x++) {
              const ratio = (x - 20) / (w - 40);
              const y = normAmps[n-1] * Math.sin(n * Math.PI * ratio) * Math.cos(t * 0.5 * n);
              if (x === 20) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();
          }
        }

        // Draw the main glowing composite physical wave
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = thick;
        ctx.beginPath();
        for (let x = 20; x < w - 20; x++) {
          const ratio = (x - 20) / (w - 40);
          let compositeY = 0;
          for (let n = 1; n <= 6; n++) {
            compositeY += normAmps[n-1] * Math.sin(n * Math.PI * ratio) * Math.cos(t * 0.5 * n);
          }
          if (x === 20) ctx.moveTo(x, centerY - compositeY);
          else ctx.lineTo(x, centerY - compositeY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset canvas shadow state

      } else {
        // 3. Flat rest state
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = thick;
        ctx.beginPath();
        ctx.moveTo(20, centerY);
        ctx.lineTo(w - 20, centerY);
        ctx.stroke();
      }

      // Ends anchor pins
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(20, centerY, 5, 0, Math.PI * 2);
      ctx.arc(w - 20, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Top text values on canvas
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`מהירות התקדמות הגל במיתר v = √T/μ: ${Math.round(v)} מ'/שנייה`, 25, 20);
      ctx.fillText(`תדר הרמוניית היסוד f₁ = v/2L: ${Math.round(f1 * 10) / 10} הרץ`, 25, 34);
      
      const closestNote = getClosestNote(f1);
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`תו קרוב מופק: ${closestNote}`, 25, 48);

      // Real-time physical transverse speed (Requirement 3 & 4)
      const currentDecay = violinMode ? (isPluckedVibrating ? 1.0 : 0.0) : Math.max(0, 1 - (t * 0.022));
      const peakTransverseVel = isPluckedVibrating ? (2 * Math.PI * f1 * 0.038 * currentDecay) : 0;
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`מהירות תנודה רוחבית מרבית (Vmax = A·ω): ${peakTransverseVel.toFixed(2)} מ'/שנייה`, 25, 62);

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [pluckLength, pluckTension, pluckDensity, pluckPosition, isPluckedVibrating, showConstituentsInPluck, violinMode]);


  // --- Hearing Pathway Visualizer Animation ---
  useEffect(() => {
    const canvas = hearingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw stylized representation of sound wave entering
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#1e293b';

      if (hearingPathTab === 'tympanic') {
        // Tympanic Membrane pathway
        // 1. External Wave
        ctx.strokeStyle = '#0284c7';
        ctx.beginPath();
        for (let x = 10; x < 120; x++) {
          const y = h/2 + Math.sin(x * 0.1 - t) * 15;
          if (x === 10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#0284c7';
        ctx.fillText('גלי לחץ באוויר', 15, h/2 - 25);

        // 2. Tympanic membrane (ear drum)
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        const drumX = 130;
        const drumDeflection = Math.sin(t) * 4;
        ctx.ellipse(drumX + drumDeflection, h/2, 6, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#be123c';
        ctx.fillText('עור התוף', drumX - 25, h/2 - 35);

        // 3. Ossicles (עצמי השמע) - stylized linkage mechanism
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(drumX + drumDeflection, h/2);
        const linkY = h/2 - 10 + drumDeflection * 0.5;
        ctx.lineTo(160, linkY); // Malleus
        ctx.lineTo(180, h/2 + 10 - drumDeflection * 0.5); // Incus / Stapes
        ctx.stroke();
        ctx.fillStyle = '#475569';
        ctx.fillText('עצמי השמע', 150, h/2 - 22);

        // 4. Cochlea (שבלול)
        const cochleaX = 230;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(cochleaX, h/2, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('שבלול', cochleaX - 16, h/2 + 4);
        ctx.fillStyle = '#7c3aed';
        ctx.fillText('קרום בסיסי מפריד תדרים', cochleaX - 55, h/2 + 40);

        // Waves inside cochlea fluid
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let r = 0; r < 18; r++) {
          const rx = cochleaX + Math.cos(r) * (r * 1.1);
          const ry = h/2 + Math.sin(r + t) * (r * 0.8);
          if (r === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.stroke();

      } else {
        // Bone Conduction pathway
        ctx.strokeStyle = '#e11d48';
        ctx.fillStyle = '#e11d48';
        ctx.fillText('רעשי עצם / עקיפת עור התוף', 15, h/2 - 25);

        // Stylized Bone frame
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(40, h/2 - 20, 140, 40, 8);
        ctx.fill();
        ctx.stroke();

        // Vibration inside bone
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let bx = 50; bx < 170; bx += 8) {
          const disp = Math.sin(bx * 0.5 + t) * 5;
          ctx.moveTo(bx, h/2 - 10 + disp);
          ctx.lineTo(bx, h/2 + 10 + disp);
        }
        ctx.stroke();
        ctx.fillStyle = '#be123c';
        ctx.fillText('הולכת עצם בגולגולת', 60, h/2 + 5);

        // Direct coupling into Cochlea
        const cochleaX = 230;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(cochleaX, h/2, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('שבלול', cochleaX - 16, h/2 + 4);

        // Waves in perilymph (cochlea)
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let cx = cochleaX - 15; cx < cochleaX + 15; cx++) {
          const cy = h/2 + Math.sin(cx * 0.3 - t * 1.5) * 6;
          if (cx === cochleaX - 15) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

      localFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(localFrame);
  }, [hearingPathTab]);

  return (
    <div className="space-y-8" id="music-simulator-wrapper">
      {/* SECTION 1: Web Audio Microphone Pitch & Note Detector */}
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-sans font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>מזהה תדרים ומנתח הרמוניות מהמיקרופון (Tuner / FFT)</span>
            </h3>
            <p className="text-xs text-slate-400">
              שירו או נגנו כלי נגינה ליד המיקרופון כדי לראות את גרף התדרים בזמן אמת, זיהוי התו, ורמת ניקיון הגל!
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleMic}
              disabled={isReplaying}
              className={`px-5 py-2.5 rounded-xl font-sans text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isMicOn && !isReplaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'} ${isReplaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="mic-toggle-btn"
            >
              {isMicOn && !isReplaying ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-bounce" />}
              <span>{isMicOn && !isReplaying ? 'כבה מיקרופון' : 'הפעל מיקרופון'}</span>
            </button>

            {recordedBlobUrl && (
              <button
                onClick={isReplaying ? stopReplay : startReplay}
                className={`px-5 py-2.5 rounded-xl font-sans text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isReplaying ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'}`}
                id="mic-replay-btn"
                title="השמיעו שוב את מה שהקלטתם וראו את הניתוח הספקטרלי שלו מחדש!"
              >
                {isReplaying ? <Square className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                <span>{isReplaying ? 'עצור שידור חוזר' : 'השמע שוב (שידור חוזר 🔁)'}</span>
              </button>
            )}
          </div>
        </div>

        {micError && (
          <div className="p-4 bg-red-950/50 border-b border-red-900/30 text-red-200 text-xs flex items-center gap-2" dir="rtl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Canvas Spectrum Display */}
          <div className="lg:col-span-2 p-6 bg-slate-900 relative">
            <span className="absolute top-3 left-3 text-[10px] font-mono text-slate-500">
              {isReplaying ? 'REPLAYING RECORDED AUDIO - SPECTRAL ANALYSIS' : 'REAL-TIME FAST FOURIER TRANSFORM (FFT)'}
            </span>
            <canvas 
              ref={micCanvasRef} 
              width={550} 
              height={180} 
              className="w-full h-[180px] bg-slate-950/80 rounded-lg border border-slate-800 block"
            />
          </div>

          {/* Analysis telemetry panel */}
          <div className="p-6 bg-slate-950 flex flex-col justify-center border-t lg:border-t-0 lg:border-r border-slate-800 text-center space-y-4" dir="rtl">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block mb-1">
                {isReplaying ? 'תו מזוהה בשידור החוזר' : 'תו מוזיקלי קרוב'}
              </span>
              <div className="text-4xl font-sans font-bold text-emerald-400 tracking-tight">
                {isMicOn ? (detectedNote || 'מזהה...') : 'כבוי'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800 py-3">
              <div>
                <span className="text-[10px] text-slate-500 block">תדר דומיננטי</span>
                <span className="text-md font-mono font-bold text-white">
                  {isMicOn && detectedFrequency ? `${detectedFrequency} Hz` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">סגנון גל</span>
                <span className={`text-xs font-semibold ${harmonicPurity === 'pure' ? 'text-sky-400' : harmonicPurity === 'harmonic_rich' ? 'text-amber-400' : 'text-slate-500'}`}>
                  {harmonicPurity === 'pure' ? 'סינוס טהור' : harmonicPurity === 'harmonic_rich' ? 'עשיר בהרמוניות' : '--'}
                </span>
              </div>
            </div>

            {isMicOn && detectedFrequency && (
              <div className="space-y-2 pt-2 pb-1 border-b border-slate-800">
                <span className="text-[10px] text-slate-500 block">העברת התו לסימולטורים:</span>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => transferToGuitar(detectedFrequency)}
                    className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/80 text-amber-300 hover:text-white text-xs font-sans font-bold rounded-lg border border-amber-600/40 cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    title="שלח למעבדת מיתר והתאם אורך מיתר"
                  >
                    🎸 מיתר
                  </button>
                  <button
                    onClick={() => transferToFlute(detectedFrequency)}
                    className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/80 text-sky-300 hover:text-white text-xs font-sans font-bold rounded-lg border border-sky-600/40 cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    title="שלח לחקירת נשיפה ופענח אצבוע"
                  >
                    💨 כלי נשיפה
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-400 leading-relaxed text-right bg-slate-900 p-3 rounded-lg border border-slate-800/50">
              {isReplaying ? (
                <span className="text-indigo-300">
                  🔁 <strong>שידור חוזר פעיל:</strong> המערכת מריצה כעת את השמע המוקלט דרך מנתח התדרים הדיגיטלי (FFT) כאילו מדובר בקלט חי!
                </span>
              ) : harmonicPurity === 'pure' ? (
                <span className="text-sky-300">
                  ⚡ <strong>איתור גל טהור:</strong> הצליל הנקלט מכיל תדר בודד ללא עיוותים או החזרות (דומה לשריקה נקייה או קולן).
                </span>
              ) : harmonicPurity === 'harmonic_rich' ? (
                <span className="text-amber-300">
                  🎻 <strong>איתור צליל הרמוני:</strong> הצליל מורכב מתדר יסוד ומספר רב של כפולות הרמוניות (נפוץ בשירה אנושית וכלי נגינה).
                </span>
              ) : (
                <span>הפעילו את המיקרופון, השמיעו שריקה נקייה או צליל, וכבו אותו. לאחר מכן תוכלו להאזין שוב לקטע ולהביט בניתוח האקוסטי שלו!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Interactive Instrument Exploration & Musical Concepts Glossary */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4" dir="rtl">
          <div>
            <h3 className="text-lg font-sans font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>אקוסטיקה וחקירת מושגי יסוד במוזיקה</span>
            </h3>
            <p className="text-xs text-slate-500">למדו את מושגי היסוד המוזיקליים, או חקרו את תכונות הגל של כלי נגינה שונים</p>
          </div>

          {/* Instrument & Concepts Selector Tabs */}
          <div className="flex flex-wrap bg-slate-100 rounded-xl p-1 gap-1" id="instrument-tabs">
            <button
              onClick={() => { stopConceptTones(); stopPluckedString(); setInstrumentTab('concepts'); }}
              className={`px-4 py-2 text-xs font-sans font-bold rounded-lg cursor-pointer transition-all ${instrumentTab === 'concepts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📖 מושגי יסוד (אוקטבה, טון, רבע טון)
            </button>
            <button
              onClick={() => { stopConceptTones(); stopPluckedString(); setInstrumentTab('guitar'); }}
              className={`px-4 py-2 text-xs font-sans font-bold rounded-lg cursor-pointer transition-all ${instrumentTab === 'guitar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🎸 מעבדה פיזיקלית: פריטת מיתר
            </button>
            <button
              onClick={() => { stopConceptTones(); stopPluckedString(); setInstrumentTab('flute'); }}
              className={`px-4 py-2 text-xs font-sans font-bold rounded-lg cursor-pointer transition-all ${instrumentTab === 'flute' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              💨 נשיפה (חליל)
            </button>
            <button
              onClick={() => { stopConceptTones(); stopPluckedString(); setInstrumentTab('drum'); }}
              className={`px-4 py-2 text-xs font-sans font-bold rounded-lg cursor-pointer transition-all ${instrumentTab === 'drum' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🥁 הקשה (תוף)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12" dir="rtl">
          
          {/* Main Interactive Work Area */}
          <div className="lg:col-span-8 p-6 border-l border-slate-100 space-y-6">
            
            {/* TAB 1: INTERACTIVE CONCEPTS & GLOSSARY */}
            {instrumentTab === 'concepts' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Music className="w-4 h-4 text-indigo-500" />
                    <span>מדריך אינטראקטיבי למושגי היסוד המוזיקליים</span>
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">גל עומד הרמוני במיתר</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sidebar Dictionary Selection */}
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-mono tracking-wider">בחרו מושג לחקירה:</span>
                    {[
                      { id: 'sound', label: '🔊 צליל (Sound)', desc: 'רעידה מכנית היוצרת גל לחץ באוויר' },
                      { id: 'note', label: '🎵 תו (Note)', desc: 'תדר יסוד מוגדר וקבוע בסולם' },
                      { id: 'scale', label: '🎼 סולם מוזיקלי (Scale)', desc: 'מערכת תדרים הרמונית מוגדרת' },
                      { id: 'octave', label: '🎚️ אוקטבה (Octave)', desc: 'יחס תדרים של 2:1 (כפול או חצי)' },
                      { id: 'tone', label: '🎹 טון (Whole Step)', desc: 'מרווח של 2 חצאי טון (פי 1.122)' },
                      { id: 'quarter_tone', label: '🎻 רבע טון (Quarter Tone)', desc: 'מרווח מיקרוטונאלי עדין (פי 1.029)' }
                    ].map(concept => (
                      <button
                        key={concept.id}
                        onClick={() => {
                          setSelectedConcept(concept.id as any);
                          stopConceptTones();
                          if (concept.id === 'sound') {
                            setConceptIntervalType('unison');
                          } else if (concept.id === 'note') {
                            setConceptIntervalType('unison');
                          } else if (concept.id === 'scale') {
                            setConceptIntervalType('scale' as any);
                          } else if (concept.id === 'octave') {
                            setConceptIntervalType('octave');
                          } else if (concept.id === 'tone') {
                            setConceptIntervalType('tone');
                          } else if (concept.id === 'quarter_tone') {
                            setConceptIntervalType('quarter_tone');
                          }
                        }}
                        className={`p-3 text-right rounded-xl border text-xs cursor-pointer transition-all ${selectedConcept === concept.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}
                      >
                        <div className="font-semibold">{concept.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{concept.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Concept details, definition and simulator */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Visual Canvas representing the concept */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                      <span className="text-[9px] font-mono text-slate-400 absolute top-2 left-3">SUPERPOSITION OF CONSTITUENT HARMONICS</span>
                      <span className="text-xs font-bold text-slate-700 block">הדמיית הגלים המתרחשים במיתר:</span>
                      
                      <canvas
                        ref={conceptCanvasRef}
                        width={420}
                        height={120}
                        className="w-full h-[120px] bg-white rounded-lg border border-slate-200 block"
                      />
                    </div>

                    {/* Parameters adjustment */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                        <span>שינוי פרמטרים לחקירה מוזיקלית ופיזיקלית:</span>
                      </span>

                      {/* Slider 1: Base Frequency */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">תדר יסוד בסיסי (תו התייחסות):</span>
                          <span className="font-mono font-bold text-indigo-600">{conceptBaseFreq} Hz ({getClosestNote(conceptBaseFreq)})</span>
                        </div>
                        <input
                          type="range"
                          min={110}
                          max={440}
                          step={5}
                          value={conceptBaseFreq}
                          onChange={(e) => { setConceptBaseFreq(Number(e.target.value)); stopConceptTones(); }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>לה נמוך (A2 - 110Hz)</span>
                          <span>לה אמצעי (A3 - 220Hz)</span>
                          <span>לה גבוה (A4 - 440Hz)</span>
                        </div>
                      </div>

                      {/* Active Concept Explanations */}
                      <div className="p-3 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed">
                        {selectedConcept === 'sound' && (
                          <p>
                            🔊 <strong>פיזיקת הצליל:</strong> גל מכני מחזורי באוויר. בגרף מעל, גל היסוד מייצג את התדר הבסיסי שבו מיתר הגיטרה או עמוד האוויר רוטט. ללא רטט - אין לחץ קול ואין מוזיקה!
                          </p>
                        )}
                        {selectedConcept === 'note' && (
                          <p>
                            🎵 <strong>מהו תו מוזיקלי?</strong> גובה צליל מוגדר המיוצג ע"י תדר גל קבוע. בסולם המערבי, קבעו כי התו <strong>A4</strong> ירטוט בדיוק ב-<strong>440 הרץ</strong>, וממנו נגזרים שאר התווים ביחסים מתמטיים קבועים.
                          </p>
                        )}
                        {selectedConcept === 'scale' && (
                          <p>
                            🎼 <strong>סולם מוזיקלי (Musical Scale):</strong> סדרה מסודרת של צלילים (תווים) במרווחים ספציפיים המהווה בסיס ליצירה מוזיקלית. קשר הדוק קיים בין סולם הרמוני לבין תדרים פיזיקליים: המרווחים העיקריים בסולם נגזרים מיחסים מתמטיים של שלמים קטנים (כמו מרווח הקווינטה שהוא בדיוק יחס של 3:2, המודגם כאן בסופרפוזיציה של המיתרים!).
                          </p>
                        )}
                        {selectedConcept === 'octave' && (
                          <p>
                            🎼 <strong>אוקטבה (מרווח 1:2):</strong> המרווח הבסיסי והעוצמתי ביותר במוזיקה! כאשר תדר מוכפל פי 2 (למשל מ-220Hz ל-440Hz), המוח שומע את אותה הנימה בדיוק, אך ב"קומה" גבוהה יותר. המיתר ההרמוני מציג בדיוק 2 לולאות על פני לולאה בודדת אחת!
                          </p>
                        )}
                        {selectedConcept === 'tone' && (
                          <p>
                            🎹 <strong>טון (Tone):</strong> המרחק בין שני קלידים סמוכים לבנים בפסנתר (למשל מ-C ל-D). הוא שווה ערך מתמטי להכפלת התדר פי <strong>1.1225</strong> (2 חצאי טון). גורם להתאבכות צפופה ויוצר "חיכוך" קל באוזן.
                          </p>
                        )}
                        {selectedConcept === 'quarter_tone' && (
                          <p>
                            🎻 <strong>רבע טון (Quarter Tone):</strong> מרווח מיקרוטונאלי זעיר המכפיל את התדר פי <strong>1.0293</strong> בלבד (חצי של חצי טון!). רבע הטון הוא לב ליבה של המוזיקה המזרחית והמקאמים הערביים. מאחר והתדרים כה קרובים, השמעתם יחד יוצרת אפקט התאבכות פועם ועמוק הנקרא <strong>"פעימות" (Beats)</strong> אקוסטיות.
                          </p>
                        )}
                      </div>

                      {/* Interactive Tone Synthesis Buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onMouseDown={() => playConceptTones('base')}
                          onMouseUp={stopConceptTones}
                          onMouseLeave={stopConceptTones}
                          onTouchStart={() => playConceptTones('base')}
                          onTouchEnd={stopConceptTones}
                          className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>השמע צליל יסוד (Base)</span>
                        </button>

                        {selectedConcept !== 'sound' && selectedConcept !== 'note' && (
                          <>
                            <button
                              onMouseDown={() => playConceptTones('interval')}
                              onMouseUp={stopConceptTones}
                              onMouseLeave={stopConceptTones}
                              onTouchStart={() => playConceptTones('interval')}
                              onTouchEnd={stopConceptTones}
                              className="px-3 py-2 text-xs bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>השמע צליל מושווה</span>
                            </button>
                            <button
                              onMouseDown={() => playConceptTones('both')}
                              onMouseUp={stopConceptTones}
                              onMouseLeave={stopConceptTones}
                              onTouchStart={() => playConceptTones('both')}
                              onTouchEnd={stopConceptTones}
                              className="px-3 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>השמע יחדיו (סופרפוזיציה 🎶)</span>
                            </button>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block italic leading-none mt-1">(החזיקו את הלחיצה כדי להשמיע רציף, שחררו להשתקה)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PHYSICAL STRING PLUCKING LABORATORY */}
            {instrumentTab === 'guitar' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-wrap gap-2 justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">מעבדה פיזיקלית מתקדמת: פריטה וסינתזת מיתר</span>
                  <button
                    onClick={() => setShowConstituentsInPluck(!showConstituentsInPluck)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-sans font-bold transition-all border cursor-pointer ${showConstituentsInPluck ? 'bg-amber-600 text-white border-amber-500 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
                    title="לחצו כדי להראות או להסתיר את המודלים של ההרמוניות השונות המרכיבות את הגל!"
                  >
                    {showConstituentsInPluck ? 'הסתר מרכיבי פורייה הרמוניים 👁️' : 'הצג מודל פורייה הרמוני 👁️'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  מיתר גיטרה רוטט אינו מפיק רק תדר בודד. פריטה עליו מעוררת <strong>סופרפוזיציה של המון הרמוניות (כפולות תדר)</strong> בו-זמנית! 
                  במעבדה זו תוכלו לקבוע את הפרמטרים הפיזיקליים של המיתר ולבצע <strong>פריטה אינטראקטיבית</strong> עליו ישירות בקנבס!
                </p>

                {/* Physics Sliders Layout */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Slider L: String Length */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">📏 אורך המיתר (L):</span>
                      <span className="font-mono font-bold text-indigo-600">{pluckLength} ס"מ</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={100}
                      step={1}
                      value={pluckLength}
                      onChange={(e) => { setPluckLength(Number(e.target.value)); stopPluckedString(); }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 block">אורך קצר יותר 🠚 מעלה את התדר (צליל גבוה יותר)</span>
                  </div>

                  {/* Slider T: Tension */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">⚡ מתיחות המיתר (T):</span>
                      <span className="font-mono font-bold text-indigo-600">{pluckTension} N (ניוטון)</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={5}
                      value={pluckTension}
                      onChange={(e) => { setPluckTension(Number(e.target.value)); stopPluckedString(); }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 block">מתיחה חזקה יותר 🠚 מעלה את מהירות הגל v ואת התדר</span>
                  </div>

                  {/* Slider Mu: Mass density / thickness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">🧵 עובי / צפיפות מסה (μ):</span>
                      <span className="font-mono font-bold text-indigo-600">{pluckDensity.toFixed(1)} גרם/מטר</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={6.0}
                      step={0.1}
                      value={pluckDensity}
                      onChange={(e) => { setPluckDensity(Number(e.target.value)); stopPluckedString(); }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 block">מיתר עבה/כבד יותר 🠚 מאיט את הגל (צליל נמוך ועמוק)</span>
                  </div>

                </div>

                {/* Interactive Pluck Canvas Simulator */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">גררו ומשכו את המיתר בקנבס עם העכבר/מגע לפריטה:</span>
                    <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showConstituentsInPluck}
                        onChange={(e) => setShowConstituentsInPluck(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>הצג גלי הרמוניות מרכיבים (Harmonics)</span>
                    </label>
                  </div>

                  <canvas
                    ref={pluckCanvasRef}
                    width={550}
                    height={180}
                    onPointerDown={handlePluckPointerDown}
                    onPointerMove={handlePluckPointerMove}
                    onPointerUp={handlePluckPointerUp}
                    className="w-full h-[180px] bg-slate-950 rounded-xl border border-slate-800 cursor-grab active:cursor-grabbing block touch-none"
                    title="לחצו ומשכו מעלה/מטה על המיתר כדי לפרוט!"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 italic">💡 טיפ: פריטה קרוב לגשר (בקצה) מעוררת תדרים גבוהים וחדים. פריטה במרכז יוצרת צליל עמוק ונטול הרמוניות זוגיות!</span>
                    <button
                      onClick={playPluckedString}
                      className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{violinMode ? 'העבר קשת על המיתר (Bow 🎻)' : 'פרוט במיתר (Pluck 🎸)'}</span>
                    </button>
                  </div>
                </div>

                {/* Violin Bowing Mode & Stick-Slip Physics Section */}
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/80 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="font-bold text-rose-900 text-xs block">🎻 חקר כינור: אפקט הנגינה בקשת (Continuous Bowed String)</span>
                      <p className="text-rose-950 text-[11px] leading-relaxed">
                        בניגוד לפריטה המפיקה צליל דועך, נגינה בקשת יוצרת תנודה <strong>מתמשכת ועשירה להפליא בהרמוניות</strong>. המעבר למצב כינור משנה את תכונות הרטט ואת האופי המתמטי של ההרמוניות!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newMode = !violinMode;
                        setViolinMode(newMode);
                        stopPluckedString();
                      }}
                      className={`px-3 py-2 rounded-lg font-bold font-sans text-xs shrink-0 cursor-pointer transition-all border ${violinMode ? 'bg-rose-600 text-white border-rose-500 shadow shadow-rose-500/20' : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200'}`}
                    >
                      {violinMode ? 'כבה מצב קשת כינור 🎻' : 'הפעל מצב קשת כינור 🎻'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-rose-950">
                    <div className="bg-white/60 p-2.5 rounded-lg border border-rose-100/50">
                      <strong className="text-rose-900 block mb-0.5">⚙️ אפקט ה-Stick-Slip:</strong>
                      הקשת מצופה בשרף דביק (Rosin). היא אוחזת במיתר ומושכת אותו (Stick) עד שהכוח האלסטי מתגבר עליה, והמיתר מחליק חזרה במהירות (Slip). מחזור זה חוזר אלפי פעמים בשנייה ומפיק <strong>גל שן-מסור (Sawtooth Wave)</strong> קבוע!
                    </div>
                    <div className="bg-white/60 p-2.5 rounded-lg border border-rose-100/50">
                      <strong className="text-rose-900 block mb-0.5">📐 פינת הלמהולץ (Helmholtz):</strong>
                      הגל הנוצר במיתר בקשת אינו סינוס מעוגל, אלא גל משולש חד בעל קודקוד שבור (פינת הלמהולץ) הנע הלוך ושוב לאורך המיתר. זהו סוד הצליל הבהיר והמנסר של משפחת הכנורות!
                    </div>
                    <div className="bg-white/60 p-2.5 rounded-lg border border-rose-100/50">
                      <strong className="text-rose-900 block mb-0.5">🪵 תהודת תיבת העץ:</strong>
                      המיתר עצמו כמעט ואינו מזיז אוויר וצלילו חרישי. האנרגיה מועברת דרך הגשר (Bridge) לתיבת התהודה העשויה עץ, המהווה "פילטר אקוסטי" מתוחכם המגביר הרמוניות אנושיות (Formants) ייחודיות.
                    </div>
                  </div>
                </div>

                {/* Physics Formula Section */}
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs">
                  <h5 className="font-bold text-indigo-900">🔬 כיצד מתקבל תדר הצליל בפיזיקה?</h5>
                  <p className="text-indigo-950 leading-relaxed">
                    מהירות התפשטות הגל במיתר נקבעת על ידי המתיחות <span className="font-mono">T</span> וצפיפות המסה <span className="font-mono">μ</span>: &nbsp;
                    <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200">v = √ (T / μ)</span>.
                    תדר היסוד <span className="font-mono">f₁</span> נקבע לפי אורך המיתר <span className="font-mono">L</span>: &nbsp;
                    <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200">f₁ = v / 2L</span>.
                    שאר ההרמוניות הן כפולות שלמות: <span className="font-mono">f_n = n * f₁</span>. צורת הפריטה (איפה משכתם) קובעת אילו מההרמוניות הללו ישמעו חזק יותר!
                  </p>
                </div>

              </div>
            )}

            {/* TAB 3: FLUTE CYLINDER */}
            {instrumentTab === 'flute' && (
              <div className="space-y-4">
                <span className="text-sm font-semibold text-slate-800 block">סימולטור עמוד אוויר: חלילית</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  חליל פועל על ידי יצירת גל אורך עומד של לחץ אוויר בתוך צינור. 
                  כאשר נושפים בחלקו העליון, נוצרת מערבולת אוויר (fipple) המנדנדת את עמוד האוויר. 
                  חלילית קלאסית פתוחה בשני קצוותיה, ולכן בקצוות הלחץ חייב להיות שווה ללחץ האטמוספרי החיצוני (נקודת קמר של מהירות וצומת לחץ).
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="text-xs font-semibold text-indigo-900">תנאי קצה לעמוד אוויר אקוסטי:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">צינור פתוח משני קצותיו</div>
                      <div className="text-xs font-bold text-slate-800 font-mono mt-1">λ = 2L / n</div>
                      <div className="text-[10px] text-emerald-600 mt-1">מכיל הרמוניות זוגיות ואי-זוגיות</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">צינור סגור בקצה אחד</div>
                      <div className="text-xs font-bold text-slate-800 font-mono mt-1">λ = 4L / n (אי-זוגי)</div>
                      <div className="text-[10px] text-amber-600 mt-1">מכיל הרמוניות אי-זוגיות בלבד</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DRUM MEMBRANE */}
            {instrumentTab === 'drum' && (
              <div className="space-y-4">
                <span className="text-sm font-semibold text-slate-800 block">סימולטור קרום דו-ממדי: תוף</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  הקשה בתוף מריעדה קרום דו-ממדי מקובע בשוליו. כאן משוואת הגלים היא דו-ממדית. 
                  מכיוון שהתוף עגול, תדרי התנודה העצמיים שלו נפתרים באמצעות פונקציות בסל (Bessel functions). 
                  הרעש של התוף אינו נשמע כמלודיה מוגדרת כמו חליל או גיטרה, כיוון שההרמוניות שלו אינן כפולות שלמות של תדר היסוד (מערכת אינהרמונית).
                </p>

                {level === UserLevel.ACADEMIA && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                    <h5 className="text-xs font-bold text-indigo-900">🧪 פתרונות משוואת הגלים הדו-ממדית</h5>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      התדר ההרמוני של התוף z(r,θ,t) נקבע לפי האפסים של פונקציית בסל הראשונה: J_m(k_n R) = 0.
                      התדר ההרמוני השני למשל הוא פי 1.593 מתדר היסוד, והשלישי פי 2.135 - מה שמסביר את האופי הרועש של כלי הקשה.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Sidebar: Quick Physics & Sound Theory Information */}
          <div className="lg:col-span-4 p-6 bg-slate-50/50 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 block">מאפיינים אקוסטיים של כלי הנגינה</span>
              
              <div className="space-y-3 text-slate-700 text-xs leading-relaxed">
                {instrumentTab === 'concepts' && (
                  <>
                    <p>📖 <strong>ההתאבכות (Interference):</strong> כאשר שני גלים נפגשים, האמפליטודות שלהם מסתכמות. התאבכות בונה יוצרת צליל חזק, והתאבכות הורסת מחלישה אותו.</p>
                    <p>📖 <strong>פעימות אקוסטיות:</strong> מתקבלות כאשר מנגנים שני תדרים קרובים מאוד (כמו רבע טון). הגל המשולב משנה את עוצמתו בקצב קבוע ומייצר גלי פעימה.</p>
                  </>
                )}

                {instrumentTab === 'guitar' && (
                  <>
                    <p>🎸 <strong>מהירות הגל (v):</strong> במיתר פלדה של גיטרה חשמלית, מהירות הגל מגיעה למאות מטרים בשנייה!</p>
                    <p>🎸 <strong>הרמוניות:</strong> המיתר מקובע בשני קצוותיו, מה שמאלץ נקודות צומת (Node) בקצוות, ומכתיב את אופני התנודה המותרים.</p>
                  </>
                )}

                {instrumentTab === 'flute' && (
                  <>
                    <p>💨 <strong>חלילים</strong> מנצלים את מהירות הקול באוויר (~343 m/s). ככל שחוסמים חורים קרובים יותר לפיה, אורך הצינור האפקטיבי L קטן.</p>
                    <p>💨 צינור קצר יותר מייצר תדרי תהודה גבוהים יותר. בחורף, כשטמפרטורת האוויר יורדת, מהירות הקול יורדת מעט והחליל יישמע נמוך יותר (דיסוננס).</p>
                  </>
                )}

                {instrumentTab === 'drum' && (
                  <>
                    <p>🥁 <strong>עוצמת המתח (Tension)</strong> של קרום התוף קובעת את מהירות התפשטות הגלים השטחיים בקרום. מתיחה חזקה יותר תגרום לתוף להישמע בעל פיץ גבוה יותר.</p>
                    <p>🥁 מכת תוף קרוב למרכז מפעילה בעיקר את תדר היסוד (הבס), בעוד מכה בשוליים מעוררת את האופנים הגבוהים והבלתי-הרמוניים שיוצרים סאונד מתכתי וחד.</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>הידעת? חלוקת האוקטבה</span>
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                בעוד שבמוזיקה המערבית האוקטבה מחולקת ל-12 חצאי טונים שווים (Equal Temperament), במוזיקה הערבית המסורתית מחלקים אותה ל-24 רבעי טון, מה שמעניק מגוון רחב ורגישות מלודית עשירה במיוחד!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: How we hear & Bone Conduction */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100" dir="rtl">
          <h3 className="text-lg font-sans font-semibold text-slate-800">כיצד אנו שומעים והולכת עצם (Bone Conduction)</h3>
          <p className="text-xs text-slate-500 mt-1">
            גלו את ההבדל המכני שבין קליטת קול דרך עור התוף לבין קליטה ישירה באמצעות הולכת עצם בגולגולת
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12" dir="rtl">
          {/* Visual animation canvas */}
          <div className="lg:col-span-6 p-6 border-l border-slate-100 bg-slate-50/50">
            <div className="flex bg-slate-200/60 p-1 rounded-lg w-fit mb-4">
              <button
                onClick={() => setHearingPathTab('tympanic')}
                className={`px-3 py-1.5 text-xs font-sans rounded-md cursor-pointer transition-all ${hearingPathTab === 'tympanic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}
              >
                שמיעה תופית רגילה (Tympanic)
              </button>
              <button
                onClick={() => setHearingPathTab('bone_conduction')}
                className={`px-3 py-1.5 text-xs font-sans rounded-md cursor-pointer transition-all ${hearingPathTab === 'bone_conduction' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}
              >
                שמיעה בהולכת עצם (Bone Conduction)
              </button>
            </div>

            <canvas 
              ref={hearingCanvasRef} 
              width={340} 
              height={180} 
              className="w-full h-[180px] bg-white rounded-xl border border-slate-200 block"
            />
          </div>

          {/* Explanation panel */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold tracking-wider text-indigo-500 uppercase">
                {hearingPathTab === 'tympanic' ? 'מסלול הלחץ האקוסטי המכני' : 'עקיפת עור התוף והולכה ישירה'}
              </h4>

              {hearingPathTab === 'tympanic' ? (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    👂 <strong>שלב 1:</strong> גל הלחץ האקוסטי נאסף באפרכסת ונכנס לתעלת השמע החיצונית.
                  </p>
                  <p>
                    👂 <strong>שלב 2:</strong> גלי הלחץ דוחפים את <strong>עור התוף</strong> (Tympanic membrane) בקצב התדר.
                  </p>
                  <p>
                    👂 <strong>שלב 3:</strong> עצמי השמע (פטיש, סדן, ארכוף) מגבירים את התנועה המכנית ומעבירים אותה אל החלון הסגלגל של השבלול (Cochlea).
                  </p>
                  <p>
                    👂 <strong>שלב 4:</strong> נוזל השבלול זז ומעורר תאי שערה בקרום הבסיסי. המוח מתרגם זאת לצליל.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    💀 <strong>הולכת עצם:</strong> גלי קול המועברים ישירות לעצם הרקה (Temporal bone) עוקפים את תעלת השמע ואת עור התוף לחלוטין.
                  </p>
                  <p>
                    💀 הרעידות בעצם מתורגמות ישירות לגלי לחץ אקוסטיים בתוך נוזל <strong>השבלול האוזני</strong> (Cochlea), מבלי להרעיד את עצמי השמע התיכוניים.
                  </p>
                  <p>
                    💀 <strong>שימוש בטכנולוגיה:</strong> זהו הבסיס לאוזניות הולכת עצם המשמשות ספורטאים (כיוון שהאוזן נשארת פתוחה לרעשי סביבה) ומכשירי שמיעה מיוחדים (כגון BAHA) עבור אנשים בעלי פגיעה באוזן התיכונה.
                  </p>
                </div>
              )}
            </div>

            {level === UserLevel.ACADEMIA && (
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-[10px] text-indigo-800 leading-relaxed font-sans">
                <strong>התאמת עכבות (Impedance Matching):</strong> המעבר מתווך גז (אוויר) לתווך נוזלי (בתוך השבלול) כרוך באובדן אנרגיה עצום עקב הפרשי העכבות (Z_air ≈ 400, Z_fluid ≈ 1.5M Rayls). 
                האוזן התיכונה פותרת זאת על ידי מערכת מנופים מכנית המקטינה את שטח הפנים מעור התוף לחלון הסגלגל (פי 17), מה שמגדיל את הלחץ האקוסטי ב-26 דציבלים ומאפשר שמיעה יעילה.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
