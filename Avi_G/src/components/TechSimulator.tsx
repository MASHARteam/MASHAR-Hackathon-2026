import React, { useRef, useEffect, useState } from 'react';
import { UserLevel } from '../types';
import { Radio, Zap, Eye, Activity, Shield, Info, HelpCircle } from 'lucide-react';

interface TechSimulatorProps {
  level: UserLevel;
}

export default function TechSimulator({ level }: TechSimulatorProps) {
  const [activeTechTab, setActiveTechTab] = useState<'microwave' | 'imaging' | 'ultrasound'>('microwave');

  // Microwave states
  const [mwFrequency, setMwFrequency] = useState<number>(2.45); // GHz
  const [mwPower, setMwPower] = useState<number>(800); // Watts
  const [mwTemp, setMwTemp] = useState<number>(20); // Degrees C
  const [isMwOn, setIsMwOn] = useState<boolean>(false);
  // Wave packet parameters (Requirement 1.10)
  const [mwPulseDuration, setMwPulseDuration] = useState<number>(4.0); // ms (wave packet width)
  const [isMwPacketMode, setIsMwPacketMode] = useState<boolean>(false);
  const [mwPacketProgress, setMwPacketProgress] = useState<number>(-50); // custom animation offset

  // Imaging states
  const [imagingType, setImagingType] = useState<'thermal' | 'xray'>('thermal');
  const [tissueThickness, setTissueThickness] = useState<number>(50); // mm
  
  // Thermal Camera radiating bodies (Requirement 1.11)
  const [thermalBody, setThermalBody] = useState<'human' | 'coffee' | 'ice' | 'heater'>('human');

  // X-Ray parameters & devices (Requirement 1.12)
  const [xrayDevice, setXrayDevice] = useState<'dental' | 'chest' | 'ct'>('chest');
  const [xrayVoltage, setXrayVoltage] = useState<number>(80); // kV
  const [xrayCurrent, setXrayCurrent] = useState<number>(50); // mA

  // Ultrasound states
  const [probePosition, setProbePosition] = useState<number>(50); // percent across womb
  const [ultrasoundFreq, setUltrasoundFreq] = useState<number>(5); // MHz

  const mwCanvasRef = useRef<HTMLCanvasElement>(null);
  const ultrasoundCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // --- Microwave animation loop (Water dipole rotation & standing waves) ---
  useEffect(() => {
    if (activeTechTab !== 'microwave') return;
    const canvas = mwCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;

    const render = () => {
      timeRef.current += isMwOn ? (mwPower / 1000) * 0.15 : 0.01;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw microwave oven cavity
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Cavity border
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      const t = timeRef.current;
      const waveCount = 5;
      
      if (isMwOn) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; // hot glow
        ctx.fillRect(10, 10, w - 20, h - 20);

        if (isMwPacketMode) {
          // --- Advanced Wave Packet Mode (Gaussian envelope) (Requirement 1.10) ---
          // Center moves from left to right
          const packetSpeed = 4.5;
          const center = ((t * packetSpeed * 30) % (w + 160)) - 80;
          
          // Width of packet is proportional to pulse duration (ms)
          const sigma = mwPulseDuration * 16; 

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 6;
          ctx.beginPath();

          for (let x = 15; x < w - 15; x++) {
            // Gaussian envelope: exp(-((x-center)/sigma)^2)
            const exponent = -Math.pow((x - center) / sigma, 2);
            const envelope = Math.exp(exponent);
            
            // Carrier wave: sin(k*x - omega*t)
            const k = 0.15; // wave number
            const omega = mwFrequency * 2.5;
            const carrier = Math.sin(k * x - t * omega);

            const y = h/2 + envelope * carrier * 50;

            if (x === 15) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw a text label for packet
          ctx.fillStyle = '#fca5a5';
          ctx.font = '10px JetBrains Mono, sans-serif';
          ctx.fillText(`חבילת גלים (Wave Packet): Δt = ${mwPulseDuration.toFixed(1)}ms`, 15, 25);
          
          // Spectral dispersion calculation
          // Δf = 1 / (2 * pi * Δt) -> in GHz range
          const freqSpread = 1 / (2 * Math.PI * (mwPulseDuration / 10)); // simulated GHz bandwidth
          ctx.fillText(`רוחב פס ספקטרלי (Fourier): Δf = ±${freqSpread.toFixed(3)} GHz`, 15, 40);
          ctx.fillText(`טווח תדרים: ${(mwFrequency - freqSpread).toFixed(2)} - ${(mwFrequency + freqSpread).toFixed(2)} GHz`, 15, 55);

        } else {
          // --- Classic Standing Wave Mode ---
          // Draw electromagnetic standing waves
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 15; x < w - 15; x++) {
            const y1 = h * 0.2 + Math.sin((x / w) * Math.PI * waveCount) * Math.cos(t * mwFrequency * 2) * 30;
            const y2 = h * 0.8 + Math.sin((x / w) * Math.PI * waveCount) * Math.cos(t * mwFrequency * 2) * 30;
            if (x === 15) {
              ctx.moveTo(x, y1);
            } else {
              ctx.lineTo(x, y1);
            }
          }
          ctx.stroke();

          // Highlight Hot and Cold spots
          ctx.font = '9px JetBrains Mono, sans-serif';
          for (let i = 0; i < waveCount; i++) {
            const nodeX = 15 + (i + 0.5) * (w - 30) / waveCount;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(nodeX, h/2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fca5a5';
            ctx.fillText('HOT', nodeX - 8, h/2 - 10);
          }
        }

        // Increase temp
        setMwTemp(prev => Math.min(100, prev + (mwPower / 1000) * 0.05));
      } else {
        ctx.fillStyle = '#334155';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('לחצו על "הפעל מיקרוגל" כדי להתחיל בחימום', w/2 - 110, h/2);
      }

      // Draw plate inside
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(w * 0.15, h - 35, w * 0.7, 10);

      // Draw stylized Water Molecules rotating (representing H2O dipoles)
      const numMolecules = 6;
      for (let i = 0; i < numMolecules; i++) {
        // Distribute molecules on the plate
        const angle = (t * (isMwOn ? mwFrequency * 3 : 0.2)) + (i * Math.PI / 3);
        const mx = w * 0.3 + (i * (w * 0.4) / (numMolecules - 1));
        const my = h - 65 + Math.sin(i + t * 0.5) * 4;

        // Draw Oxygen atom (Red, large)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw two Hydrogen atoms (White, small) rotating
        ctx.fillStyle = '#ffffff';
        const h1x = mx + Math.cos(angle) * 11;
        const h1y = my + Math.sin(angle) * 11;
        const h2x = mx + Math.cos(angle + Math.PI * 0.7) * 11;
        const h2y = my + Math.sin(angle + Math.PI * 0.7) * 11;

        ctx.beginPath();
        ctx.arc(h1x, h1y, 4, 0, Math.PI * 2);
        ctx.arc(h2x, h2y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw bonds
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(h1x, h1y);
        ctx.moveTo(mx, my);
        ctx.lineTo(h2x, h2y);
        ctx.stroke();
      }

      // Display real-time temp on food
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif font-bold';
      ctx.fillText(`טמפרטורת המזון: ${mwTemp.toFixed(1)}°C`, 20, h - 20);

      localFrame = requestAnimationFrame(render);
    };

    localFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(localFrame);
  }, [activeTechTab, isMwOn, mwFrequency, mwPower, mwTemp]);

  // --- Ultrasound womb scanning fetus reconstruction ---
  useEffect(() => {
    if (activeTechTab !== 'ultrasound') return;
    const canvas = ultrasoundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;

    const render = () => {
      timeRef.current += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Womb representation (Black ultrasound backdrop)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Grid scan lines
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Transducer Probe position mapping
      const probeX = (probePosition / 100) * (w - 60) + 30;

      // Draw probe beams
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probeX, 30);
      ctx.lineTo(probeX - 40, h);
      ctx.moveTo(probeX, 30);
      ctx.lineTo(probeX + 40, h);
      ctx.stroke();

      // Core: draw ultrasound "reconstructed" fetus silhouette
      // We draw the fetus on the screen, but we only make it "bright" and "revealed" near the probe position!
      // This is exactly like real ultrasound echoes being received by the transducer!
      const fetusImgY = h * 0.6;
      const fetusImgX = w * 0.5;

      // Fetus head, body, arms stylized vectors
      const drawFetusLine = (fx1: number, fy1: number, fx2: number, fy2: number) => {
        // For each segment, calculate distance to probeX. If close, reveal bright, otherwise faint.
        const midX = (fx1 + fx2) / 2;
        const distToBeam = Math.abs(midX - probeX);
        const intensity = Math.max(0.05, 1 - distToBeam / 110);

        ctx.strokeStyle = `rgba(16, 185, 129, ${intensity * 0.85})`;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = intensity > 0.5 ? 5 : 0;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      };

      // Fetus parts: head (circle), spine, limbs
      // Head
      const headX = w * 0.42;
      const headY = h * 0.5;
      const distHead = Math.abs(headX - probeX);
      const intensityHead = Math.max(0.05, 1 - distHead / 110);
      ctx.strokeStyle = `rgba(16, 185, 129, ${intensityHead})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(headX, headY, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Spine / Body
      drawFetusLine(headX + 15, headY + 15, w * 0.62, h * 0.68);
      // Leg 1
      drawFetusLine(w * 0.62, h * 0.68, w * 0.72, h * 0.6);
      drawFetusLine(w * 0.72, h * 0.6, w * 0.76, h * 0.72);
      // Leg 2 (folded)
      drawFetusLine(w * 0.62, h * 0.68, w * 0.68, h * 0.82);
      // Arm
      drawFetusLine(headX + 22, headY + 22, w * 0.5, h * 0.75);

      // Draw probe at the top
      ctx.fillStyle = '#64748b';
      ctx.fillRect(probeX - 20, 10, 40, 15);
      ctx.fillStyle = '#475569';
      ctx.fillRect(probeX - 15, 5, 30, 5);

      // Draw visual wave pulsing down from probe
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      const waveY = 25 + (timeRef.current * 12) % (h - 40);
      ctx.beginPath();
      ctx.arc(probeX, 25, waveY, Math.PI * 0.25, Math.PI * 0.75);
      ctx.stroke();

      // Display echo calculation (Time of Flight d = vt/2)
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '10px JetBrains Mono, sans-serif';
      const scanTimeMs = (waveY / 1540).toFixed(4);
      ctx.fillText(`פולס קולי (f = ${ultrasoundFreq}MHz)`, 15, 25);
      ctx.fillText(`זמן מעוף הד: t = ${scanTimeMs} ms`, 15, 40);
      ctx.fillText(`מרחק מחושב d = vt/2 = ${((1540 * parseFloat(scanTimeMs)) / 2).toFixed(1)} mm`, 15, 55);

      localFrame = requestAnimationFrame(render);
    };

    localFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(localFrame);
  }, [activeTechTab, probePosition, ultrasoundFreq]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" id="tech-simulator-wrapper">
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4" dir="rtl">
        <div className="space-y-1">
          <h3 className="text-xl font-sans font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>טכנולוגיות מבוססות גלים: מעבדת היישומים</span>
          </h3>
          <p className="text-xs text-slate-400">
            בחנו את העקרונות הפיזיקליים בהם משתמשים מכשירים טכנולוגיים מחיי היום-יום כדי לעבד ולפענח מידע
          </p>
        </div>

        {/* Tech tabs switcher */}
        <div className="flex bg-slate-800 rounded-xl p-1 text-xs" id="tech-selector-tabs">
          <button
            onClick={() => setActiveTechTab('microwave')}
            className={`px-4 py-2 font-sans rounded-lg cursor-pointer transition-all ${activeTechTab === 'microwave' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            מיקרוגל ביתי
          </button>
          <button
            onClick={() => setActiveTechTab('imaging')}
            className={`px-4 py-2 font-sans rounded-lg cursor-pointer transition-all ${activeTechTab === 'imaging' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            רנטגן ותרמי
          </button>
          <button
            onClick={() => setActiveTechTab('ultrasound')}
            className={`px-4 py-2 font-sans rounded-lg cursor-pointer transition-all ${activeTechTab === 'ultrasound' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            אולטרסאונד רפואי
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12" dir="rtl">
        {/* Left side visual simulator */}
        <div className="lg:col-span-6 p-6 border-l border-slate-100 bg-slate-50/50 flex flex-col justify-center items-center">
          
          {activeTechTab === 'microwave' && (
            <div className="w-full space-y-4" dir="rtl">
              <canvas ref={mwCanvasRef} width={380} height={220} className="w-full h-[220px] rounded-xl block border border-slate-800 shadow-md" />
              
              {/* Microwave Modes & Sliders */}
              <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">מצב קרינת מיקרוגל:</span>
                  <div className="flex gap-1.5 bg-slate-200 p-0.5 rounded">
                    <button
                      onClick={() => setIsMwPacketMode(false)}
                      className={`px-2 py-1 rounded text-[11px] transition-all cursor-pointer ${!isMwPacketMode ? 'bg-amber-500 text-white font-bold' : 'text-slate-600'}`}
                    >
                      גלים עומדים (רציף)
                    </button>
                    <button
                      onClick={() => setIsMwPacketMode(true)}
                      className={`px-2 py-1 rounded text-[11px] transition-all cursor-pointer ${isMwPacketMode ? 'bg-amber-500 text-white font-bold' : 'text-slate-600'}`}
                    >
                      חבילת גלים (Wave Packet)
                    </button>
                  </div>
                </div>

                {isMwPacketMode ? (
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">משך הפולס (רוחב החבילה - Δt):</span>
                        <span className="text-amber-600 font-bold">{mwPulseDuration.toFixed(1)} ms</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.5" 
                        max="8.0" 
                        step="0.5" 
                        value={mwPulseDuration} 
                        onChange={(e) => setMwPulseDuration(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block leading-none">ככל שהחבילה קצרה בזמן, היא מתפרשת על פני טווח תדרים ספקטרלי רחב יותר!</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">תדר המגנטרון:</span>
                        <span className="text-amber-600 font-bold">{mwFrequency.toFixed(2)} GHz</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.0" 
                        max="5.0" 
                        step="0.05" 
                        value={mwFrequency} 
                        onChange={(e) => setMwFrequency(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsMwOn(!isMwOn)}
                  className={`px-5 py-2.5 rounded-xl font-sans text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${isMwOn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}`}
                  id="microwave-on-off-btn"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isMwOn ? 'כבה מיקרוגל' : 'הפעל מיקרוגל'}</span>
                </button>
                <button
                  onClick={() => { setMwTemp(20); setIsMwOn(false); }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-sans cursor-pointer"
                >
                  אפס טמפרטורה
                </button>
              </div>
            </div>
          )}

          {activeTechTab === 'imaging' && (
            <div className="w-full space-y-4" dir="rtl">
              {/* Specialized tissue penetration visualizer */}
              <div className="h-[230px] w-full rounded-xl border border-slate-700 relative overflow-hidden shadow-lg flex flex-col justify-between p-4" style={{
                background: imagingType === 'thermal' 
                  ? (thermalBody === 'human' ? 'radial-gradient(circle, #f43f5e 10%, #fb923c 45%, #1e293b 95%)'
                     : thermalBody === 'coffee' ? 'linear-gradient(to top, #fb7185, #f59e0b, #0f172a)'
                     : thermalBody === 'ice' ? 'radial-gradient(circle, #38bdf8 5%, #1d4ed8 45%, #020617 100%)'
                     : 'radial-gradient(circle, #ffffff 10%, #ef4444 40%, #7f1d1d 90%)') // heater
                  : '#090d16' // xray dark bone background
              }}>
                {imagingType === 'thermal' ? (
                  <>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-white font-bold bg-rose-600 px-2 py-0.5 rounded-full shadow">חיישן אינפרא-אדום (Thermal IR)</span>
                      <span className="text-white text-xs font-mono font-bold bg-slate-900/80 px-2 py-0.5 rounded">
                        T = {thermalBody === 'human' ? '37°C (310.1K)' : thermalBody === 'coffee' ? '85°C (358.1K)' : thermalBody === 'ice' ? '0°C (273.1K)' : '450°C (723.1K)'}
                      </span>
                    </div>

                    {/* Specialized thermal outlines representing each body */}
                    <div className="flex justify-center items-center h-28 relative">
                      {thermalBody === 'human' && (
                        <div className="w-20 h-20 rounded-full border-4 border-rose-400 bg-orange-400/80 flex items-center justify-center animate-pulse shadow-2xl">
                          <div className="w-8 h-4 rounded-full bg-red-500/80" /> {/* warm nose/lips */}
                        </div>
                      )}
                      {thermalBody === 'coffee' && (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-12 bg-orange-500 rounded-b-xl border-t-4 border-yellow-300 relative">
                            <div className="w-4 h-6 border-4 border-l-0 border-yellow-400 rounded-r-lg absolute top-2 -right-4" />
                          </div>
                          {/* Steaming waves */}
                          <div className="flex gap-2 text-yellow-300 text-[10px] animate-bounce font-mono font-bold pt-1">
                            <span>♨</span><span>♨</span><span>♨</span>
                          </div>
                        </div>
                      )}
                      {thermalBody === 'ice' && (
                        <div className="w-16 h-16 bg-sky-200/90 border-2 border-blue-500 rotate-12 flex items-center justify-center shadow-inner">
                          <span className="text-blue-900 font-bold text-xs select-none">COLD</span>
                        </div>
                      )}
                      {thermalBody === 'heater' && (
                        <div className="flex flex-col gap-1 items-center">
                          {/* Concentric red hot coils */}
                          <div className="w-24 h-4 rounded-full border border-orange-400 bg-white shadow-lg animate-ping" />
                          <div className="w-20 h-4 rounded-full border border-red-500 bg-yellow-400 shadow-md" />
                          <div className="w-16 h-4 rounded-full border border-red-600 bg-red-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end w-full" dir="rtl">
                      <div className="text-right text-white/90">
                        <div className="text-[10px] text-slate-300">פליטת קוונטים (חוק סטפן-בולצמן):</div>
                        <div className="text-xs font-mono font-bold text-yellow-300">
                          P = σ·T⁴ ≈ {thermalBody === 'human' ? '524' : thermalBody === 'coffee' ? '934' : thermalBody === 'ice' ? '315' : '15,500'} W/m²
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-300 italic w-1/2 leading-tight">כל עצם פולט קרינת גוף שחור אלקטרומגנטית בהתאם לטמפרטורה שלו ברביעית!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-white font-bold bg-indigo-600 px-2 py-0.5 rounded-full shadow">דימות רנטגן (Differential X-Ray)</span>
                      
                      {/* Image quality evaluator label */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        xrayVoltage < 55 ? 'bg-red-500 text-white' :
                        xrayVoltage > 115 ? 'bg-amber-500 text-slate-900' :
                        'bg-emerald-500 text-white'
                      }`}>
                        {xrayVoltage < 55 ? 'תת-חשיפה 🔴' :
                         xrayVoltage > 115 ? 'חשיפת יתר 🔴' :
                         'חשיפה מושלמת! 🟢'}
                      </span>
                    </div>
                    
                    {/* Stylized bones shadow depends on device and kV/mA */}
                    <div className="flex justify-center items-center h-28 relative" style={{
                      opacity: xrayVoltage < 45 ? 0.2 : 1.0,
                      filter: `blur(${xrayVoltage < 55 ? '2.5px' : '0px'})`
                    }}>
                      {/* Dental Target */}
                      {xrayDevice === 'dental' && (
                        <div className="flex gap-1.5 items-center justify-center transition-all" style={{
                          filter: xrayVoltage > 115 ? 'brightness(1.8) contrast(0.4)' : 'none'
                        }}>
                          {/* 3 Teeth bones */}
                          {[1, 2, 3].map((t) => (
                            <div key={t} className="w-10 h-14 bg-white/90 rounded-b-xl border-t-8 border-slate-600/60 relative flex items-center justify-center shadow-lg">
                              {/* metal filling inside second tooth */}
                              {t === 2 && (
                                <div className="w-4 h-4 bg-slate-950 rounded absolute top-2 border border-white" title="סתימת מתכת - בולמת קרינה לחלוטין" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chest Target */}
                      {xrayDevice === 'chest' && (
                        <div className="flex flex-col items-center justify-center relative transition-all" style={{
                          filter: xrayVoltage > 115 ? 'brightness(1.8) contrast(0.4)' : 'none'
                        }}>
                          {/* Spine bone */}
                          <div className="w-4 h-24 bg-white/90 rounded-md shadow-lg flex flex-col justify-between py-1">
                            {[1,2,3,4,5].map(v => <div key={v} className="h-2 w-full bg-slate-200/50" />)}
                          </div>
                          {/* Rib cage overlay */}
                          <div className="absolute inset-0 flex justify-between items-center px-4 w-32">
                            <div className="w-8 h-20 border-2 border-r-0 border-white/85 rounded-l-full" />
                            <div className="w-8 h-20 border-2 border-l-0 border-white/85 rounded-r-full" />
                          </div>
                        </div>
                      )}

                      {/* CT Target */}
                      {xrayDevice === 'ct' && (
                        <div className="w-24 h-24 rounded-full border-8 border-white/95 flex items-center justify-center transition-all relative" style={{
                          filter: xrayVoltage > 115 ? 'brightness(1.8) contrast(0.4)' : 'none'
                        }}>
                          <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/40 rounded-full blur-[2px]" /> {/* Brain lobes */}
                          </div>
                        </div>
                      )}

                      {/* Noise and Contrast overlay */}
                      {xrayVoltage < 55 && (
                        <div className="absolute inset-0 bg-black/40 mix-blend-color-burn flex items-center justify-center">
                          <span className="text-[10px] text-red-300 font-mono font-bold bg-black/75 px-2 py-1 rounded">אנרגיה נמוכה מדי (kV) - קרני רנטגן נבלמות ברקמות הרכות</span>
                        </div>
                      )}
                      {xrayVoltage > 115 && (
                        <div className="absolute inset-0 bg-white/20 mix-blend-color-dodge flex items-center justify-center">
                          <span className="text-[10px] text-amber-200 font-mono font-bold bg-black/75 px-2 py-1 rounded">אנרגיית יתר (kV) - הקרינה עוברת הכל ללא הבדל (התמונה שרופה)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end w-full" dir="rtl">
                      <div className="text-right text-slate-300 text-[10px]">
                        <div>עוצמת שפופרת: <span className="text-indigo-400 font-bold">{xrayCurrent} mA</span> &nbsp; | &nbsp; אנרגיית פוטונים: <span className="text-indigo-400 font-bold">{xrayVoltage} keV</span></div>
                        <div className="text-slate-400 italic font-sans text-[9px] pt-0.5">אורך גל קצר במיוחד (λ ≈ { (1.24 / xrayVoltage).toFixed(3) } nm) המאפשר חדירת חומר!</div>
                      </div>
                      <span className="text-[9px] text-slate-400 w-1/2 leading-tight">סידן ומתכות בולעים רנטגן (לבן); רקמות רכות ואוויר מעבירים רנטגן (שחור).</span>
                    </div>
                  </>
                )}
              </div>

              {/* DYNAMIC PARAMETER SLIDERS FOR IMAGING SUB-TABS */}
              {imagingType === 'thermal' ? (
                <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/50 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">בחרו גוף קורן לחקר פליטת חום (Blackbody IR):</span>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {(['human', 'coffee', 'ice', 'heater'] as const).map((b) => (
                      <button
                        key={b}
                        onClick={() => setThermalBody(b)}
                        className={`py-1.5 px-2 text-[11px] font-sans rounded-lg cursor-pointer transition-all border ${thermalBody === b ? 'bg-rose-600 text-white border-rose-600 font-bold shadow' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {b === 'human' ? '👦 גוף אדם' : b === 'coffee' ? '☕ קפה חם' : b === 'ice' ? '🧊 קובית קרח' : '⚡ גוף חימום'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">בחרו מכשיר ומטרת דימות:</span>
                    <div className="flex gap-1 text-[11px]">
                      {(['dental', 'chest', 'ct'] as const).map((dev) => (
                        <button
                          key={dev}
                          onClick={() => {
                            setXrayDevice(dev);
                            if (dev === 'dental') { setXrayVoltage(60); setXrayCurrent(15); }
                            else if (dev === 'chest') { setXrayVoltage(85); setXrayCurrent(40); }
                            else { setXrayVoltage(120); setXrayCurrent(80); }
                          }}
                          className={`px-2 py-1 rounded cursor-pointer transition-all border ${xrayDevice === dev ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border-slate-200'}`}
                        >
                          {dev === 'dental' ? '🦷 שיניים' : dev === 'chest' ? '🩻 חזה' : '🧠 סי-טי (CT)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* xray sliders (Requirement 1.12) */}
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-slate-600 font-sans">מתח אנודה (Voltage):</span>
                        <span className="text-indigo-600 font-bold">{xrayVoltage} kV</span>
                      </div>
                      <input 
                        type="range" 
                        min="35" 
                        max="150" 
                        value={xrayVoltage} 
                        onChange={(e) => setXrayVoltage(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block leading-tight">קובע את אנרגיית הפוטון וחדירות הגל.</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-slate-600 font-sans">זרם שפופרת (Current):</span>
                        <span className="text-indigo-600 font-bold">{xrayCurrent} mA</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={xrayCurrent} 
                        onChange={(e) => setXrayCurrent(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block leading-tight">קובע את כמות הפוטונים (בהירות התמונה).</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode toggler for imaging types */}
              <div className="flex justify-center bg-slate-200 p-1 rounded-lg w-fit mx-auto text-xs" id="imaging-sub-tabs">
                <button
                  onClick={() => setImagingType('thermal')}
                  className={`px-4 py-1.5 font-sans rounded-md cursor-pointer ${imagingType === 'thermal' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  מצלמה תרמית (IR)
                </button>
                <button
                  onClick={() => setImagingType('xray')}
                  className={`px-4 py-1.5 font-sans rounded-md cursor-pointer ${imagingType === 'xray' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  צילום רנטגן (X-Ray)
                </button>
              </div>
            </div>
          )}

          {activeTechTab === 'ultrasound' && (
            <div className="w-full space-y-4">
              <canvas ref={ultrasoundCanvasRef} width={380} height={220} className="w-full h-[220px] rounded-xl block border border-slate-800 shadow" />
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-slate-600 font-medium">הזיזו את חיישן האולטרסאונד (מתמר) לאורך הבטן:</span>
                  <span className="text-emerald-600 font-bold">{probePosition}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="95" 
                  value={probePosition}
                  onChange={(e) => setProbePosition(parseInt(e.target.value))}
                  className="w-full cursor-pointer accent-emerald-500"
                  id="ultrasound-slider"
                />
              </div>
            </div>
          )}

        </div>

        {/* Right side explanations tailored to levels */}
        <div className="lg:col-span-6 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold tracking-wider text-indigo-500 block">כיצד הטכנולוגיה רותמת את הגל?</span>
            
            {activeTechTab === 'microwave' && (
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <h4 className="font-sans font-semibold text-sm text-slate-800">🔥 תנור המיקרוגל הביתי (2.45GHz)</h4>
                <p>
                  1. <strong>תהודה ודיפולים:</strong> מולקולת המים באוכל היא דיפול חשמלי (מטען חיובי קל בצד אחד ושלילי בצד שני). 
                  השדה החשמלי של גל המיקרו משנה את כיוונו 2.45 מיליארד פעמים בשנייה ומאלץ את המולקולות להסתובב ולהתחכך - החיכוך יוצר חום מהיר.
                </p>
                <p>
                  2. <strong>כלוב פאראדיי:</strong> דלת המיקרוגל מכילה רשת מתכת חוררית. מכיוון שגודל החורים (~1 מ"מ) קטן משמעותית מאורך גל המיקרו (~12 ס"מ), 
                  הגלים אינם יכולים לצאת החוצה ונבלמים לחלוטין (כלוב פאראדיי בטוח).
                </p>
              </div>
            )}

            {activeTechTab === 'imaging' && (
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <h4 className="font-sans font-semibold text-sm text-slate-800">📸 דימות תרמי וקרני רנטגן (X-Ray)</h4>
                {imagingType === 'thermal' ? (
                  <p>
                    🌡️ <strong>דימות תרמי:</strong> גופנו פולט קרינה אלקטרומגנטית קבועה בהתאם לחום הגוף שלו (אנרגיה פנימית). 
                    חיישני אינפרא-אדום מזהים את אורך הגל של קרינה זו (~10 מיקרומטר) וממירים אותה לצבעי קשת מלאכותיים המייצגים טמפרטורה.
                  </p>
                ) : (
                  <p>
                    🦴 <strong>צילומי רנטגן (X-Ray):</strong> קרינה בעלת אנרגיה עצומה ואורך גל זעיר. 
                    בשל האנרגיה הגבוהה היא עוברת דרך תאים רכים, אך נבלמת בסידן הצפוף של העצמות, 
                    מה שיוצר תמונת צללית מדויקת על הגלאי האחורי.
                  </p>
                )}
              </div>
            )}

            {activeTechTab === 'ultrasound' && (
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <h4 className="font-sans font-semibold text-sm text-slate-800">👶 אולטרסאונד רפואי (1-15 MHz)</h4>
                <p>
                  1. <strong>הפקת גלי קול:</strong> קריסטלים פיאזואלקטריים מיוחדים מפיקים פולס קול בתדר גבוה במיוחד.
                </p>
                <p>
                  2. <strong>פענוח החזר (אקו):</strong> הגל חודר לרקמות ומוחזר בחזרה (אקו) בכל פעם שהוא פוגש גבול בעל עכבה אקוסטית שונה. 
                  מחשב מודד את זמני ההחזרה t ומחשב את עומק האיבר d לפי המהירות הממוצעת של הקול ברקמות (1540 מטר לשנייה) בעזרת הנוסחה המוכרת:
                </p>
                <div className="bg-slate-900 text-emerald-400 font-mono text-center p-2 rounded text-xs font-bold">
                  d = (v * t) / 2
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4 text-[10px] text-indigo-900 leading-relaxed">
            <h5 className="font-sans font-bold mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>תרומת הפיזיקה לחברה</span>
            </h5>
            שילוב תכונות הגלים (כמו בליעה דיפרנציאלית, עכבה אקוסטית ותנודה מגנטית) מאפשר לרופאים, מהנדסים ומדענים לראות לתוך גוף האדם 
            או לתוך מבנים ללא כל פגיעה פיזית (שיטות Non-Destructive Testing ודימות רפואי מתקדם).
          </div>
        </div>
      </div>
    </div>
  );
}
