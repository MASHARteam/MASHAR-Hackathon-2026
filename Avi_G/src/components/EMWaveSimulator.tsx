import React, { useRef, useEffect, useState } from 'react';
import { UserLevel } from '../types';
import { Sun, Eye, Layers, Compass, HelpCircle, Activity } from 'lucide-react';

interface EMWaveSimulatorProps {
  level: UserLevel;
}

export default function EMWaveSimulator({ level }: EMWaveSimulatorProps) {
  // Physical parameters
  const [polarizationAngle, setPolarizationAngle] = useState<number>(0); // degrees
  const [medium, setMedium] = useState<'vacuum' | 'water' | 'glass' | 'diamond'>('vacuum');
  const [spectrumValue, setSpectrumValue] = useState<number>(500); // Wavelength in nm (for visible) or a custom scale [0-100] for general spectrum

  const [spectrumMode, setSpectrumMode] = useState<'visible' | 'full'>('visible');
  const [fullSpectrumIndex, setFullSpectrumIndex] = useState<number>(3); // 0: Radio, 1: Microwave, 2: IR, 3: Visible, 4: UV, 5: X-Ray, 6: Gamma

  // UI view modes for EM sub-concepts
  const [emViewMode, setEmViewMode] = useState<'wave3d' | 'snell' | 'prism'>('wave3d');
  const [snellIncidentAngle, setSnellIncidentAngle] = useState<number>(45); // degrees 0-80

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snellCanvasRef = useRef<HTMLCanvasElement>(null);
  const prismCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Constants
  const c = 3.0e8; // m/s
  const h = 6.63e-34; // J*s

  const mediumRefractiveIndices = {
    vacuum: 1.0,
    water: 1.33,
    glass: 1.5,
    diamond: 2.42
  };

  const fullSpectrum = [
    { name: 'גלי רדיו (Radio)', wavelength: '1m - 100km', frequency: '300MHz - 3kHz', energy: '1.2e-6 eV', use: 'שידורי רדיו, רשתות סלולריות, תקשורת לווינים ו-Wi-Fi' },
    { name: 'גלי מיקרו (Microwave)', wavelength: '1mm - 1m', frequency: '300GHz - 300MHz', energy: '1.2e-3 eV', use: 'בישול וחימום דיאלקטרי, מכשירי מכ"ם צבאיים ורשתות GPS' },
    { name: 'תת-אדום (Infrared - IR)', wavelength: '700nm - 1mm', frequency: '430THz - 300GHz', energy: '1.2 eV', use: 'שלטים רחוקים, ראיית לילה תרמית, סיבים אופטיים ומדחומי מצח' },
    { name: 'האור הנראה (Visible Light)', wavelength: '400nm - 700nm', frequency: '750THz - 430THz', energy: '2.5 eV', use: 'ראיית בני אדם, צילום, פוטוסינתזה בצמחים ומסכי טלוויזיה/טלפון' },
    { name: 'על-סגול (Ultraviolet - UV)', wavelength: '10nm - 400nm', frequency: '30PHz - 750THz', energy: '12 eV', use: 'חיטוי וסטריליזציה של מים, זיהוי שטרות מזויפים, ומיטות שיזוף' },
    { name: 'קרני רנטגן (X-Ray)', wavelength: '0.01nm - 10nm', frequency: '30EHz - 30PHz', energy: '120,000 eV', use: 'דימות עצמות רפואי, בידוק בטחוני בנמלי תעופה, ואנליזה קריסטלוגרפית' },
    { name: 'קרני גמא (Gamma)', wavelength: '<0.01nm', frequency: '>30EHz', energy: '>1.2M eV', use: 'טיפולים אונקולוגיים להשמדת תאים סרטניים, וחקר חורים שחורים ביקום' }
  ];

  // Get color from visible spectrum wavelength (nm)
  const getWavelengthColor = (wavelength: number): string => {
    // Simple spectral estimation
    if (wavelength >= 380 && wavelength < 440) return '#7e22ce'; // Violet
    if (wavelength >= 440 && wavelength < 490) return '#2563eb'; // Blue
    if (wavelength >= 490 && wavelength < 510) return '#06b6d4'; // Cyan
    if (wavelength >= 510 && wavelength < 580) return '#22c55e'; // Green
    if (wavelength >= 580 && wavelength < 640) return '#eab308'; // Yellow/Orange
    if (wavelength >= 640 && wavelength <= 750) return '#dc2626'; // Red
    return '#64748b';
  };

  // 3D projected wave rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 340;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      timeRef.current += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const n = mediumRefractiveIndices[medium];
      // When wave enters the medium (at the middle of screen x = w/2)
      const boundaryX = w * 0.52;

      // Draw background and medium interface
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Medium coloring
      if (medium !== 'vacuum') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fillRect(boundaryX, 0, w - boundaryX, h);
        
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(boundaryX, 0);
        ctx.lineTo(boundaryX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#0369a1';
        ctx.font = '10px Inter, sans-serif font-semibold';
        ctx.fillText(`תווך: ${medium === 'water' ? 'מים' : medium === 'glass' ? 'זכוכית' : 'יהלום'} (n = ${n})`, boundaryX + 10, 20);
      } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '10px Inter, sans-serif font-semibold';
        ctx.fillText('תווך: ריק (n = 1.0)', w - 120, 20);
      }

      // Draw propagation axis line (Z projection)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, h/2);
      ctx.lineTo(w - 20, h/2);
      ctx.stroke();

      // 3D Projection configuration
      const projYAngle = Math.PI / 6; // 30 degrees projection for magnetic field
      const cosProj = Math.cos(projYAngle);
      const sinProj = Math.sin(projYAngle);

      // We model electromagnetic wave moving on X axis
      // E field vibrates along Y (up/down) rotated by polarization angle
      // B field vibrates along Z (projected depth) rotated by polarization angle + 90
      const polRad = (polarizationAngle * Math.PI) / 180;
      
      const waveFreq = 0.08;
      const baseLambda = 140; // visual wavelength in vacuum

      ctx.lineWidth = 1.5;

      for (let x = 30; x < w - 30; x += 6) {
        // refractive slow down and wavelength shrink
        let currentLambda = baseLambda;
        let currentPhase = x * (2 * Math.PI / baseLambda) - timeRef.current;

        if (x > boundaryX) {
          // wavelength lambda_n = lambda_0 / n
          currentLambda = baseLambda / n;
          // Phase integration to maintain continuity at interface
          const phaseBefore = boundaryX * (2 * Math.PI / baseLambda);
          const phaseAfter = (x - boundaryX) * (2 * Math.PI / currentLambda);
          currentPhase = phaseBefore + phaseAfter - timeRef.current;
        }

        // Amplitude and fields
        const amp = 45;
        const eFieldVal = amp * Math.sin(currentPhase);
        const bFieldVal = amp * Math.sin(currentPhase); // In EM wave, fields oscillate in phase

        // Electric field vector (Vertical, rotated by polarization angle)
        const ex = x;
        const ey = h/2 - eFieldVal * Math.cos(polRad);
        const ezProjY = -eFieldVal * Math.sin(polRad) * sinProj;
        const finalEy = ey + ezProjY;

        // Draw Electric field vector arrow (Red)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red
        ctx.beginPath();
        ctx.moveTo(x, h/2);
        ctx.lineTo(ex, finalEy);
        ctx.stroke();

        // Magnetic field vector (Perpendicular to E field, polRad + 90)
        const bx = x;
        // B field is projected into depth
        const bzAngle = polRad + Math.PI/2;
        const bDepth = bFieldVal * Math.cos(bzAngle);
        const finalBy = h/2 + bFieldVal * Math.sin(bzAngle) * sinProj;
        const finalBx = x + bDepth * cosProj;

        // Draw Magnetic field vector arrow (Blue)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)'; // blue
        ctx.beginPath();
        ctx.moveTo(x, h/2);
        ctx.lineTo(finalBx, finalBy);
        ctx.stroke();
      }

      // Draw Legend in 3D
      ctx.font = '10px JetBrains Mono, sans-serif font-bold';
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, 15, 12, 6);
      ctx.fillText('שדה חשמלי (E)', 48, 21);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(150, 15, 12, 6);
      ctx.fillText('שדה מגנטי (B)', 168, 21);

      // Label interface
      if (medium !== 'vacuum') {
        ctx.fillStyle = '#475569';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('מפגש גבול תווך (שבירה ודעיכה)', boundaryX - 60, h - 12);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [polarizationAngle, medium, emViewMode]);

  // Snell's Law animation effect
  useEffect(() => {
    if (emViewMode !== 'snell') return;
    const canvas = snellCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let localTime = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 340;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      localTime += 0.08;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Backdrops
      ctx.fillStyle = '#f8fafc'; // Air
      ctx.fillRect(0, 0, w/2, h);

      const n2 = mediumRefractiveIndices[medium];
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'; // Medium
      ctx.fillRect(w/2, 0, w/2, h);

      // Interface line
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w/2, 0);
      ctx.lineTo(w/2, h);
      ctx.stroke();

      // Normal line (dashed)
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(w, h/2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Snell angles calculation
      const theta1Rad = (snellIncidentAngle * Math.PI) / 180;
      const sinTheta2 = Math.sin(theta1Rad) / n2;
      const theta2Rad = Math.asin(sinTheta2);

      // Geometric vectors
      const dx1 = Math.cos(theta1Rad);
      const dy1 = Math.sin(theta1Rad);
      const dx2 = Math.cos(theta2Rad);
      const dy2 = Math.sin(theta2Rad);

      const x0 = w/2;
      const y0 = h/2;

      // Draw wavefronts (Requirement 1.8)
      const lambda1 = 32;
      const lambda2 = lambda1 / n2;
      const phaseShift = (localTime * 15) % lambda1;

      // Draw Air Wavefronts (x < w/2)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 1.5;
      for (let s = -320; s <= 0; s += lambda1) {
        const curS = s + phaseShift;
        if (curS > 0) continue;
        const wx = x0 + curS * dx1;
        const wy = y0 - curS * dy1;

        ctx.beginPath();
        ctx.moveTo(wx - 80 * dy1, wy - 80 * dx1);
        ctx.lineTo(wx + 80 * dy1, wy + 80 * dx1);
        ctx.stroke();
      }

      // Draw Medium Wavefronts (x > w/2)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
      for (let s = 0; s <= 320; s += lambda2) {
        const curS = s + phaseShift * (lambda2 / lambda1);
        const wx = x0 + curS * dx2;
        const wy = y0 - curS * dy2;

        ctx.beginPath();
        ctx.moveTo(wx - 80 * dy2, wy - 80 * dx2);
        ctx.lineTo(wx + 80 * dy2, wy + 80 * dx2);
        ctx.stroke();
      }

      // Draw Incident beam (laser red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x0 - 240 * dx1, y0 + 240 * dy1);
      ctx.lineTo(x0, y0);
      ctx.stroke();

      // Draw Refracted beam (neon blue)
      ctx.strokeStyle = '#3b82f6';
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 240 * dx2, y0 - 240 * dy2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw angle arcs with labels
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x0, y0, 30, Math.PI, Math.PI + theta1Rad);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`θ₁ = ${snellIncidentAngle}°`, x0 - 55, y0 - 15);

      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x0, y0, 30, -theta2Rad, 0);
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.fillText(`θ₂ = ${(theta2Rad * 180 / Math.PI).toFixed(1)}°`, x0 + 40, y0 - 15);

      // Interface Labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`ריק (Air): n₁ = 1.00`, 30, 25);
      ctx.fillText(`תווך: ${medium === 'water' ? 'מים' : medium === 'glass' ? 'זכוכית' : 'יהלום'}: n₂ = ${n2.toFixed(2)}`, w/2 + 20, 25);

      // Theoretical output box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(15, h - 55, w - 30, 42, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`פיזיקה בפעולה: חוק סנל (Snell's Law) מראה ש- n₁·sin(θ₁) = n₂·sin(θ₂).`, w - 30, h - 38);
      ctx.fillText(`בשל המעבר לתווך צפוף יותר, מהירות הגל פוחתת ל-${(100/n2).toFixed(1)}% ממהירות האור בריק, מה שמאלץ את חזית הגל להישבר ולהתכווץ!`, w - 30, h - 22);
      ctx.textAlign = 'left';

      frame = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [medium, snellIncidentAngle, emViewMode]);

  // Prism Dispersion animation effect
  useEffect(() => {
    if (emViewMode !== 'prism') return;
    const canvas = prismCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let localTime = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 340;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      localTime += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark futuristic physics background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 20; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 20; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Triangular Prism geometry
      const px = w/2;
      const py = h/2 - 5;
      const topV = { x: px, y: py - 70 };
      const leftV = { x: px - 80, y: py + 70 };
      const rightV = { x: px + 80, y: py + 70 };

      // Incident ray path (White light)
      const startX = px - 220;
      const startY = py + 10;
      const hitX = px - 35; // Incident point on prism left face
      const hitY = py - 8;

      // Draw Prism body (glass)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(leftV.x, leftV.y);
      ctx.lineTo(rightV.x, rightV.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wavelengths and refraction indices for Cauchy dispersion model
      const colors = [
        { name: 'אדום (Red)', hex: '#ff4444', wavelength: 650, dyInside: 0.1, dyExit: -0.1 },
        { name: 'כתום (Orange)', hex: '#ff8822', wavelength: 600, dyInside: 0.15, dyExit: 0.05 },
        { name: 'צהוב (Yellow)', hex: '#ffcc00', wavelength: 580, dyInside: 0.18, dyExit: 0.15 },
        { name: 'ירוק (Green)', hex: '#33cc33', wavelength: 530, dyInside: 0.22, dyExit: 0.25 },
        { name: 'כחול (Blue)', hex: '#3388ff', wavelength: 470, dyInside: 0.27, dyExit: 0.38 },
        { name: 'סגול (Violet)', hex: '#bb33ff', wavelength: 410, dyInside: 0.32, dyExit: 0.52 }
      ];

      // Draw incident white beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(hitX, hitY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw dispersion rays inside and exiting
      colors.forEach((c) => {
        // Path inside prism
        const insideEndX = px + 35;
        const insideEndY = hitY + 28 * c.dyInside;

        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hitX, hitY);
        ctx.lineTo(insideEndX, insideEndY);
        ctx.stroke();

        // Path exiting the prism fanning out
        const exitEndX = w - 40;
        const exitEndY = insideEndY + (exitEndX - insideEndX) * c.dyExit;

        // Draw soft fan glow
        const gradient = ctx.createLinearGradient(insideEndX, insideEndY, exitEndX, exitEndY);
        gradient.addColorStop(0, c.hex);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(insideEndX, insideEndY);
        ctx.lineTo(exitEndX, exitEndY);
        ctx.stroke();

        // Animate particles moving along the dispersion paths (Requirement 1.9)
        const partT = (localTime * 1.5) % 3;
        let pxPos = 0, pyPos = 0;

        if (partT < 1.0) {
          // Particle on white beam
          pxPos = startX + (hitX - startX) * partT;
          pyPos = startY + (hitY - startY) * partT;
          ctx.fillStyle = '#ffffff';
        } else if (partT < 2.0) {
          // Particle inside prism (dispersed)
          const ratio = partT - 1.0;
          pxPos = hitX + (insideEndX - hitX) * ratio;
          pyPos = hitY + (insideEndY - hitY) * ratio;
          ctx.fillStyle = c.hex;
        } else {
          // Particle exiting fanned out
          const ratio = partT - 2.0;
          pxPos = insideEndX + (exitEndX - insideEndX) * ratio;
          pyPos = insideEndY + (exitEndY - insideEndY) * ratio;
          ctx.fillStyle = c.hex;
        }

        ctx.beginPath();
        ctx.arc(pxPos, pyPos, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Interface Labels
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('קרן אור לבן (פוליכרומטי)', startX + 5, startY - 12);
      ctx.fillText('נפיצה ספקטרלית (Spectral Dispersion)', px + 50, h - 85);

      // Cauchy equation description
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(15, h - 55, w - 30, 42);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(15, h - 55, w - 30, 42, 4); ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`הסבר פיזיקלי: משוואת קושי (Cauchy's Equation) קובעת כי n(λ) = A + B/λ².`, w - 30, h - 38);
      ctx.fillText(`מאחר ואורך הגל של אור סגול קצר יותר מזה של אור אדום, הוא חווה מקדם שבירה n גבוה יותר, ונשבר בזווית חדה בהרבה!`, w - 30, h - 22);
      ctx.textAlign = 'left';

      frame = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [emViewMode]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" id="em-wave-simulator-card" dir="rtl">
      {/* CARD HEADER with Tab Selectors */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-sans font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>מעבדת גלים אלקטרומגנטיים ואופטיקה פיזיקלית</span>
            </h3>
            <p className="text-xs text-slate-400">
              חקרו את התכונות הגליות של האור: שדות אלקטרומגנטיים ניצבים, שבירת גלים בממשק חומרים, ונפיצת אור במנסרה
            </p>
          </div>

          {/* Mode Selector Buttons */}
          <div className="flex bg-slate-800 p-1 rounded-xl self-start lg:self-auto text-xs gap-1">
            <button
              onClick={() => setEmViewMode('wave3d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${emViewMode === 'wave3d' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
            >
              הדמיית גל 3D (E & B)
            </button>
            <button
              onClick={() => setEmViewMode('snell')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${emViewMode === 'snell' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
            >
              חוק סנל ושבירה 📐
            </button>
            <button
              onClick={() => setEmViewMode('prism')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${emViewMode === 'prism' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
            >
              נפיצה במנסרה 🌈
            </button>
          </div>
        </div>
      </div>

      {/* CANVAS STAGE */}
      <div className="relative border-b border-slate-100 bg-slate-50">
        {emViewMode === 'wave3d' && <canvas ref={canvasRef} className="w-full block h-[340px]" />}
        {emViewMode === 'snell' && <canvas ref={snellCanvasRef} className="w-full block h-[340px]" />}
        {emViewMode === 'prism' && <canvas ref={prismCanvasRef} className="w-full block h-[340px]" />}
        
        {/* Live physical calculations panel overlays */}
        {emViewMode === 'wave3d' && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur text-white p-3 rounded-lg text-xs font-mono border border-white/10 space-y-1">
            <div className="font-semibold text-sky-400">מהירות האור בתווך (v = c / n):</div>
            <div className="text-emerald-400 font-bold text-sm">
              v = {(c / mediumRefractiveIndices[medium]).toExponential(2)} m/s
            </div>
            <div className="text-slate-300 text-[10px]">
              תדר האור קבוע ({((c / (500 * 1e-9)) / 1e12).toFixed(0)} THz). אורך הגל מתכווץ פי {mediumRefractiveIndices[medium]} בתוך החומר.
            </div>
          </div>
        )}

        {emViewMode === 'snell' && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur text-white p-3 rounded-lg text-xs font-mono border border-white/10 space-y-1">
            <div className="font-semibold text-sky-400">נתוני שבירה וזוויות (Snell's Law):</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300 pt-1">
              <div>מקדם שבירה n₁ (אויר):</div>
              <div className="text-white font-bold">1.00</div>
              <div>מקדם שבירה n₂ ({medium === 'water' ? 'מים' : medium === 'glass' ? 'זכוכית' : medium === 'diamond' ? 'יהלום' : 'ריק'}):</div>
              <div className="text-sky-300 font-bold">{mediumRefractiveIndices[medium].toFixed(2)}</div>
              <div>זוית פגיעה θ₁:</div>
              <div className="text-emerald-400 font-bold">{snellIncidentAngle}°</div>
              <div>זוית שבירה θ₂:</div>
              <div className="text-indigo-400 font-bold">
                {(Math.asin(Math.sin((snellIncidentAngle * Math.PI)/180) / mediumRefractiveIndices[medium]) * 180 / Math.PI).toFixed(1)}°
              </div>
            </div>
          </div>
        )}

        {emViewMode === 'prism' && (
          <div className="absolute top-4 right-4 bg-slate-950/95 backdrop-blur text-white p-3 rounded-lg text-xs font-mono border border-white/10 space-y-1">
            <div className="font-semibold text-amber-400">מודל נפיצה במנסרת {medium === 'diamond' ? 'יהלום' : 'זכוכית'}:</div>
            <div className="text-slate-300 text-[10px] space-y-0.5">
              <div>• מקדם שבירה יסודי n: <span className="text-white font-bold">{mediumRefractiveIndices[medium].toFixed(2)}</span></div>
              <div>• אדום (λ=650nm) 🡚 n = <span className="text-red-400 font-bold">{(mediumRefractiveIndices[medium] - 0.04).toFixed(2)}</span></div>
              <div>• סגול (λ=410nm) 🡚 n = <span className="text-fuchsia-400 font-bold">{(mediumRefractiveIndices[medium] + 0.04).toFixed(2)}</span></div>
              <div className="text-amber-300/90 pt-1">שבירת האור מפרקת את האור לבן למרכיביו הצבעוניים!</div>
            </div>
          </div>
        )}
      </div>

      {/* Controller dials */}
      <div className="p-6 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* DIAL 1: Refractive Medium Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-sky-500" />
              <span>בחירת תווך התקדמות (חקר חומרים)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              שנו את סוג החומר כדי לחקור כיצד מקדם השבירה המקומי (Refractive Index) משנה את האופטיקה ואת מעבר האור.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(['vacuum', 'water', 'glass', 'diamond'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMedium(m)}
                  disabled={emViewMode === 'prism' && (m === 'vacuum' || m === 'water')}
                  className={`py-2 px-3 text-xs font-sans rounded-lg cursor-pointer transition-all border ${medium === m ? 'bg-sky-600 text-white border-sky-600 font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                >
                  {m === 'vacuum' ? 'ריק (n=1.0)' : m === 'water' ? 'מים (n=1.33)' : m === 'glass' ? 'זכוכית (n=1.5)' : 'יהלום (n=2.42)'}
                </button>
              ))}
            </div>
            {emViewMode === 'prism' && (
              <span className="text-[10px] text-amber-600 block mt-1 font-semibold">⚠️ הערה: נפיצה במנסרה דורשת גוף מוצק (מנסרת זכוכית או יהלום).</span>
            )}
          </div>

          {/* DIAL 2: Dynamic View Parameters */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
            {emViewMode === 'wave3d' && (
              <>
                <h4 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-rose-500" />
                  <span>זוית קיטוב האור (Polarization)</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  גל אלקטרומגנטי מקוטב רוטט במישור קבוע. החליקו את המגלשה כדי לסובב את מישור התנודה של השדות ב-3D.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 font-sans">זוית מסנן הקיטוב:</span>
                    <span className="text-rose-600 font-bold">{polarizationAngle}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="180" 
                    value={polarizationAngle}
                    onChange={(e) => setPolarizationAngle(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {emViewMode === 'snell' && (
              <>
                <h4 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>זוית פגיעת קרן האור (Incident Angle)</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  שנו את זוית פגיעת הלייזר (θ₁) יחסית לאנך כדי לראות את השינוי בזווית השבירה (θ₂) בהתאם לחוק סנל הפיזיקלי.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 font-sans">זוית פגיעה יחסית לאנך:</span>
                    <span className="text-emerald-600 font-bold">{snellIncidentAngle}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="80" 
                    value={snellIncidentAngle}
                    onChange={(e) => setSnellIncidentAngle(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {emViewMode === 'prism' && (
              <div className="space-y-2 flex flex-col justify-center h-full pb-2">
                <h4 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>פיזיקת נפיצה וקשת צבעים במנסרה</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  מנסרת <strong>יהלום</strong> (n = 2.42) מייצרת נפיצה והפרדת צבעים רחבה וחזקה בהרבה ממנסרת <strong>זכוכית</strong> (n = 1.50) בשל מקדם שבירה בסיסי גבוה ופוטנציאל פיזור אופטי עצום.
                </p>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 p-2 rounded-lg font-medium leading-relaxed block border border-indigo-100">
                  💡 ניסוי מפורסם: סר אייזק ניוטון היה הראשון להוכיח בשנת 1666 כי האור לבן אינו פשוט, אלא מורכב מספקטרום של צבעי הקשת שהופרדו באמצעות מנסרה!
                </span>
              </div>
            )}
          </div>

        </div>

        {/* SECTION 4: Interactive EM spectrum explorer */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h4 className="text-md font-sans font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-indigo-500" />
              <span>סורק הספקטרום האלקטרומגנטי הגלובלי</span>
            </h4>
            
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs" id="spectrum-modes">
              <button
                onClick={() => setSpectrumMode('visible')}
                className={`px-3 py-1 rounded-md cursor-pointer ${spectrumMode === 'visible' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                הספקטרום הנראה (צבעים)
              </button>
              <button
                onClick={() => setSpectrumMode('full')}
                className={`px-3 py-1 rounded-md cursor-pointer ${spectrumMode === 'full' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                הספקטרום המלא
              </button>
            </div>
          </div>

          {spectrumMode === 'visible' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                הספקטרום הנראה הוא פס דק מאוד בספקטרום הכולל. גררו את המגלשה כדי לחקור את הקשר שבין צבע האור לאורך הגל שלו (בננומטר - nm):
              </p>

              {/* Colorful gradient spectrum track */}
              <div className="relative h-8 rounded-lg overflow-hidden shadow-inner flex items-center" style={{
                background: 'linear-gradient(to left, #7e22ce, #2563eb, #06b6d4, #22c55e, #eab308, #dc2626)'
              }}>
                <div className="absolute inset-0 flex justify-between px-4 text-[10px] text-white font-mono font-bold select-none pointer-events-none items-center">
                  <span>סגול (380nm)</span>
                  <span>כחול</span>
                  <span>ירוק</span>
                  <span>צהוב</span>
                  <span>אדום (750nm)</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans font-medium">אורך גל נבחר:</span>
                  <span className="text-sm font-mono font-bold" style={{ color: getWavelengthColor(spectrumValue) }}>
                    {spectrumValue} nm
                  </span>
                </div>
                <input 
                  type="range" 
                  min="380" 
                  max="750" 
                  value={spectrumValue}
                  onChange={(e) => setSpectrumValue(parseInt(e.target.value))}
                  className="w-full cursor-pointer accent-indigo-600"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-center" dir="rtl">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">תדר האור (f = c/λ)</span>
                    <span className="text-sm font-mono font-bold text-slate-800">
                      {(c / (spectrumValue * 1e-9) / 1e12).toFixed(1)} THz
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">אנרגיית פוטון (E = hf)</span>
                    <span className="text-sm font-mono font-bold text-slate-800">
                      {((h * (c / (spectrumValue * 1e-9))) / 1.6e-19).toFixed(2)} eV
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                    <span className="text-[10px] text-slate-500">צבע מדומה:</span>
                    <div className="w-5 h-5 rounded shadow" style={{ backgroundColor: getWavelengthColor(spectrumValue) }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                לחצו על המקטעים השונים של הספקטרום האלקטרומגנטי כדי לראות את אפיון התדר שלהם והשימוש היומיומי:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {fullSpectrum.map((spec, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFullSpectrumIndex(idx)}
                    className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${fullSpectrumIndex === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <div className="text-xs font-sans">{spec.name.split(' (')[0]}</div>
                  </button>
                ))}
              </div>

              {/* Spectrum Details Panel */}
              <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                  <h5 className="text-sm font-bold text-indigo-900">{fullSpectrum[fullSpectrumIndex].name}</h5>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">קרינה {fullSpectrumIndex >= 4 ? 'מייננת (חזקה)' : 'בלתי מייננת'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">אורך גל:</span>
                    <span className="font-mono font-bold text-slate-800">{fullSpectrum[fullSpectrumIndex].wavelength}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">תדר:</span>
                    <span className="font-mono font-bold text-slate-800">{fullSpectrum[fullSpectrumIndex].frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">אנרגיית קוונט:</span>
                    <span className="font-mono font-bold text-slate-800">{fullSpectrum[fullSpectrumIndex].energy}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-700">
                  <strong>🎯 שימושים טכנולוגיים ביומיום:</strong> {fullSpectrum[fullSpectrumIndex].use}
                </div>
              </div>
            </div>
          )}

          {level === UserLevel.ACADEMIA && (
            <div className="mt-4 p-4 rounded-xl border border-amber-50 bg-amber-50/30 flex items-start gap-2 text-xs text-amber-800">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>רמת אקדמיה - משוואות מקסוול:</strong> קרינת האור נחשבת לקוונט אנרגיה (פוטון) הנפלט כתוצאה משינוי במצבי אנרגיה של אלקטרונים באטום. 
                מבחינה גלית, האור מיוצג על ידי משוואת הגל החלקית הנובעת ישירות מחוקי אמפר, פאראדיי וגאוס. מקדם הדיאלקטריות של החומר ε_r קובע את מקדם השבירה n = sqrt(ε_r * μ_r).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
