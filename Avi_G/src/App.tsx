/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserLevel, Domain, LearnMode } from './types';
import { learningResources } from './data/learningResources';
import WaveSimulator from './components/WaveSimulator';
import MusicSimulator from './components/MusicSimulator';
import EMWaveSimulator from './components/EMWaveSimulator';
import TechSimulator from './components/TechSimulator';
import SelfPracticeQuiz from './components/SelfPracticeQuiz';
import { 
  GraduationCap, 
  Compass, 
  Map, 
  BookOpen, 
  ExternalLink, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Music, 
  Radio, 
  Layers, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

export default function App() {
  const [level, setLevel] = useState<UserLevel>(UserLevel.GENERAL);
  const [mode, setMode] = useState<LearnMode>(LearnMode.SANDBOX);
  const [currentDomain, setCurrentDomain] = useState<Domain>(Domain.BASICS);

  // Toggle states for Key Terms and External Resources (Point 9 and 10)
  const [showKeyTerms, setShowKeyTerms] = useState<boolean>(false);
  const [showExternalResources, setShowExternalResources] = useState<boolean>(false);

  // Guided Tour progress state
  const [tourStep, setTourStep] = useState<number>(0); // 0 to 3 matching Domains
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);

  // Quizzes defined by Domain and Level
  const quizzes = [
    {
      domain: Domain.BASICS,
      question: 'מה קורה למהירות הגל (v) במיתר מתוח כאשר מגדילים את תדר הרטט (f) פי שניים?',
      answers: [
        'מהירות הגל גדלה פי שניים, מכיוון ש- v = λ * f.',
        'מהירות הגל קטנה פי שניים, כדי לשמור על אורך גל קבוע.',
        'מהירות הגל נותרת ללא שינוי, כיוון שהיא תלויה אך ורק במתיחות המיתר ובצפיפות המסה שלו.'
      ],
      correctIdx: 2,
      explanation: 'מהירות התפשטות של גל מכני נקבעת באופן בלעדי על ידי תכונות התווך האלסטי (מתיחות וצפיפות המסה הקווית של המיתר v = √(T/μ)). הגדלת התדר תגרום פשוט להתקצרות אורך הגל בחצי, אך המהירות תישאר קבועה.'
    },
    {
      domain: Domain.MUSIC,
      question: 'כיצד פועל מתמר (פיקאפ) של גיטרה חשמלית?',
      answers: [
        'הוא מקליט את גלי הקול באוויר באמצעות קפסולת קונדנסר אקוסטית.',
        'הוא מבוסס על חוק פארדיי להשראה אלקטרומגנטית: מיתר הפלדה הרוטט משנה את השטף המגנטי דרך סליל נחושת ומשרה בו מתח.',
        'הוא משתמש בחיישן לחץ אופטי המודד את תדירות התנועה של לוח התהודה מעץ.'
      ],
      correctIdx: 1,
      explanation: 'פיקאפ של גיטרה חשמלית מורכב ממגנט קבוע וסליל תיל. מיתר הפלדה הפרומגנטי מתמגנט וכאשר הוא רוטט, הוא מזיז את קווי השדה המגנטי. שינוי השטף בסליל יוצר זרם חשמלי חלש באותו תדר, המועבר להגברה.'
    },
    {
      domain: Domain.EM_WAVES,
      question: 'מה קורה למאפייני האור כאשר הוא עובר מריק לתוך חומר שקוף כמו זכוכית (n = 1.5)?',
      answers: [
        'התדר שלו קטן פי 1.5, ומהירותו ואורך הגל נותרים קבועים.',
        'תדרו נותר קבוע לחלוטין, אך מהירותו ואורך הגל שלו קטנים פי 1.5.',
        'מהירות האור גדלה פי 1.5 בשל הדחיסות האופטית.'
      ],
      correctIdx: 1,
      explanation: 'במעבר בין תווכים תדר הגל f נותר תמיד קבוע (כיוון שהוא מוכתב על ידי המקור). בהתאם ליחס n = c/v, המהירות v קטנה פי n (שווה ל-c/1.5). מאחר ש-v = λ * f, אורך הגל λ חייב להתכווץ בהתאם פי 1.5.'
    },
    {
      domain: Domain.TECH,
      question: 'כיצד מכשיר אולטרסאונד רפואי מחשב את המרחק והעומק של איברים פנימיים בגוף?',
      answers: [
        'הוא מודד את שינוי הטמפרטורה שגורם גל הקול בהגיעו לשומן.',
        'הוא מייצר גל אלקטרומגנטי קצר ומודד את זמן פיזור הפוטונים החוזרים.',
        'הוא שולח פולס אקוסטי ומודד את זמן המעוף (Time of Flight) של הד הקול המוחזר, לפי d = v * t / 2.'
      ],
      correctIdx: 2,
      explanation: 'האולטרסאונד מחשב את עומק הרקמה המעבירה על ידי קליטת פעימת ההד המוחזרת. המרחק d מחושב לפי זמן המעוף t כפול מהירות הקול הממוצעת ברקמות חיות (v ≈ 1540 m/s) חלקי שתיים (כיוון שהקול עושה מסלול כפול: הלוך וחזור).'
    }
  ];

  const handleDomainChange = (domain: Domain) => {
    setCurrentDomain(domain);
    // Reset quiz for sandbox
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const handleLevelChange = (newLevel: UserLevel) => {
    setLevel(newLevel);
  };

  const handleModeChange = (newMode: LearnMode) => {
    setMode(newMode);
    if (newMode === LearnMode.TOUR) {
      setTourStep(0);
      setCurrentDomain(Domain.BASICS);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  // Guided Tour navigation
  const handleNextStep = () => {
    if (tourStep < 3) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      
      // Update Domain automatically based on step
      const domains = [Domain.BASICS, Domain.MUSIC, Domain.EM_WAVES, Domain.TECH];
      setCurrentDomain(domains[nextStep]);
    }
  };

  const handlePrevStep = () => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);

      const domains = [Domain.BASICS, Domain.MUSIC, Domain.EM_WAVES, Domain.TECH];
      setCurrentDomain(domains[prevStep]);
    }
  };

  const submitQuiz = () => {
    if (selectedQuizAnswer === null) return;
    const currentQuiz = quizzes[tourStep];
    const correct = selectedQuizAnswer === currentQuiz.correctIdx;
    setIsAnswerCorrect(correct);
    setQuizSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100" dir="rtl">
      
      {/* Header section with brand identity and high contrast badges */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-sans font-extrabold tracking-tight">
                פורטל הגלים, המוזיקה והטכנולוגיה
              </h1>
              <p className="text-xs text-slate-400">
                מרכז אינטראקטיבי מתקדם ללימוד פיזיקה, אקוסטיקה, גלים אלקטרומגנטיים ויישומי דימות
              </p>
            </div>
          </div>

          {/* Level Switcher (General, High School, Academia) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <span className="text-slate-400 text-xs px-2.5 font-sans font-medium flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <span>בחרו רמת לימוד:</span>
            </span>
            <div className="flex bg-slate-900 rounded-xl p-0.5">
              <button
                onClick={() => handleLevelChange(UserLevel.GENERAL)}
                className={`px-3.5 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${level === UserLevel.GENERAL ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                id="level-general-btn"
              >
                הקהל הרחב
              </button>
              <button
                onClick={() => handleLevelChange(UserLevel.HIGH_SCHOOL)}
                className={`px-3.5 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${level === UserLevel.HIGH_SCHOOL ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                id="level-high-school-btn"
              >
                תיכון 5 יח"ל
              </button>
              <button
                onClick={() => handleLevelChange(UserLevel.ACADEMIA)}
                className={`px-3.5 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${level === UserLevel.ACADEMIA ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                id="level-academia-btn"
              >
                אקדמיה
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mode Control Bar (Guided Tour vs Sandbox) */}
      <div className="bg-white border-b border-slate-100 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Learn Mode Selection Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 w-fit" id="mode-selector">
            <button
              onClick={() => handleModeChange(LearnMode.SANDBOX)}
              className={`px-4 py-2 text-xs font-sans rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${mode === LearnMode.SANDBOX ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Compass className="w-4 h-4 text-sky-500" />
              <span>ארגז חול (חופשי)</span>
            </button>
            <button
              onClick={() => handleModeChange(LearnMode.TOUR)}
              className={`px-4 py-2 text-xs font-sans rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${mode === LearnMode.TOUR ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              id="guided-tour-tab-btn"
            >
              <Map className="w-4 h-4 text-emerald-500" />
              <span>סיור מודרך (Guided Tour)</span>
            </button>
          </div>

          {/* Sandbox Domain Navigation (Visible only in sandbox mode) */}
          {mode === LearnMode.SANDBOX ? (
            <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1" id="sandbox-domain-tabs">
              <button
                onClick={() => handleDomainChange(Domain.BASICS)}
                className={`px-3 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${currentDomain === Domain.BASICS ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                1. יסודות הגלים
              </button>
              <button
                onClick={() => handleDomainChange(Domain.MUSIC)}
                className={`px-3 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${currentDomain === Domain.MUSIC ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                2. מוזיקה וצלילים
              </button>
              <button
                onClick={() => handleDomainChange(Domain.EM_WAVES)}
                className={`px-3 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${currentDomain === Domain.EM_WAVES ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                3. גלים אלקטרומגנטיים
              </button>
              <button
                onClick={() => handleDomainChange(Domain.TECH)}
                className={`px-3 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${currentDomain === Domain.TECH ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                4. טכנולוגיות גלים
              </button>
              <button
                onClick={() => handleDomainChange(Domain.QUIZZES)}
                className={`px-3 py-1.5 text-xs font-sans rounded-lg cursor-pointer transition-all ${currentDomain === Domain.QUIZZES ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                5. שאלוני תרגול עצמי
              </button>
            </div>
          ) : (
            /* Guided Tour Progress Indicator */
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-sans font-medium">שלב בסיור:</span>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((step) => (
                  <div 
                    key={step} 
                    className={`w-7 h-2 rounded-full transition-all ${tourStep === step ? 'bg-emerald-500 w-10' : tourStep > step ? 'bg-emerald-300' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Guided Tour Walkthrough Guide Box */}
        {mode === LearnMode.TOUR && (
          <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/60 rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-4" id="guided-tour-banner">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full">סיור מודרך - שלב {tourStep + 1} מתוך 4</span>
                <h2 className="text-lg font-sans font-extrabold text-emerald-900">
                  {tourStep === 0 ? 'צעד ראשון: מהו גל מכני?' :
                   tourStep === 1 ? 'צעד שני: כיצד אקוסטיקה הופכת למוזיקה?' :
                   tourStep === 2 ? 'צעד שלישי: האור כגל אלקטרומגנטי' :
                   'צעד רביעי: גלים שמשנים את פני הרפואה והטכנולוגיה'}
                </h2>
              </div>

              {/* Step Navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={tourStep === 0}
                  className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="הקודם"
                  id="tour-prev-btn"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={tourStep === 3}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow shadow-emerald-500/10"
                  title="הבא"
                  id="tour-next-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed font-sans bg-white/50 p-4 rounded-xl border border-emerald-100/40">
              {learningResources[currentDomain].intro[level]}
            </div>
          </div>
        )}

        {/* Dynamic Concept and Syllabus Explanations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Interactive Lab View Column (Simulators & Controls) */}
          <div className="lg:col-span-8 space-y-8">
            {currentDomain === Domain.BASICS && <WaveSimulator level={level} />}
            {currentDomain === Domain.MUSIC && <MusicSimulator level={level} />}
            {currentDomain === Domain.EM_WAVES && <EMWaveSimulator level={level} />}
            {currentDomain === Domain.TECH && <TechSimulator level={level} />}
            {currentDomain === Domain.QUIZZES && <SelfPracticeQuiz level={level} />}
          </div>

          {/* Educational Curriculum and Terms Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-4">
              <button
                onClick={() => setShowKeyTerms(!showKeyTerms)}
                className="w-full text-right font-sans font-bold text-slate-800 text-md flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <span>מונחי מפתח - {learningResources[currentDomain].title}</span>
                </div>
                <span className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors">
                  {showKeyTerms ? 'הסתר ✕' : `הצג (${learningResources[currentDomain].concepts.length}) ➜`}
                </span>
              </button>

              {showKeyTerms && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {learningResources[currentDomain].concepts.map((concept) => (
                    <div key={concept.id} className="group border-b border-slate-50 pb-3 last:border-0 last:pb-0" id={`concept-${concept.id}`}>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {concept.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        {concept.explanations[level]}
                      </p>

                      {/* Conditional Formulas based on level settings */}
                      {concept.formulas && concept.formulas[level] && (
                        <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-indigo-700 font-bold text-left" dir="ltr">
                          {concept.formulas[level]?.map((formula, idx) => (
                            <div key={idx}>{formula}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guided Tour Interactive Quiz Block */}
            {mode === LearnMode.TOUR && (
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-4" id="guided-tour-quiz-box">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-emerald-800">
                  <HelpCircle className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-sans font-bold text-sm">בחן את עצמך - שאלת הבנה</h4>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {quizzes[tourStep].question}
                  </p>

                  <div className="space-y-2">
                    {quizzes[tourStep].answers.map((answer, idx) => (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizAnswer(idx)}
                        className={`w-full text-right p-3 rounded-xl text-xs leading-relaxed transition-all border cursor-pointer ${
                          quizSubmitted
                            ? idx === quizzes[tourStep].correctIdx
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                              : selectedQuizAnswer === idx
                                ? 'bg-red-50 border-red-500 text-red-900'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            : selectedQuizAnswer === idx
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-mono font-semibold ml-1">{String.fromCharCode(65 + idx)}.</span>
                        <span>{answer}</span>
                      </button>
                    ))}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={submitQuiz}
                      disabled={selectedQuizAnswer === null}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow shadow-emerald-500/10"
                      id="quiz-submit-btn"
                    >
                      בדיקת תשובה
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className={`p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed ${isAnswerCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                        {isAnswerCorrect ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold mb-1">{isAnswerCorrect ? 'כל הכבוד! תשובה נכונה.' : 'אופס! תשובה לא מדויקת.'}</div>
                          <p className="text-[11px] text-slate-600">{quizzes[tourStep].explanation}</p>
                        </div>
                      </div>

                      {tourStep < 3 ? (
                        <button
                          onClick={handleNextStep}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-all shadow shadow-indigo-500/10"
                          id="quiz-next-step-btn"
                        >
                          המשך לשלב הבא בסיור ➜
                        </button>
                      ) : (
                        <div className="bg-emerald-100 text-emerald-900 p-4 rounded-xl text-center font-sans text-xs font-bold border border-emerald-200 animate-bounce">
                          🎉 מזל טוב! השלמתם את הסיור המודרך בהצלחה!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Deep-Dive resources link center (קובץ העמקה דינמי) */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6" id="deep-dive-resources-center">
          <button
            onClick={() => setShowExternalResources(!showExternalResources)}
            className="w-full text-right font-sans font-bold text-slate-800 text-md flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="font-sans font-bold text-slate-800 text-md">
                מרכז העמקה דינמי - משאבי לימוד חיצוניים
              </h3>
            </div>
            <span className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors">
              {showExternalResources ? 'הסתר ✕' : 'הצג משאבים ➜'}
            </span>
          </button>

          {showExternalResources && (
            <div className="pt-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                כל הקישורים והמשאבים נטענים ומנוהלים מקובץ התוכן הראשי באופן דינמי כדי לאפשר הרחבה והוספה קלה בעתיד.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningResources[currentDomain].concepts.flatMap(c => c.deepLinks).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        <span>{link.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-3 inline-block">עבור לאתר חיצוני ➜</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs font-sans mt-auto" dir="rtl">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <div>© 2026 פורטל גלים, מוזיקה וטכנולוגיה. נבנה עבור למידה אינטראקטיבית וחקירה מדעית.</div>
          <div className="text-[10px] text-slate-500">כלל הסימולציות משתמשות בגרפיקת HTML5 Canvas ושלדות עיבוד Web Audio API בזמן אמת.</div>
        </div>
      </footer>

    </div>
  );
}
