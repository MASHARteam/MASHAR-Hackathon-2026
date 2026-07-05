import React, { useRef, useEffect, useState } from 'react';
import { UserLevel } from '../types';
import { 
  Play, Square, Info, Sliders, Volume2, VolumeX, Radio, 
  Maximize2, Minimize2, Eye, EyeOff, X, Activity, HelpCircle, CheckSquare
} from 'lucide-react';

interface WaveSimulatorProps {
  level: UserLevel;
}

export default function WaveSimulator({ level }: WaveSimulatorProps) {
  // Main physical parameters
  const [tension, setTension] = useState<number>(50);
  const [density, setDensity] = useState<number>(0.5);
  const [frequency1, setFrequency1] = useState<number>(440); // Fundamental (f1)
  const [frequency2, setFrequency2] = useState<number>(444); // For beats
  const [damping, setDamping] = useState<number>(0.005);
  const [dimension, setDimension] = useState<'1D' | '2D' | '3D'>('1D');
  const [waveMode, setWaveMode] = useState<'single' | 'standing' | 'beats' | 'packet' | 'synthesis'>('single');

  // Interactive controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.15);
  const [waveType, setWaveType] = useState<'custom' | 'sine' | 'square' | 'sawtooth'>('sine');

  // 8 Harmonics State
  const [amplitudes, setAmplitudes] = useState<number[]>([45, 0, 0, 0, 0, 0, 0, 0]);
  const [checked, setChecked] = useState<boolean[]>([true, false, false, false, false, false, false, false]);
  const [soloIndex, setSoloIndex] = useState<number | null>(null);

  // Layout / View States
  const [isFftEnlarged, setIsFftEnlarged] = useState<boolean>(false);
  const [isStringModalOpen, setIsStringModalOpen] = useState<boolean>(false);
  const [showConstituentInString, setShowConstituentInString] = useState<boolean>(true);
  const [showCompositeInString, setShowCompositeInString] = useState<boolean>(true);

  // Floating window position for vibrating string (Point 11)
  const [panelPos, setPanelPos] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Display mode for Domain 1 (Space vs Time vs Frequency Representation)
  const [displayType, setDisplayType] = useState<'space' | 'time' | 'freq'>('space');

  // Drag handlers for the floating panel (fixed ends vibrating string)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panelPos.x,
      y: e.clientY - panelPos.y
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("setPointerCapture failed", err);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanelPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      console.warn("releasePointerCapture failed", err);
    }
  };

  // Canvas and audio references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fftEnlargedCanvasRef = useRef<HTMLCanvasElement>(null);
  const stringCanvasRef = useRef<HTMLCanvasElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<(OscillatorNode | null)[]>(Array(8).fill(null));
  const gainNodesRef = useRef<(GainNode | null)[]>(Array(8).fill(null));
  const masterGainRef = useRef<GainNode | null>(null);

  const beatsOsc1Ref = useRef<OscillatorNode | null>(null);
  const beatsOsc2Ref = useRef<OscillatorNode | null>(null);
  const beatsGain1Ref = useRef<GainNode | null>(null);
  const beatsGain2Ref = useRef<GainNode | null>(null);

  const timeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const waveSpeed = Math.sqrt(tension / density);

  // Set Wave Presets (Point 2)
  const applyPreset = (type: 'sine' | 'square' | 'sawtooth') => {
    setWaveType(type);
    setWaveMode('synthesis');
    if (type === 'sine') {
      setAmplitudes([45, 0, 0, 0, 0, 0, 0, 0]);
      setChecked([true, false, false, false, false, false, false, false]);
    } else if (type === 'square') {
      setAmplitudes([45, 0, 45 / 3, 0, 45 / 5, 0, 45 / 7, 0]);
      setChecked([true, false, true, false, true, false, true, false]);
    } else if (type === 'sawtooth') {
      setAmplitudes([45, 45 / 2, 45 / 3, 45 / 4, 45 / 5, 45 / 6, 45 / 7, 45 / 8]);
      setChecked([true, true, true, true, true, true, true, true]);
    }
    setSoloIndex(null);
  };

  const handleAmplitudeChange = (idx: number, val: number) => {
    setWaveType('custom');
    const newAmps = [...amplitudes];
    newAmps[idx] = val;
    setAmplitudes(newAmps);
  };

  const handleCheckboxToggle = (idx: number) => {
    setWaveType('custom');
    const newChecked = [...checked];
    newChecked[idx] = !newChecked[idx];
    setChecked(newChecked);
  };

  const handleSoloToggle = (idx: number) => {
    if (soloIndex === idx) {
      setSoloIndex(null);
    } else {
      setSoloIndex(idx);
    }
  };

  // Web Audio Synthesizer Initialization & Dynamic Controls (Point 8)
  const startAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      if (waveMode === 'beats' || waveMode === 'packet') {
        // Beats Setup
        const osc1 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(frequency1, ctx.currentTime);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.5, ctx.currentTime);
        osc1.connect(g1);
        g1.connect(masterGain);
        osc1.start();
        beatsOsc1Ref.current = osc1;
        beatsGain1Ref.current = g1;

        const osc2 = ctx.createOscillator();
        const f2 = waveMode === 'beats' ? frequency2 : frequency1 + 5;
        osc2.frequency.setValueAtTime(f2, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.5, ctx.currentTime);
        osc2.connect(g2);
        g2.connect(masterGain);
        osc2.start();
        beatsOsc2Ref.current = osc2;
        beatsGain2Ref.current = g2;
      } else {
        // Synthesis / Harmonics Setup
        for (let i = 0; i < 8; i++) {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime((i + 1) * frequency1, ctx.currentTime);
          
          const g = ctx.createGain();
          const isSoloActive = soloIndex !== null;
          const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
          const ampRatio = amplitudes[i] / 60;
          // Soften higher frequencies
          const targetVol = isEnabled ? (ampRatio * (0.3 / (i + 1))) : 0;
          
          g.gain.setValueAtTime(targetVol, ctx.currentTime);
          osc.connect(g);
          g.connect(masterGain);
          osc.start();
          
          oscNodesRef.current[i] = osc;
          gainNodesRef.current[i] = g;
        }
      }
      setIsAudioPlaying(true);
    } catch (e) {
      console.error('Failed to initialize audio:', e);
    }
  };

  const stopAudio = () => {
    // Clean oscillators
    for (let i = 0; i < 8; i++) {
      if (oscNodesRef.current[i]) {
        try { oscNodesRef.current[i]?.stop(); } catch(e){}
        oscNodesRef.current[i]?.disconnect();
        oscNodesRef.current[i] = null;
      }
      if (gainNodesRef.current[i]) {
        gainNodesRef.current[i]?.disconnect();
        gainNodesRef.current[i] = null;
      }
    }
    if (beatsOsc1Ref.current) {
      try { beatsOsc1Ref.current.stop(); } catch(e){}
      beatsOsc1Ref.current.disconnect();
      beatsOsc1Ref.current = null;
    }
    if (beatsOsc2Ref.current) {
      try { beatsOsc2Ref.current.stop(); } catch(e){}
      beatsOsc2Ref.current.disconnect();
      beatsOsc2Ref.current = null;
    }
    if (beatsGain1Ref.current) { beatsGain1Ref.current.disconnect(); beatsGain1Ref.current = null; }
    if (beatsGain2Ref.current) { beatsGain2Ref.current.disconnect(); beatsGain2Ref.current = null; }

    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  // Handle master volume changes
  useEffect(() => {
    if (isAudioPlaying && masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume, isAudioPlaying]);

  // Synchronize oscillators dynamically
  useEffect(() => {
    if (isAudioPlaying && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (waveMode === 'beats' || waveMode === 'packet') {
        if (beatsOsc1Ref.current) beatsOsc1Ref.current.frequency.setValueAtTime(frequency1, ctx.currentTime);
        if (beatsOsc2Ref.current) {
          const f2 = waveMode === 'beats' ? frequency2 : frequency1 + 5;
          beatsOsc2Ref.current.frequency.setValueAtTime(f2, ctx.currentTime);
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const osc = oscNodesRef.current[i];
          const g = gainNodesRef.current[i];
          if (osc && g) {
            osc.frequency.setValueAtTime((i + 1) * frequency1, ctx.currentTime);
            const isSoloActive = soloIndex !== null;
            const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
            const ampRatio = amplitudes[i] / 60;
            const targetVol = isEnabled ? (ampRatio * (0.35 / (i + 1))) : 0;
            g.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.05);
          }
        }
      }
    }
  }, [frequency1, frequency2, amplitudes, checked, soloIndex, waveMode, isAudioPlaying]);

  // Reset oscillators when changing main waveMode
  useEffect(() => {
    if (isAudioPlaying) {
      stopAudio();
      startAudio();
    }
  }, [waveMode]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Shared Fourier FFT Spectrum drawing helper (Points 5, 6, 7)
  const drawFourierSpectrum = (
    ctx: CanvasRenderingContext2D,
    plotX: number,
    plotY: number,
    plotW: number,
    plotH: number,
    isLarge: boolean
  ) => {
    if (plotW <= 20 || plotH <= 20) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(plotX, plotY, plotW, plotH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = isLarge ? 2 : 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    const gridCols = isLarge ? 10 : 5;
    const gridRows = isLarge ? 8 : 4;
    for (let i = 1; i < gridCols; i++) {
      ctx.beginPath();
      ctx.moveTo(plotX + (i * plotW) / gridCols, plotY);
      ctx.lineTo(plotX + (i * plotW) / gridCols, plotY + plotH);
      ctx.stroke();
    }
    for (let i = 1; i < gridRows; i++) {
      ctx.beginPath();
      ctx.moveTo(plotX, plotY + (i * plotH) / gridRows);
      ctx.lineTo(plotX + plotW, plotY + (i * plotH) / gridRows);
      ctx.stroke();
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = isLarge ? '12px JetBrains Mono, sans-serif' : '8px JetBrains Mono, sans-serif';
    ctx.fillText(
      waveMode === 'beats' ? 'ספקטרום פעימות (FFT)' : waveMode === 'packet' ? 'ספקטרום חבילה (FFT)' : 'מרחב התדר (FFT)',
      plotX + 10,
      plotY + (isLarge ? 20 : 12)
    );

    const startX = isLarge ? plotX + 60 : plotX + 15;
    const endX = isLarge ? plotX + plotW - 40 : plotX + plotW - 15;
    const bottomY = isLarge ? plotY + plotH - 35 : plotY + plotH - 10;
    const maxGraphH = isLarge ? plotH - 70 : plotH - 25;

    // Draw Axes if large
    if (isLarge) {
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(startX, plotY + 10);
      ctx.lineTo(startX, bottomY);
      ctx.lineTo(endX, bottomY);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('תדר f (הרץ / Hz)', endX - 80, bottomY + 25);
      ctx.save();
      ctx.translate(plotX + 22, plotY + 110);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('עוצמה יחסית', 0, 0);
      ctx.restore();
    }

    if (waveMode === 'beats') {
      const fMidX = (startX + endX) / 2;
      const f1X = fMidX - (isLarge ? 25 : 8);
      const f2X = fMidX + (isLarge ? 25 : 8);
      const h1 = (40 / 60) * maxGraphH;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = isLarge ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(f1X, bottomY);
      ctx.lineTo(f1X, bottomY - h1);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(f2X, bottomY);
      ctx.lineTo(f2X, bottomY - h1);
      ctx.stroke();

      if (isLarge) {
        ctx.fillStyle = '#10b981';
        ctx.fillText(`f₁ = ${frequency1}Hz`, f1X - 25, bottomY - h1 - 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`f₂ = ${frequency2}Hz`, f2X - 10, bottomY - h1 - 8);
      }
    } else if (waveMode === 'packet') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const points = 40;
      const stepX = (endX - startX) / points;
      const centerF = (startX + endX) / 2;
      const fSpread = isLarge ? 40 : 15;

      for (let i = 0; i <= points; i++) {
        const px = startX + i * stepX;
        const amp = 45 * Math.exp(-Math.pow((px - centerF) / fSpread, 2));
        const py = bottomY - (amp / 60) * maxGraphH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      // 8 Harmonics Spectral Peaks (Point 6)
      const stepH = (endX - startX) / 7;
      for (let i = 0; i < 8; i++) {
        const hX = startX + i * stepH;
        const isSoloActive = soloIndex !== null;
        const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
        const ampVal = isEnabled ? amplitudes[i] : 0;
        const hHeight = (ampVal / 60) * maxGraphH;

        ctx.strokeStyle = isEnabled ? `hsl(${(i * 45) % 360}, 80%, 60%)` : '#475569';
        ctx.lineWidth = isLarge ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(hX, bottomY);
        ctx.lineTo(hX, bottomY - hHeight);
        ctx.stroke();

        if (isLarge) {
          ctx.fillStyle = isEnabled ? '#f8fafc' : '#475569';
          ctx.fillText(`H${i + 1}`, hX - 6, bottomY + 12);
          ctx.font = '8px monospace';
          ctx.fillText(`${(i + 1) * frequency1}Hz`, hX - 18, bottomY + 22);
        }
      }
    }
  };

  // Draggable Floating standing string renderer (Point 11)
  const drawVibratingString = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (w <= 20 || h <= 0) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const centerY = h / 2;
    const t = timeRef.current;
    const omegaVal = 2 * Math.PI * 0.03; // comfortable visual speed

    // Draw boundary nodes at the fixed ends
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(10, centerY, 5, 0, Math.PI * 2);
    ctx.arc(w - 10, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal string line guide
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(w - 10, centerY);
    ctx.stroke();

    // Draw individual constituent harmonics if enabled (dimmer colors)
    if (showConstituentInString) {
      if (waveMode === 'standing') {
        const numLoops = Math.max(1, Math.round(frequency1 / 110));
        const standingK = (numLoops * Math.PI) / (w - 20);

        // Forward wave (translucent pink)
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 10; x < w - 10; x++) {
          const standingY = 20 * Math.sin(standingK * (x - 10) - numLoops * omegaVal * t);
          if (x === 10) ctx.moveTo(x, centerY - standingY);
          else ctx.lineTo(x, centerY - standingY);
        }
        ctx.stroke();

        // Backward wave (translucent green)
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 10; x < w - 10; x++) {
          const standingY = 20 * Math.sin(standingK * (x - 10) + numLoops * omegaVal * t);
          if (x === 10) ctx.moveTo(x, centerY - standingY);
          else ctx.lineTo(x, centerY - standingY);
        }
        ctx.stroke();
      } else if (waveMode !== 'beats' && waveMode !== 'packet' && waveMode !== 'single') {
        for (let i = 0; i < 8; i++) {
          const isSoloActive = soloIndex !== null;
          const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
          if (!isEnabled || amplitudes[i] === 0) continue;

          ctx.strokeStyle = `hsla(${(i * 45) % 360}, 60%, 50%, 0.35)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();

          for (let x = 10; x < w - 10; x++) {
            const ratio = (x - 10) / (w - 20); // 0 to 1
            const standingY = amplitudes[i] * 0.6 * Math.sin((i + 1) * Math.PI * ratio) * Math.cos((i + 1) * omegaVal * t);
            if (x === 10) ctx.moveTo(x, centerY - standingY);
            else ctx.lineTo(x, centerY - standingY);
          }
          ctx.stroke();
        }
      }
    }

    // Draw superposition composite final string shape
    if (showCompositeInString) {
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();

      for (let x = 10; x < w - 10; x++) {
        const ratio = (x - 10) / (w - 20); // 0 to 1
        let compositeY = 0;

        if (waveMode === 'beats') {
          // Standing wave beats simulation
          const standingK = Math.PI / (w - 20);
          compositeY = 30 * Math.sin(standingK * (x - 10)) * Math.cos(omegaVal * t) * Math.cos(omegaVal * 0.1 * t);
        } else if (waveMode === 'packet') {
          // Standing wave packet
          const standingK = Math.PI / (w - 20);
          const packetCenter = w / 2 + Math.sin(t * 0.05) * (w / 3);
          const env = Math.exp(-Math.pow((x - packetCenter) / 50, 2));
          compositeY = 40 * Math.sin(standingK * 5 * (x - 10)) * Math.cos(omegaVal * t) * env;
        } else if (waveMode === 'standing') {
          // Standing wave loops responding to frequency
          const numLoops = Math.max(1, Math.round(frequency1 / 110));
          const standingK = (numLoops * Math.PI) / (w - 20);
          compositeY = 40 * Math.sin(standingK * (x - 10)) * Math.cos(numLoops * omegaVal * t);
        } else {
          // Single wave & 8 harmonics sum
          const isSingle = waveMode === 'single';
          if (isSingle) {
            compositeY = amplitudes[0] * 0.6 * Math.sin(1 * Math.PI * ratio) * Math.cos(1 * omegaVal * t);
          } else {
            for (let i = 0; i < 8; i++) {
              const isSoloActive = soloIndex !== null;
              const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
              if (!isEnabled) continue;
              compositeY += amplitudes[i] * 0.6 * Math.sin((i + 1) * Math.PI * ratio) * Math.cos((i + 1) * omegaVal * t);
            }
          }
        }

        if (x === 10) ctx.moveTo(x, centerY - compositeY);
        else ctx.lineTo(x, centerY - compositeY);
      }
      ctx.stroke();
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 340;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      if (isPlaying) {
        timeRef.current += 0.035;
      }

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      if (displayType === 'freq') {
        drawFourierSpectrum(ctx, 0, 0, w, h, true);
        
        if (isStringModalOpen && stringCanvasRef.current) {
          const sCanvas = stringCanvasRef.current;
          const sCtx = sCanvas.getContext('2d');
          if (sCtx) {
            drawVibratingString(sCtx, sCanvas.width, sCanvas.height);
          }
        }
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // --- Draw Labeled Grid & Axes (Point 4) ---
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 30; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Main Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, centerY);
      ctx.lineTo(w - 20, centerY); // X-axis
      ctx.moveTo(45, 20);
      ctx.lineTo(45, h - 20); // Y-axis
      ctx.stroke();

      // Axes arrows
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(w - 15, centerY);
      ctx.lineTo(w - 23, centerY - 4);
      ctx.lineTo(w - 23, centerY + 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(45, 12);
      ctx.lineTo(41, 20);
      ctx.lineTo(49, 20);
      ctx.fill();

      // Axis labels (He)
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      if (displayType === 'space') {
        ctx.fillText('מיקום בתווך x (מטרים)', w - 120, centerY + 18);
        ctx.fillText('העתק y (סמ)', 55, 25);
      } else {
        ctx.fillText('זמן t (שניות - היסטוריה משמאל לימין)', w - 210, centerY + 18);
        ctx.fillText('העתק y (סמ) בנקודה קבועה x₀', 55, 25);
      }

      const t = displayType === 'space' ? 0 : timeRef.current;

      // Rendering 1D/2D/3D wave shapes based on selected settings
      if (dimension === '1D') {
        // Physical wave property formulas based on real tension & density
        const f_vis = frequency1 / 100; // visual frequency factor
        const v_vis = waveSpeed * 10;   // visual wave speed factor
        const lambda1 = Math.max(25, (v_vis / f_vis) * 12);
        const k1 = (2 * Math.PI) / lambda1;
        const omega1 = k1 * (v_vis * 0.15); // visual angular frequency

        if (displayType === 'space') {
          // --- SPACE VIEW (y vs x) ---
          if (waveMode === 'beats') {
            // Beats: Phase and Group Velocity representation (Point 3)
            const f2_vis = frequency2 / 100;
            const lambda2 = Math.max(25, (v_vis / f2_vis) * 12);
            const k2 = (2 * Math.PI) / lambda2;
            const omega2 = k2 * (v_vis * 0.15);

            const deltaK = k2 - k1;
            const kAvg = (k1 + k2) / 2;
            const deltaOmega = omega2 - omega1;
            const omegaAvg = (omega1 + omega2) / 2;

            // Top and Bottom envelope (Beats boundaries) - STRONGER (Point 4)
            ctx.strokeStyle = '#f59e0b'; // solid prominent amber
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2.5;
            
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const env = 2 * 30 * Math.cos((deltaK / 2) * (x - 45) - (deltaOmega / 2) * t);
              if (x === 45) ctx.moveTo(x, centerY - Math.abs(env));
              else ctx.lineTo(x, centerY - Math.abs(env));
            }
            ctx.stroke();

            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const env = 2 * 30 * Math.cos((deltaK / 2) * (x - 45) - (deltaOmega / 2) * t);
              if (x === 45) ctx.moveTo(x, centerY + Math.abs(env));
              else ctx.lineTo(x, centerY + Math.abs(env));
            }
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Carrier Wave
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const env = 2 * 30 * Math.cos((deltaK / 2) * (x - 45) - (deltaOmega / 2) * t);
              const y = env * Math.sin(kAvg * (x - 45) - omegaAvg * t);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Phase vs Group velocity dots (no running text on screen) (Point 4)
            const vg = deltaK === 0 ? 0 : deltaOmega / deltaK;
            const vp = kAvg === 0 ? 0 : omegaAvg / kAvg;
            
            const groupX = 45 + ((vg * t * 150) % (w - 80));
            const phaseX = 45 + ((vp * t * 150) % (w - 80));

            // Draw group velocity indicator (Green)
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(groupX, centerY - 2 * 30 * Math.cos((deltaK / 2) * (groupX - 45) - (deltaOmega / 2) * t), 7, 0, Math.PI * 2);
            ctx.fill();

            // Draw phase velocity indicator (Red)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(phaseX, centerY - 2 * 30 * Math.cos((deltaK / 2) * (phaseX - 45) - (deltaOmega / 2) * t) * Math.sin(kAvg * (phaseX - 45) - omegaAvg * t), 5, 0, Math.PI * 2);
            ctx.fill();

            // Show a fixed clean legend for the dots at the top
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('● מהירות חבורה (מעטפת): ירוק', 55, h - 35);
            ctx.fillText('● מהירות פאזה (גל פנימי): אדום', 55, h - 20);

          } else if (waveMode === 'packet') {
            // Wave packet Gaussian envelope with dynamic dots - STRONGER (Point 5)
            ctx.strokeStyle = '#22c55e'; // solid prominent green
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const packetCenter = 45 + ((t * v_vis * 0.15) % (w - 90));
            
            for (let x = 45; x < w - 20; x++) {
              const env = 45 * Math.exp(-Math.pow((x - packetCenter) / 45, 2));
              if (x === 45) ctx.moveTo(x, centerY - env);
              else ctx.lineTo(x, centerY - env);
            }
            ctx.stroke();

            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const env = 45 * Math.exp(-Math.pow((x - packetCenter) / 45, 2));
              if (x === 45) ctx.moveTo(x, centerY + env);
              else ctx.lineTo(x, centerY + env);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Packet wave
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const env = 45 * Math.exp(-Math.pow((x - packetCenter) / 45, 2));
              const y = env * Math.sin(k1 * (x - 45) - omega1 * t);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Indicator (no moving text) (Point 5)
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(packetCenter, centerY - 45, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('● מהירות חבורה (מרכז פולס): ירוק', 55, h - 20);

          } else if (waveMode === 'standing') {
            // Standard standing wave - RESPONDING TO FREQUENCY (Point 3)
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const numLoops = Math.max(1, Math.round(frequency1 / 110));
            const standingK = (numLoops * Math.PI) / (w - 65);
            for (let x = 45; x < w - 20; x++) {
              const y = 40 * Math.sin(standingK * (x - 45)) * Math.cos(numLoops * omega1 * t);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Nodes and Antinodes markings
            for (let n = 0; n <= numLoops; n++) {
              const nodeX = 45 + (n * (w - 65)) / numLoops;
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(nodeX, centerY, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.font = '8px monospace';
              ctx.fillText('צומת', nodeX - 10, centerY + 14);
            }
          } else {
            // Synthesis (8 Harmonics) & Single Modes (Points 1, 6)
            const isSingle = waveMode === 'single';
            // Translucent constituent harmonics
            if (!isSingle) {
              for (let i = 0; i < 8; i++) {
                const isSoloActive = soloIndex !== null;
                const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
                if (!isEnabled || amplitudes[i] === 0) continue;

                ctx.strokeStyle = `hsla(${(i * 45) % 360}, 65%, 55%, 0.25)`;
                ctx.lineWidth = 1;
                ctx.beginPath();

                const kn = k1 * (i + 1);
                const omegaN = omega1 * (i + 1);

                for (let x = 45; x < w - 20; x++) {
                  const y = amplitudes[i] * Math.sin(kn * (x - 45) - omegaN * t);
                  if (x === 45) ctx.moveTo(x, centerY - y);
                  else ctx.lineTo(x, centerY - y);
                }
                ctx.stroke();
              }
            }

            // Composite glowing thick wave
            ctx.strokeStyle = '#00f2ff';
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let x = 45; x < w - 20; x++) {
              let compositeY = 0;
              if (isSingle) {
                compositeY = amplitudes[0] * Math.sin(k1 * (x - 45) - omega1 * t);
              } else {
                for (let i = 0; i < 8; i++) {
                  const isSoloActive = soloIndex !== null;
                  const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
                  if (!isEnabled) continue;

                  const kn = k1 * (i + 1);
                  const omegaN = omega1 * (i + 1);
                  compositeY += amplitudes[i] * Math.sin(kn * (x - 45) - omegaN * t);
                }
              }

              if (x === 45) ctx.moveTo(x, centerY - compositeY);
              else ctx.lineTo(x, centerY - compositeY);
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
          }
        } else {
          // --- TIME VIEW (y vs t at fixed point x0) ---
          if (waveMode === 'beats') {
            const f2_vis = frequency2 / 100;
            const lambda2 = Math.max(25, (v_vis / f2_vis) * 12);
            const k2 = (2 * Math.PI) / lambda2;
            const omega2 = k2 * (v_vis * 0.15);

            const deltaK = k2 - k1;
            const kAvg = (k1 + k2) / 2;
            const deltaOmega = omega2 - omega1;
            const omegaAvg = (omega1 + omega2) / 2;
            const x0 = 100; // fixed probe point in space

            // Envelope (Beats boundaries) - STRONGER (Point 4)
            ctx.strokeStyle = '#f59e0b';
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2.5;
            
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const env = 2 * 30 * Math.cos((deltaK * x0 - deltaOmega * tau) / 2);
              if (x === 45) ctx.moveTo(x, centerY - Math.abs(env));
              else ctx.lineTo(x, centerY - Math.abs(env));
            }
            ctx.stroke();

            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const env = 2 * 30 * Math.cos((deltaK * x0 - deltaOmega * tau) / 2);
              if (x === 45) ctx.moveTo(x, centerY + Math.abs(env));
              else ctx.lineTo(x, centerY + Math.abs(env));
            }
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Carrier Wave
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const env = 2 * 30 * Math.cos((deltaK * x0 - deltaOmega * tau) / 2);
              const y = env * Math.sin(kAvg * x0 - omegaAvg * tau);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Bobbing red particle at the vertical axis
            const currentEnv = 2 * 30 * Math.cos((deltaK * x0 - deltaOmega * t) / 2);
            const currentY = currentEnv * Math.sin(kAvg * x0 - omegaAvg * t);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(45, centerY - currentY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Explanatory label on screen
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('צומת פעימות לאורך זמן בנקודה x₀ קבועה (מציג את האמפליטודה המשתנה)', 55, h - 20);

          } else if (waveMode === 'packet') {
            const x0 = 150;
            ctx.strokeStyle = '#22c55e';
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const packetCenter = 45 + ((tau * v_vis * 0.15) % (w - 90));
              const env = 45 * Math.exp(-Math.pow((x0 - packetCenter) / 45, 2));
              if (x === 45) ctx.moveTo(x, centerY - env);
              else ctx.lineTo(x, centerY - env);
            }
            ctx.stroke();

            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const packetCenter = 45 + ((tau * v_vis * 0.15) % (w - 90));
              const env = 45 * Math.exp(-Math.pow((x0 - packetCenter) / 45, 2));
              if (x === 45) ctx.moveTo(x, centerY + env);
              else ctx.lineTo(x, centerY + env);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Packet wave
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const packetCenter = 45 + ((tau * v_vis * 0.15) % (w - 90));
              const env = 45 * Math.exp(-Math.pow((x0 - packetCenter) / 45, 2));
              const y = env * Math.sin(k1 * x0 - omega1 * tau);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Bobbing red particle at the vertical axis
            const currentPacketCenter = 45 + ((t * v_vis * 0.15) % (w - 90));
            const currentEnv = 45 * Math.exp(-Math.pow((x0 - currentPacketCenter) / 45, 2));
            const currentY = currentEnv * Math.sin(k1 * x0 - omega1 * t);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(45, centerY - currentY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('חבורת גלים חולפת בנקודה x₀ קבועה (הגל מגיע, גדל וחולף)', 55, h - 20);

          } else if (waveMode === 'standing') {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const numLoops = Math.max(1, Math.round(frequency1 / 110));
            const standingK = (numLoops * Math.PI) / (w - 65);
            // Put x0 exactly at the first antinode for maximum oscillation visibility!
            const x0 = 45 + (w - 65) / (2 * numLoops);
            
            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              const y = 40 * Math.sin(standingK * (x0 - 45)) * Math.cos(numLoops * omega1 * tau);
              if (x === 45) ctx.moveTo(x, centerY - y);
              else ctx.lineTo(x, centerY - y);
            }
            ctx.stroke();

            // Red dot representing current value at first antinode
            const currentY = 40 * Math.sin(standingK * (x0 - 45)) * Math.cos(numLoops * omega1 * t);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(45, centerY - currentY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('תנודה הרמונית פשוטה של נקודה בגל עומד (באנטי-צומת)', 55, h - 20);

          } else {
            // Synthesis / Single Mode in Time View
            const x0 = 100;
            const isSingle = waveMode === 'single';
            // Translucent constituents
            if (!isSingle) {
              for (let i = 0; i < 8; i++) {
                const isSoloActive = soloIndex !== null;
                const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
                if (!isEnabled || amplitudes[i] === 0) continue;

                ctx.strokeStyle = `hsla(${(i * 45) % 360}, 65%, 55%, 0.25)`;
                ctx.lineWidth = 1;
                ctx.beginPath();

                const kn = k1 * (i + 1);
                const omegaN = omega1 * (i + 1);

                for (let x = 45; x < w - 20; x++) {
                  const tau = t - (x - 45) * 0.04;
                  const y = amplitudes[i] * Math.sin(kn * (x0 - 45) - omegaN * tau);
                  if (x === 45) ctx.moveTo(x, centerY - y);
                  else ctx.lineTo(x, centerY - y);
                }
                ctx.stroke();
              }
            }

            // Composite final wave
            ctx.strokeStyle = '#00f2ff';
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let x = 45; x < w - 20; x++) {
              const tau = t - (x - 45) * 0.04;
              let compositeY = 0;
              if (isSingle) {
                compositeY = amplitudes[0] * Math.sin(k1 * (x0 - 45) - omega1 * tau);
              } else {
                for (let i = 0; i < 8; i++) {
                  const isSoloActive = soloIndex !== null;
                  const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
                  if (!isEnabled) continue;

                  const kn = k1 * (i + 1);
                  const omegaN = omega1 * (i + 1);
                  compositeY += amplitudes[i] * Math.sin(kn * (x0 - 45) - omegaN * tau);
                }
              }

              if (x === 45) ctx.moveTo(x, centerY - compositeY);
              else ctx.lineTo(x, centerY - compositeY);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Red dot for current value
            let currentY = 0;
            if (isSingle) {
              currentY = amplitudes[0] * Math.sin(k1 * (x0 - 45) - omega1 * t);
            } else {
              for (let i = 0; i < 8; i++) {
                const isSoloActive = soloIndex !== null;
                const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);
                if (!isEnabled) continue;

                const kn = k1 * (i + 1);
                const omegaN = omega1 * (i + 1);
                currentY += amplitudes[i] * Math.sin(kn * (x0 - 45) - omegaN * t);
              }
            }
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(45, centerY - currentY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText('סופרפוזיציה של הרמוניות לאורך זמן בנקודה x₀ קבועה (מציג את חתימת הסאונד)', 55, h - 20);
          }
        }

        // Corner spectrum analyzer thumbnail
        if (level !== UserLevel.GENERAL) {
          drawFourierSpectrum(ctx, w - 160, 15, 145, 80, false);
        }

      } else {
        // Simple elegant 2D / 3D preview
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(
          dimension === '2D' ? 'מבט דו-ממדי: התאבכות סליט כפול' : 'מבט תלת-ממדי: רשת גלים מוארכת',
          w / 2 - 100,
          centerY
        );
      }

      // Live string canvas loop update (Point 11)
      if (isStringModalOpen && stringCanvasRef.current) {
        const sCanvas = stringCanvasRef.current;
        const sCtx = sCanvas.getContext('2d');
        if (sCtx) {
          drawVibratingString(sCtx, sCanvas.width, sCanvas.height);
        }
      }

      // Dynamic Modal update
      if (isFftEnlarged && fftEnlargedCanvasRef.current) {
        const modalCanvas = fftEnlargedCanvasRef.current;
        const modalCtx = modalCanvas.getContext('2d');
        if (modalCtx) {
          drawFourierSpectrum(modalCtx, 0, 0, modalCanvas.width, modalCanvas.height, true);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    frequency1, frequency2, amplitudes, checked, soloIndex, tension, density,
    damping, dimension, waveMode, isPlaying, level, isFftEnlarged, isStringModalOpen,
    showConstituentInString, showCompositeInString, displayType
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" id="wave-sim-main">
      {/* Top Banner with Physical Status */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="font-sans font-bold text-lg text-white">סימולטור יסודות הגלים וסנתזת פורייה</h3>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">מהירות גל בתווך:</span>
          <span className="text-sm font-mono text-indigo-400 font-bold">
            {waveSpeed.toFixed(2)} m/s
          </span>
        </div>
      </div>

      {/* Simulator Canvas Frame */}
      <div className="relative bg-slate-950">
        <canvas ref={canvasRef} className="w-full block h-[340px] bg-slate-950" />

        {/* FFT Enlarge Button (Point 5) */}
        {level !== UserLevel.GENERAL && (
          <button
            onClick={() => setIsFftEnlarged(true)}
            className="absolute top-4 right-4 p-2 bg-slate-800/95 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors border border-slate-600"
            title="הגדל גרף תדרים"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>הגדל FFT</span>
          </button>
        )}

        {/* Controls Bar Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl border border-white/10" dir="rtl">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer text-white"
            >
              {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => { if (isAudioPlaying) stopAudio(); else startAudio(); }}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer ${isAudioPlaying ? 'bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isAudioPlaying ? 'כבה סאונד' : 'השמע צליל'}</span>
            </button>

            {isAudioPlaying && (
              <input 
                type="range" 
                min="0.01" 
                max="0.3" 
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 cursor-pointer rounded-lg bg-slate-700 accent-indigo-400"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Dimensions */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs">
              {(['1D', '2D'] as const).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setDimension(dim)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${dimension === dim ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  {dim}
                </button>
              ))}
            </div>

            {/* Display Mode: Space vs Time vs Frequency (Point 2) */}
            {dimension === '1D' && (
              <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setDisplayType('space')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${displayType === 'space' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                  title="תמונת מצב במרחב (y vs x)"
                >
                  מרחב (y vs x)
                </button>
                <button
                  onClick={() => setDisplayType('time')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${displayType === 'time' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                  title="השתנות בזמן עבור נקודה קבועה (y vs t)"
                >
                  זמן (y vs t)
                </button>
                <button
                  onClick={() => setDisplayType('freq')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${displayType === 'freq' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                  title="מרחב התדר: אמפליטודה כתלות בתדר"
                >
                  תדר (ספקטרום)
                </button>
              </div>
            )}

            {/* Modes selector */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setWaveMode('single')}
                className={`px-2 py-1 rounded-md cursor-pointer ${waveMode === 'single' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                גל יחיד
              </button>
              <button
                onClick={() => setWaveMode('standing')}
                className={`px-2 py-1 rounded-md cursor-pointer ${waveMode === 'standing' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                גל עומד
              </button>
              <button
                onClick={() => setWaveMode('beats')}
                className={`px-2 py-1 rounded-md cursor-pointer ${waveMode === 'beats' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                פעימות
              </button>
              <button
                onClick={() => setWaveMode('packet')}
                className={`px-2 py-1 rounded-md cursor-pointer ${waveMode === 'packet' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                חבורה
              </button>
              <button
                onClick={() => setWaveMode('synthesis')}
                className={`px-2 py-1 rounded-md cursor-pointer ${waveMode === 'synthesis' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                הרמוניות
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control sliders and explanations */}
      <div className="p-6 bg-slate-50/50" dir="rtl">
        {/* Preset Selector Panel (Point 2) */}
        {waveMode === 'synthesis' && (
          <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Radio className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>מחולל סוגי גל מוכנים (Presets):</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => applyPreset('sine')}
                className={`px-4 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${waveType === 'sine' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                סינוס טהור
              </button>
              <button
                onClick={() => applyPreset('square')}
                className={`px-4 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${waveType === 'square' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                גל מרובע (Square)
              </button>
              <button
                onClick={() => applyPreset('sawtooth')}
                className={`px-4 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${waveType === 'sawtooth' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                שן מסור (Sawtooth)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel parameters */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="font-sans font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>פרמטרים פיזיקליים לשליטה</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">מתיחות התווך (T)</label>
                  <span className="font-bold text-indigo-600">{tension} N</span>
                </div>
                <input 
                  type="range" min="10" max="150" value={tension}
                  onChange={(e) => setTension(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">צפיפות מסה (μ)</label>
                  <span className="font-bold text-indigo-600">{density} kg/m</span>
                </div>
                <input 
                  type="range" min="0.1" max="2.0" step="0.05" value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">תדר בסיסי (f₁)</label>
                  <span className="font-bold text-emerald-600">{frequency1} Hz</span>
                </div>
                <input 
                  type="range" min="110" max="880" value={frequency1}
                  onChange={(e) => setFrequency1(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">תדר גל שני (f₂)</label>
                  <span className="font-bold text-amber-600">{frequency2} Hz</span>
                </div>
                <input 
                  type="range" min="110" max="880" value={frequency2}
                  disabled={waveMode !== 'beats'}
                  onChange={(e) => setFrequency2(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Launch physical string fixed ends button (Point 11) */}
            <button
              onClick={() => setIsStringModalOpen(!isStringModalOpen)}
              className={`w-full py-3 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center justify-center gap-2 transition-all ${isStringModalOpen ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
            >
              <Radio className="w-4 h-4" />
              <span>{isStringModalOpen ? 'סגור הדמיית מיתר פיזיקלי' : 'פתח חלון הדמיית מיתר פיזיקלי (קצוות קבועים)'}</span>
            </button>
          </div>

          {/* Right panel 8 Harmonics Editor & Checkboxes (Point 1, 8) */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="font-sans font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>בקרת הרמוניות (Fourier Synthesizer)</span>
            </h4>

            {waveMode !== 'synthesis' ? (
              <div className="p-4 bg-slate-100 text-slate-500 rounded-xl text-center text-xs">
                עברו למצב <strong className="text-indigo-600">"הרמוניות"</strong> בסימולטור למעלה כדי לערוך, לסנתז ולשמוע את 8 ההרמוניות השונות!
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2.5 max-h-[320px] overflow-y-auto">
                {Array(8).fill(0).map((_, i) => {
                  const f = (i + 1) * frequency1;
                  const isSoloActive = soloIndex !== null;
                  const isEnabled = checked[i] && (!isSoloActive || soloIndex === i);

                  return (
                    <div key={i} className={`flex items-center justify-between gap-3 p-1.5 rounded-lg border ${isEnabled ? 'bg-slate-50 border-slate-100' : 'opacity-60 border-transparent'}`}>
                      {/* Checkbox (Point 8) */}
                      <button
                        onClick={() => handleCheckboxToggle(i)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${checked[i] ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                      >
                        {checked[i] ? '✓' : '✖'}
                      </button>

                      {/* Harmonic Tag */}
                      <div className="text-right w-24">
                        <div className="text-[10px] font-bold text-slate-800">הרמוניה {i + 1}</div>
                        <div className="text-[9px] font-mono text-slate-500">{f} Hz</div>
                      </div>

                      {/* Volume Slider */}
                      <input 
                        type="range" min="0" max="60" value={amplitudes[i]}
                        onChange={(e) => handleAmplitudeChange(i, parseInt(e.target.value))}
                        className="flex-1 cursor-pointer accent-indigo-500"
                        title={`אמפליטודת הרמוניה ${i + 1}`}
                      />

                      {/* Solo trigger (Point 8) */}
                      <button
                        onClick={() => handleSoloToggle(i)}
                        className={`px-2.5 py-1 text-[9px] font-sans font-bold rounded-md transition-colors cursor-pointer ${soloIndex === i ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        סולו
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Beat / Packet Explanation Cards (Point 3) */}
        <div className="mt-6 space-y-4">
          {waveMode === 'beats' && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <h6 className="font-bold flex items-center gap-1">
                <Info className="w-4 h-4 text-amber-600" />
                <span>מהו ההבדל בין פעימה לחבורת גלים?</span>
              </h6>
              <p>
                <strong>פעימה (Beat)</strong> היא מקרה פרטי קלאסי של חבילת גלים המורכבת מ<strong>שני תדרים בודדים בלבד</strong> בעלי ערכים קרובים מאוד. 
                ההפרש ביניהם מייצר גל התאבכות שהאמפליטודה שלו משתנה בצורת מעטפת מחזורית, בתדר השווה בדיוק להפרש: <code className="font-bold font-mono">f_beat = |f₁ - f₂|</code>.
              </p>
            </div>
          )}
          {waveMode === 'packet' && (
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-xs text-sky-900 space-y-2">
              <h6 className="font-bold flex items-center gap-1">
                <Info className="w-4 h-4 text-sky-600" />
                <span>מהו קשר אי-הוודאות של פורייה בחבילות גלים?</span>
              </h6>
              <p>
                בניגוד לפעימה המורכבת משני גלים, <strong>חבורת גלים (Wave Packet)</strong> היא פולס המתוחם במרחב. 
                ככל שחבילת הגל צרה וממוקדת יותר (Δx קטן), כך נדרש מגוון רחב ועמוס יותר של תדרים שונים (Δk גדול) כדי ליצור אותה באמצעות סופרפוזיציה. 
                זהו המקור הפיזיקלי של <strong>עקרון אי-הוודאות של הייזנברג</strong> במכניקת הקוונטים!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- FFT ENLARGED MODEL (Point 5) --- */}
      {isFftEnlarged && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-[740px] max-w-full space-y-4 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setIsFftEnlarged(false)}
              className="absolute top-4 left-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-indigo-400" />
              <span>ניתוח תדרים מורחב בזמן אמת - Fourier FFT Graph</span>
            </h3>
            <p className="text-xs text-slate-400">
              התמרת פורייה (FFT) מציגה את הגל במרחב התדר. כל קו אנכי מייצג הרמוניה בדידה; 
              האינטראקציות ביניהן קובעות את חתימת הסאונד (Timbre) שאתם שומעים.
            </p>
            <canvas ref={fftEnlargedCanvasRef} width={680} height={320} className="w-full bg-slate-950 rounded-2xl block border border-slate-800" />
          </div>
        </div>
      )}

      {/* --- DRAGGABLE STANDING STRING PANEL OVERLAY (Point 11) --- */}
      {isStringModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            left: `${panelPos.x}px`, 
            top: `${panelPos.y}px`, 
            zIndex: 100 
          }}
          className="w-[420px] max-w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 p-4 shadow-2xl space-y-3 pointer-events-auto"
          dir="rtl"
        >
          {/* Draggable Header */}
          <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="drag-handle cursor-move bg-slate-800/80 p-2.5 rounded-xl flex justify-between items-center select-none"
          >
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">מיתר קצוות קבועים (דו-מימדי פיזיקלי)</span>
            </div>
            <button 
              onClick={() => setIsStringModalOpen(false)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            הדמיית מיתר פיזיקלי המקובע בשני קצוותיו (עקרון תנודות עומדות של כלי מיתר).
          </p>

          <canvas ref={stringCanvasRef} width={380} height={150} className="w-full h-[150px] rounded-xl bg-slate-950 border border-slate-800" />

          {/* Controls Inside Panel */}
          <div className="flex justify-between items-center gap-4 text-[11px] pt-1 border-t border-slate-800">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showConstituentInString}
                onChange={(e) => setShowConstituentInString(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>הצג הרמוניות מרכיבות בצבעים שונים</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showCompositeInString}
                onChange={(e) => setShowCompositeInString(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span className="font-bold">הצג מיתר שקול סופי</span>
            </label>
          </div>
        </div>
      )}

    </div>
  );
}
