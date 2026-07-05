import React, { useState, useEffect } from "react";
import { 
  Compass, 
  BookOpen, 
  Terminal, 
  MessageSquare, 
  Copy, 
  Check, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  Play, 
  RefreshCw, 
  BookMarked, 
  CheckCircle2, 
  Lightbulb, 
  Info,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  ClipboardCheck,
  BarChart3,
  Trash2
} from "lucide-react";
import { RECOMMENDED_COURSES, DEFAULT_PATHWAY, PROMPT_TEMPLATES } from "./data";
import { PathwayAnswers, CustomizedPathway, PromptTemplate, CourseResource, ChatMessage } from "./types";

// User feedback response structure
export interface FeedbackResponse {
  id: string;
  role: "teacher" | "student" | "admin";
  timestamp: string;
  isUserSubmitted?: boolean;
  answers: {
    q1: string; // Frequency of use / Overall impact
    q2: string; // Main benefit / Preferred tool / Strategic advantage
    q3: string; // Big challenge / Helped understanding / Resources sufficient
    rating: number; // 1-5 rating
    comments: string; // open feedback
    userName?: string; // name and details of submitter
  }
}

// Predefined questions categorized by role for the AI Advisor Chat
export const PREDEFINED_QUESTIONS_DATA = [
  {
    role: "teacher" as const,
    roleLabel: "מורה וצוות פדגוגי",
    questions: [
      "כיצד לעודד תלמידים להשתמש ב-AI כשותף חשיבה ולא להעתקה ישירה?",
      "הצע רעיון לניסוי חקר בפיזיקה (מכניקה) שמשלב פייתון ובינה מלאכותית",
      "איך ניתן להעריך דוח מעבדה שנכתב בסיוע בינה מלאכותית?",
      "כתוב לי מדריך קצר להוראת הפיזיקה באמצעות שיח סוקרטי עם כלי AI"
    ]
  },
  {
    role: "student" as const,
    roleLabel: "תלמידה ותלמיד",
    questions: [
      "אני מתקשה בכתיבת קוד פייתון ל-Curve Fitting של ניסוי מטוטלת, תוכל לעזור?",
      "כיצד אוכל להשתמש בבינה מלאכותית כדי להתכונן לבגרות בעל פה במעבדה?",
      "הסבר לי בצורה פשוטה את המשמעות של שגיאה שיטתית לעומת שגיאה אקראית",
      "איך לכתוב פרומפט טוב כדי שה-AI יסביר לי פיזיקה בלי לגלות לי את התשובה מיד?"
    ]
  },
  {
    role: "admin" as const,
    roleLabel: "מנהל ורכזי הוראה",
    questions: [
      "מהם מדדי ההצלחה המרכזיים להטמעת אוריינות AI במרכזים מדעיים?",
      "אילו הכשרות מקצועיות מומלץ להעביר לצוות המורים לקראת שנת הלימודים הבאה?",
      "כיצד לרתום את משרד החינוך להכרה בפעילות החקר החדשנית של המרכז?",
      "מהם האתגרים הלוגיסטיים והטכנולוגיים המרכזיים בהפעלת מעבדת AI בפריסה רחבה?"
    ]
  }
];

// Initial seed data for the dashboard to make it look alive and populated
const SEED_FEEDBACKS: FeedbackResponse[] = [
  {
    id: "t1",
    role: "teacher",
    timestamp: "30/06/2026, 10:15",
    answers: {
      q1: "יומיומית",
      q2: "כתיבת והסברת קוד פייתון למעבדות",
      q3: "העתקות וחוסר חשיבה עצמאית של תלמידים",
      rating: 5,
      comments: "כלי ה-AI שינו לחלוטין את הדרך שבה אני מכינה דפי מעבדה ומעבירה את השיעור. מחולל הקוד מאפשר לי לייצר פתרונות מותאמים אישית לכל קבוצה בשניות, והתלמידים מקבלים פידבק מהיר.",
      userName: "רונית מ., מורה לפיזיקה (מרכז שוורץ-רייסמן רחובות)"
    }
  },
  {
    id: "t2",
    role: "teacher",
    timestamp: "29/06/2026, 17:40",
    answers: {
      q1: "פעם-פעמיים בשבוע",
      q2: "ניסוח דגמי פתרון ובקרת תוצאות",
      q3: "חוסר זמן בתוכנית הלימודים הצפופה",
      rating: 4,
      comments: "הקושי העיקרי הוא לשמור על תלמידים ממוקדים בחשיבה הפיזיקלית ולא רק בהעתקת הקוד שנוצר עבורם. עם זאת, שילוב הדיאלוג הסוקרטי מאוד תרם להבנת תהליכי החקר.",
      userName: "ד\"ר ליעד רוזן, מורה לפיזיקה חקרנית"
    }
  },
  {
    id: "s1",
    role: "student",
    timestamp: "30/06/2026, 09:30",
    answers: {
      q1: "בכל שיעור/מעבדה",
      q2: "Claude (לכתיבת קוד ופרומפטים)",
      q3: "כן, באופן משמעותי מאוד",
      rating: 5,
      comments: "בזכות המערכת הזו הצלחתי סוף סוף להבין איך עושים curve fitting בפייתון לניסוי המטוטלת. פעם זה היה לוקח לי שעות של שגיאות באקסל והיום אני ממש שולט בקוד, פשוט חוויה!",
      userName: "יובל א., כיתה י\"א (שוורץ-רייסמן חולון)"
    }
  },
  {
    id: "s2",
    role: "student",
    timestamp: "28/06/2026, 14:15",
    answers: {
      q1: "לפעמים (לצורך דוחות חקר)",
      q2: "Google Colab (להרצת פייתון)",
      q3: "כן, בצורה מסוימת",
      rating: 4,
      comments: "כלי ה-AI מסביר את הפיזיקה בצורה פשוטה כמו מורה פרטי. לפעמים הוא מציע קוד מורכב מדי, אבל כשלומדים לכתוב פרומפטים נכונים זה מקל על החיים המון.",
      userName: "נועה ג., כיתה י\"ב (תלמידת מעבדה)"
    }
  },
  {
    id: "a1",
    role: "admin",
    timestamp: "29/06/2026, 11:00",
    answers: {
      q1: "השפעה מהפכנית ומשפרת למידה",
      q2: "הכנת התלמידים לאקדמיה ותעשייה",
      q3: "מספיק בהחלט",
      rating: 5,
      comments: "העמקת האוריינות הטכנולוגית והמדעית של התלמידים היא יעד אסטרטגי במרכז שוורץ-רייסמן. השילוב של AI ופייתון בבגרות המעבדה מוכיח את עצמו כפורץ דרך ברמה לאומית.",
      userName: "פרופ' אורי שלום, מנהל פדגוגי"
    }
  },
  {
    id: "a2",
    role: "admin",
    timestamp: "27/06/2026, 16:20",
    answers: {
      q1: "השפעה חיובית מתונה",
      q2: "העצמת מורים ופיתוח מקצועי",
      q3: "נדרש תגבור קל",
      rating: 4,
      comments: "המפתח להצלחה הוא המורים שלנו. ככל שנשקיע יותר שעות פיתוח מקצועי והכשרות לצוות, כך הטמעת כלי ה-AI בקרב התלמידים תהיה עמוקה, מעצימה ובטוחה יותר פדגוגית.",
      userName: "רונית אילון, סגנית מנהל המרכז"
    }
  }
];

export default function App() {
  // Navigation & Active tab state
  const [activeTab, setActiveTab] = useState<"roadmap" | "prompts" | "lab-coder" | "advisor-chat" | "feedback">("roadmap");
  
  // Questionnaire states
  const [answers, setAnswers] = useState<PathwayAnswers>({
    role: "אין לי נסיון קודם.",
    grades: ["כיתה י'", "כיתה י\"א"],
    goals: ["ניתוח נתוני מעבדה וגרפים", "שיפור הבנה תיאורטית ופתרון בעיות"],
    priorCoding: "אין בכלל",
    teacherAiUsage: "יצירת מערכי שיעור ומעבדות",
    resources: "שילוב של קמפוס IL וסרטוני YouTube",
    focusArea: "מכניקה ומעבדות חקר"
  });
  
  const [showQuestionnaire, setShowQuestionnaire] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [customPathway, setCustomPathway] = useState<CustomizedPathway>(DEFAULT_PATHWAY);
  const [isGeneratingPathway, setIsGeneratingPathway] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // New feedback survey states
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>(() => {
    const saved = localStorage.getItem("schwartz_reisman_ai_feedback");
    return saved ? JSON.parse(saved) : SEED_FEEDBACKS;
  });
  const [feedbackRole, setFeedbackRole] = useState<"teacher" | "student" | "admin">("teacher");
  const [feedbackViewMode, setFeedbackViewMode] = useState<"fill" | "results">("fill");
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Individual Form States
  const [teacherForm, setTeacherForm] = useState({
    frequency: "",
    primaryBenefit: "",
    challenge: "",
    rating: 5,
    comments: "",
    name: ""
  });

  const [studentForm, setStudentForm] = useState({
    frequency: "",
    preferredTool: "",
    helpedUnderstanding: "",
    rating: 5,
    comments: "",
    name: ""
  });

  const [adminForm, setAdminForm] = useState({
    impact: "",
    strategicBenefit: "",
    resourcesAllocated: "",
    rating: 5,
    comments: "",
    name: ""
  });

  // Prompt Library states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePromptId, setActivePromptId] = useState<string>("socratic-physics-coach");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  
  // Custom prompt template inputs
  const [customParam, setCustomParam] = useState<string>("מדוע בתנועה מעגלית אנכית כוח הנורמל בנקודה העליונה משתנה עם המהירות?");

  // Lab Coder states
  const [experimentType, setExperimentType] = useState<string>("תנועה שוות תאוצה על מסילה (חוק שני של ניוטון)");
  const [labParameters, setLabParameters] = useState<string>("מדידת זמן מעבר של עגלה בין חיישנים אופטיים, מסות משתנות");
  const [generatedCode, setGeneratedCode] = useState<string>(`# קוד פייתון מוכן להרצה ב-Google Colab לניתוח ניסוי קינמטיקה
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

# 1. נתוני הניסוי: מסת העגלה קבועה, מודדים תאוצה כפונקציה של הכוח המושך
# F (כוח בניוטונים), a (תאוצה במטר לשנייה בריבוע)
F_data = np.array([0.1, 0.2, 0.3, 0.4, 0.5])
a_data = np.array([0.19, 0.42, 0.58, 0.81, 0.98])
a_error = np.array([0.02, 0.02, 0.02, 0.02, 0.02]) # שגיאת מדידה בתאוצה

# 2. הגדרת פונקציית ההתאמה (פונקציה לינארית לפי חוק שני של ניוטון a = F / m)
def linear_fit(F, inv_m, intercept):
    return inv_m * F + intercept

# 3. ביצוע התאמה לינארית (Linear Regression)
popt, pcov = curve_fit(linear_fit, F_data, a_data, sigma=a_error, absolute_sigma=True)
inv_m_fitted, intercept_fitted = popt
inv_m_error = np.sqrt(pcov[0,0])

# חישוב המסה והשגיאה שלה
mass_fitted = 1.0 / inv_m_fitted
mass_error = inv_m_error / (inv_m_fitted ** 2)

print(f"Inverse Mass (Slope): {inv_m_fitted:.4f} ± {inv_m_error:.4f} [1/kg]")
print(f"Fitted Mass: {mass_fitted:.3f} ± {mass_error:.3f} [kg]")
print(f"Intercept: {intercept_fitted:.4f}")

# 4. שרטוט הגרף המדעי המקצועי
plt.figure(figsize=(8, 5))
plt.errorbar(F_data, a_data, yerr=a_error, fmt='o', color='navy', label='מדידות מעבדה עם שגיאה', capsize=4)

# שרטוט קו ההתאמה התיאורטי
F_smooth = np.linspace(0, 0.6, 100)
plt.plot(F_smooth, linear_fit(F_smooth, *popt), '--', color='red', label=f'התאמה ליניארית: a = {inv_m_fitted:.2f}*F + {intercept_fitted:.2f}')

# כותרות וצירים (הסבר לתצוגה דו-לשונית)
plt.title("Acceleration vs. Force (a as a function of F)", fontsize=14, fontweight='bold')
plt.xlabel("Force F [N]", fontsize=12)
plt.ylabel("Acceleration a [m/s^2]", fontsize=12)
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(loc='upper left', fontsize=10)
plt.xlim(0, 0.6)
plt.ylim(0, 1.2)

plt.show()`);
  const [codeExplanation, setCodeExplanation] = useState<string>("הקוד מבצע התאמה ליניארית (רגרסיה) לנתוני הכוח והתאוצה על מנת למצוא את המסה ההופכית (שיפוע הגרף). הוא משתמש בשיטת הריבועים הפחותים הלוקחת בחשבון את שגיאות המדידה (Error Bars). השיפוע מאפשר לחלץ את מסת העגלה המשולבת יחד עם אי הוודאות המחושבת ישירות ממטריצת השונות המשותפת (Covariance Matrix).");
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Chat/Advisor state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: "שלום! אני **יועץ פיזיק-AI** של מרכז שוורץ-רייסמן. אני כאן כדי להציע לך הדרכה פדגוגית לכל אורך הדרך: כיצד להנחות את תלמידי כיתות י' עד י\"ב להשתמש בכלי בינה מלאכותית באופן עצמאי, לכתוב איתם סימולציות ב-VPython, לבצע ניתוחי מעבדות ב-Google Colab, או ללטש פרומפטים המעודדים חשיבה חקרנית. במה אוכל לסייע לך היום?",
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [selectedSuggestionRole, setSelectedSuggestionRole] = useState<"teacher" | "student" | "admin">("teacher");

  // Fetch API status on mount
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey);
      })
      .catch((err) => {
        console.error("Failed to check config status:", err);
        setHasApiKey(false); // fallback alert if server offline
      });
  }, []);

  // Handle Dynamic Pathway Generation
  const handleGeneratePathway = async () => {
    setIsGeneratingPathway(true);
    setApiError(null);
    try {
      const response = await fetch("/api/generate-pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      if (!response.ok) {
        throw new Error(`שגיאה בשרת (${response.status}). אנא וודא כי מפתח ה-API מוגדר.`);
      }
      const data = await response.json();
      setCustomPathway(data);
      setShowQuestionnaire(false);
    } catch (err: any) {
      setApiError(err.message || "חלה שגיאה לא צפויה ביצירת המסלול האישי.");
    } finally {
      setIsGeneratingPathway(false);
    }
  };

  // Handle Lab Code Generation
  const handleGenerateLabCode = async () => {
    setIsGeneratingCode(true);
    setApiError(null);
    try {
      const response = await fetch("/api/generate-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentType, parameters: { details: labParameters } })
      });
      if (!response.ok) {
        throw new Error(`שגיאה בשרת (${response.status}). אנא וודא כי מפתח ה-API מוגדר.`);
      }
      const data = await response.json();
      setGeneratedCode(data.code);
      setCodeExplanation(data.explanation);
    } catch (err: any) {
      setApiError(err.message || "חלה שגיאה ביצירת קוד הפייתון.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Core function to submit a chat message
  const submitChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsSendingMessage(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history })
      });

      if (!response.ok) {
        throw new Error("לא התקבל מענה תקין מהשרת.");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "מצטער, נתקלתי בקושי זמני בתקשורת עם השרת. אנא וודאו כי מפתח ה-GEMINI_API_KEY מוגדר כראוי במערכת.",
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle sending chat message via input form
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const textToSend = userInput;
    setUserInput("");
    await submitChatMessage(textToSend);
  };

  // Handle form submission for feedback questionnaires
  const handleFormSubmit = () => {
    let newEntry: FeedbackResponse;
    const nowStr = new Date().toLocaleString("he-IL", { hour12: false });

    if (feedbackRole === "teacher") {
      newEntry = {
        id: `user-t-${Date.now()}`,
        role: "teacher",
        timestamp: nowStr,
        isUserSubmitted: true,
        answers: {
          q1: teacherForm.frequency || "לא צוין",
          q2: teacherForm.primaryBenefit || "לא צוין",
          q3: teacherForm.challenge || "לא צוין",
          rating: teacherForm.rating,
          comments: teacherForm.comments,
          userName: teacherForm.name || "מורה אנונימי/ת"
        }
      };
    } else if (feedbackRole === "student") {
      newEntry = {
        id: `user-s-${Date.now()}`,
        role: "student",
        timestamp: nowStr,
        isUserSubmitted: true,
        answers: {
          q1: studentForm.frequency || "לא צוין",
          q2: studentForm.preferredTool || "לא צוין",
          q3: studentForm.helpedUnderstanding || "לא צוין",
          rating: studentForm.rating,
          comments: studentForm.comments,
          userName: studentForm.name || "תלמיד/ה אנונימי/ת"
        }
      };
    } else {
      newEntry = {
        id: `user-a-${Date.now()}`,
        role: "admin",
        timestamp: nowStr,
        isUserSubmitted: true,
        answers: {
          q1: adminForm.impact || "לא צוין",
          q2: adminForm.strategicBenefit || "לא צוין",
          q3: adminForm.resourcesAllocated || "לא צוין",
          rating: adminForm.rating,
          comments: adminForm.comments,
          userName: adminForm.name || "חבר/ת הנהלה"
        }
      };
    }

    const updated = [newEntry, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem("schwartz_reisman_ai_feedback", JSON.stringify(updated));
    setSubmittedSuccess(true);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    const customizedText = text.replace("[הכנס נושא פיזיקלי, למשל: מדוע בתנועה מעגלית אנכית כוח הנורמל בנקודה העליונה משתנה עם המהירות?]", customParam)
                               .replace("[הכנס את הנוסחה או המושג, למשל: פיתוח מהירות מילוט מכבידה של כוכב לכת]", customParam)
                               .replace("[הכנס תופעה, למשל: מטוטלת קפיצית דו-ממדית עם חיכוך אוויר]", customParam)
                               .replace("[הדבק כאן את דוח המעבדה או את הפרקים הרלוונטיים]", "דו\"ח מדידת מקדם חיכוך קינטי באמצעות קפיץ.");
    
    navigator.clipboard.writeText(customizedText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Banner warning if API Key is missing */}
      {!hasApiKey && (
        <div className="bg-amber-500 text-white px-6 py-2.5 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>
              שים לב: <strong>GEMINI_API_KEY</strong> אינו מוגדר. האפליקציה פועלת במצב סימולציה מקומי. 
              הגדר את מפתח ה-API בלוח ה-Secrets של AI Studio כדי להפעיל בינה מלאכותית חיה.
            </span>
          </div>
          <div className="text-xs bg-white/20 px-3 py-1 rounded border border-white/30">
            מצב לא מחובר
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center space-x-4 space-x-reverse">
          <svg viewBox="0 0 100 100" className="w-10 h-10 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(50, 50)">
              {/* Definitions of the 3 ellipses with beautiful gold color and precise dimensions */}
              {[30, 90, 150].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="0"
                  rx="36"
                  ry="15"
                  stroke="#b39753"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`rotate(${angle})`}
                  fill="none"
                />
              ))}
              {/* Intersecting mask overlays to create the premium "woven ribbon" look from the official logo */}
              {[0, 120, 240].map((angle, i) => {
                // At 0, 120, 240 degrees, we mask the intersections to create the over-under weaving effect
                const x = 22 * Math.cos((angle * Math.PI) / 180);
                const y = 22 * Math.sin((angle * Math.PI) / 180);
                return (
                  <circle
                    key={`mask-${i}`}
                    cx={x}
                    cy={y}
                    r="5.5"
                    fill="#ffffff"
                  />
                );
              })}
              {/* Redraw the overlapping segments on top of the masks to complete the continuous weave */}
              {[30, 150].map((angle, i) => (
                <path
                  key={`top-arc-${i}`}
                  d="M -15 -10 A 36 15 0 0 1 15 -10"
                  stroke="#b39753"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  transform={`rotate(${angle})`}
                  fill="none"
                />
              ))}
            </g>
          </svg>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">מרכז שוורץ-רייסמן לחינוך מדעי</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wider">מערכת הכשרה תלת-שנתית לבינה מלאכותית בפיזיקה לבגרות</p>
          </div>
        </div>

        {/* Student and Tab Navigation Wrapper */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Student Name */}
          <div className="flex items-center space-x-2 space-x-reverse bg-amber-50 border border-amber-200/80 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
            <User className="w-4 h-4 text-amber-600" />
            <span>שם תלמיד: <span className="font-bold">אלברט אינשטיין</span></span>
          </div>

          {/* Tab Switcher */}
          <nav className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 text-xs sm:text-sm font-medium text-slate-600 gap-1">
            <button 
              id="tab-roadmap"
              onClick={() => setActiveTab("roadmap")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "roadmap" ? "bg-white text-blue-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>מסלול הכשרה אישי</span>
            </button>

            <button 
              id="tab-prompts"
              onClick={() => setActiveTab("prompts")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "prompts" ? "bg-white text-blue-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>ספריית פרומפטים</span>
            </button>

            <button 
              id="tab-lab-coder"
              onClick={() => setActiveTab("lab-coder")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "lab-coder" ? "bg-white text-blue-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>מחולל קוד מעבדה</span>
            </button>

            <button 
              id="tab-feedback"
              onClick={() => setActiveTab("feedback")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "feedback" ? "bg-white text-blue-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>שאלוני משוב והערכה</span>
            </button>

            <button 
              id="tab-advisor-chat"
              onClick={() => setActiveTab("advisor-chat")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "advisor-chat" ? "bg-white text-blue-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>צ'אט יועץ פדגוגי</span>
            </button>
          </nav>
        </div>

        {/* User Context */}
        <div className="hidden lg:flex items-center space-x-3 space-x-reverse bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-medium text-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>מרכז שוורץ-רייסמן: תכנית י'-י\"ב</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto grid grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Interactive Status & Quick Resource Cards */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-6">
          
          {/* Quick Stats/Target Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative">
              <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">מטרת שוורץ-רייסמן</span>
              <h3 className="text-lg font-bold mt-1 mb-2">למידת מיומנויות עצמאית</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                רכישת ארגז כלים דיגיטלי המבוסס על בינה מלאכותית, אקסל והנדסת פרומפטים.
              </p>
              
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                <span>שלב הכשרה נוכחי</span>
                <span className="text-blue-400 font-bold">הקמת בסיס י'-י\"ב</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 w-2/3 h-full rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Core Skills Toolbox Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ארגז כלים מיומן</h3>
            <div className="space-y-3">
              <div className="flex items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/40 transition">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-2.5 ml-2.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">הנדסת פרומפטים ב-Claude</p>
                  <p className="text-[10px] text-slate-500 truncate">שימוש בתגיות XML, הנחיות מערכת ושרשור מחשבה</p>
                </div>
              </div>

              <div className="flex items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/40 transition">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mr-2.5 ml-2.5">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">עבודה עם Claude Code</p>
                  <p className="text-[10px] text-slate-500 truncate">כלי פיתוח מונחה-סוכן (CLI) לכתיבת קוד וסקריפטים</p>
                </div>
              </div>

              <div className="flex items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/40 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mr-2.5 ml-2.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">ניתוח נתונים באקסל ובכלי AI</p>
                  <p className="text-[10px] text-slate-500 truncate">עיבוד, גרפים וניתוח מעבדתי מבוסס נתונים</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links to resources mentioned */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">משאבים מומלצים</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">חינם</span>
            </div>
            
            <div className="space-y-3.5">
              {RECOMMENDED_COURSES.slice(0, 3).map((course) => (
                <div key={course.id} className="group border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {course.platform}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">{course.duration}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition truncate">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                    {course.description}
                  </p>
                  <a 
                    href={course.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] text-blue-600 font-semibold hover:underline mt-1.5 inline-flex items-center"
                  >
                    מעבר לקורס 
                    <ChevronLeft className="w-3 h-3 mr-0.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* MIDDLE & LEFT COLUMN: Dynamic Interactive Tab Workspace */}
        <section className="col-span-12 lg:col-span-9 flex flex-col space-y-6">
          
          {/* TAB 1: ROADMAP & QUESTIONNAIRE */}
          {activeTab === "roadmap" && (
            <div className="space-y-6">
              
              {/* Questionnaire Activator Banner */}
              <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="p-1 bg-blue-100 text-blue-600 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h2 className="text-base font-bold text-slate-800">התאמת מסלול לימודים תלת-שנתי אישי</h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    ענו על מספר שאלות קצרות בנוגע לתחומי המיקוד והניסיון הקודם, והבינה המלאכותית תבנה עבורכם סילבוס מקיף המשלב מקורות שונים.
                  </p>
                </div>
                <button
                  id="start-quiz-btn"
                  onClick={() => {
                    setShowQuestionnaire(true);
                    setCurrentStep(1);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition shadow-md shadow-blue-100 flex items-center space-x-2 space-x-reverse cursor-pointer shrink-0"
                >
                  <span>הפעלת שאלון התאמה</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Interactive Questionnaire Modal/Box */}
              {showQuestionnaire && (
                <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">שאלון אפיון פדגוגי - שלב {currentStep} מתוך 4</h3>
                      <p className="text-xs text-slate-500 mt-1">התשובות שלך יעזרו ל-Gemini לבנות את תכנית ההכשרה המיטבית</p>
                    </div>
                    <button 
                      onClick={() => setShowQuestionnaire(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      ביטול
                    </button>
                  </div>

                  {/* Step 1: Target Role & Grade levels */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">1. מה רמת הידע שלך והנסיון שלך עם כלי AI?</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { id: "אין לי נסיון קודם.", label: "אין לי נסיון קודם." },
                            { id: "יש לי היכרות בסיסית עם כלי AI", label: "יש לי היכרות בסיסית עם כלי AI" },
                            { id: "יש לי נסיון רב עם כלי AI", label: "יש לי נסיון רב עם כלי AI" }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setAnswers({ ...answers, role: opt.id })}
                              className={`p-3 rounded-xl text-xs text-right font-medium border text-slate-700 transition cursor-pointer ${answers.role === opt.id ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">2. איזו שכבת לימוד אתה?</label>
                        <div className="flex flex-wrap gap-2">
                          {["כיתה י'", "כיתה י\"א", "כיתה י\"ב"].map((grade) => {
                            const isSelected = answers.grades.includes(grade);
                            return (
                              <button
                                key={grade}
                                onClick={() => {
                                  const updated = isSelected 
                                    ? answers.grades.filter(g => g !== grade)
                                    : [...answers.grades, grade];
                                  setAnswers({ ...answers, grades: updated });
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${isSelected ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                              >
                                {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Coding Experience & Primary Learning Goals */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">3. מהי רמת הניסיון הקודמת של התלמידים בכתיבת קוד / Python?</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["אין בכלל - למידה מאפס", "בסיסית מאוד", "מנוסים בתכנות בסיסי"].map((level) => (
                            <button
                              key={level}
                              onClick={() => setAnswers({ ...answers, priorCoding: level })}
                              className={`p-3 rounded-xl text-xs font-medium border text-slate-700 transition cursor-pointer ${answers.priorCoding === level ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">4. אילו מטרות למידה הן החשובות ביותר לדעתך?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            "ניתוח נתוני מעבדה וגרפים",
                            "כתיבת סימולציות פיזיקליות ב-GlowScript",
                            "שיפור הבנה תיאורטית ופתרון בעיות",
                            "ביקורת עצמית וכתיבת דוחות מעבדה אקדמיים"
                          ].map((goal) => {
                            const isSelected = answers.goals.includes(goal);
                            return (
                              <button
                                key={goal}
                                onClick={() => {
                                  const updated = isSelected 
                                    ? answers.goals.filter(g => g !== goal)
                                    : [...answers.goals, goal];
                                  setAnswers({ ...answers, goals: updated });
                                }}
                                className={`p-3 rounded-xl text-xs text-right font-medium border text-slate-700 transition cursor-pointer ${isSelected ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                              >
                                {goal}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Teacher AI Usage & Favorite platforms */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">5. כיצד היית רוצה שהמורה ישלב בעיקר כלי AI כיום?</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: "יצירת מערכי שיעור ומעבדות", label: "פיתוח מערכי שיעור, דפי עבודה וניסויים" },
                            { id: "בדיקת דוחות מעבדה", label: "ביקורת דוחות מעבדה והערכה מעצימה לתלמיד" },
                            { id: "כלי למידה אקטיבי בכיתה", label: "הנחיית התלמיד לשימוש ב-AI כשותף חשיבה" }
                          ].map((usage) => (
                            <button
                              key={usage.id}
                              onClick={() => setAnswers({ ...answers, teacherAiUsage: usage.id })}
                              className={`p-3 rounded-xl text-xs font-medium border text-slate-700 transition cursor-pointer ${answers.teacherAiUsage === usage.id ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                            >
                              {usage.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">6. מהו סוג חומרי הלימוד המועדף עליך?</label>
                        <select
                          value={answers.resources}
                          onChange={(e) => setAnswers({ ...answers, resources: e.target.value })}
                          className="w-full p-3 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
                        >
                          <option value="שילוב של קמפוס IL וסרטוני YouTube">שילוב של קורסי וידאו (קמפוס IL) והדגמות מעשיות</option>
                          <option value="מחברות Google Colab מוכנות ומדריכי פייתון">מחברות קוד אינטראקטיביות (Google Colab) מוכנות</option>
                          <option value="מדריכים לכתובת פרומפטים מונחי פיזיקה">מדריכי הנדסת פרומפטים ישירים וצ'אטים מונחים</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Core Area Focus and Submission */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">7. באיזה תחום ליבה פיזיקלי תרצו לשים דגש מיוחד?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            "מכניקה ומעבדות חקר (חוקי ניוטון, אנרגיה ותנועה הרמונית)",
                            "אלקטרומגנטיות וזרם חילופין",
                            "פיזיקה מודרנית (האפקט הפוטואלקטרי, קוונטים וקרינה)",
                            "כללי - שילוב הדרגתי בכל נושאי הלימוד לבגרות"
                          ].map((topic) => (
                            <button
                              key={topic}
                              onClick={() => setAnswers({ ...answers, focusArea: topic })}
                              className={`p-3 rounded-xl text-xs text-right font-medium border text-slate-700 transition cursor-pointer ${answers.focusArea === topic ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-2.5 space-x-reverse">
                        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-normal">
                          בלחיצה על כפתור השליחה, מודל השפה Gemini 3.5 Flash ינתח את המענים, יסנכרן אותם עם המשאבים הזמינים (קמפוס IL, YouTube) ויתאים תוכנית תלת-שנתית ייעודית למרכז שוורץ-רייסמן.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Questionnaire Navigation controls */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <button
                      disabled={currentStep === 1}
                      onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 space-x-reverse"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>הקודם</span>
                    </button>

                    {currentStep < 4 ? (
                      <button
                        onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 4))}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 space-x-reverse"
                      >
                        <span>הבא</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        id="submit-quiz-btn"
                        onClick={handleGeneratePathway}
                        disabled={isGeneratingPathway}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-100 flex items-center space-x-2 space-x-reverse"
                      >
                        {isGeneratingPathway ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>בונה תכנית הכשרה מותאמת...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>מחולל מסלול לימודים אישי</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Show error notification if API generation fails */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-center space-x-2 space-x-reverse">
                  <Info className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">שגיאה במערכת:</span> {apiError}
                  </div>
                </div>
              )}

              {/* Personalized 3-Year Curriculum Output */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-2">
                  <div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                      תכנית הכשרה מותאמת אישית
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 mt-2">{customPathway.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      // print or export simulation
                      window.print();
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl transition flex items-center space-x-1.5 space-x-reverse font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>הדפסת תכנית הלימודים</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  {customPathway.overview}
                </p>

                {/* Years display */}
                <div className="space-y-6 relative border-r-2 border-slate-200 pr-5 mr-3">
                  {customPathway.years.map((year, idx) => (
                    <div key={idx} className="relative group">
                      
                      {/* Timeline dot */}
                      <span className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white group-hover:scale-110 transition duration-150"></span>
                      
                      <div className="bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl p-5 transition-all shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 space-x-reverse">
                            <span className="text-blue-600 font-bold">{year.yearName.split(" - ")[0]}</span>
                            <span className="text-slate-400 font-normal">|</span>
                            <span className="text-slate-700 text-xs font-semibold">{year.yearName.split(" - ")[1] || year.focus}</span>
                          </h3>
                        </div>

                        <p className="text-xs font-medium text-slate-500 mb-4 bg-slate-50/80 px-3 py-2 rounded-lg">
                          <strong>מיקוד פיזיקלי:</strong> {year.physicsContext}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>מיומנויות AI ונתונים שיירכשו:</span>
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {year.skills.map((skill, sIdx) => (
                                <li key={sIdx} className="flex items-start">
                                  <span className="text-blue-500 ml-1.5">•</span>
                                  <span>{skill}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                              <span>משאבי לימוד מומלצים:</span>
                            </h4>
                            <div className="space-y-2">
                              {year.suggestedResources.map((res, rIdx) => (
                                <div key={rIdx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800">{res.name}</p>
                                    <p className="text-[10px] text-slate-500">פלטפורמה: {res.platform}</p>
                                  </div>
                                  {res.url && (
                                    <a 
                                      href={res.url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                                    >
                                      קישור
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50/30 border border-dashed border-blue-200/80 p-4 rounded-xl mt-3">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">פרויקט ציון דרך מעשי (Milestone)</span>
                          <h4 className="text-xs font-bold text-slate-800 mb-1">{year.milestoneProject.split(":")[0]}</h4>
                          <p className="text-xs text-slate-600 leading-normal">{year.milestoneProject.includes(":") ? year.milestoneProject.substring(year.milestoneProject.indexOf(":") + 1) : year.milestoneProject}</p>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: READY-MADE PHYSICS PROMPT LIBRARY */}
          {activeTab === "prompts" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                  משאבי פדגוגיה מעשית
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">ספריית פרומפטים מונחי פיזיקה</h2>
                <p className="text-xs text-slate-500 mt-1">
                  העתק ועצב פרומפטים מוכנים המגדירים את כלי ה-AI כמורים מלווים, כותבי סימולציות או מבקרי דוחות חקר.
                </p>
              </div>

              {/* Filtering tabs */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: "all", label: "כל הפרומפטים" },
                  { id: "socratic", label: "דיאלוג סוקרטי" },
                  { id: "derivation", label: "פיתוחים מתמטיים" },
                  { id: "simulation", label: "סימולציות VPython" },
                  { id: "lab_report", label: "ביקורת דוחות מעבדה" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer font-medium ${selectedCategory === cat.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                
                {/* List of prompts */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {PROMPT_TEMPLATES
                    .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
                    .map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => {
                          setActivePromptId(prompt.id);
                        }}
                        className={`w-full text-right p-4 rounded-xl border transition cursor-pointer block ${activePromptId === prompt.id ? "bg-blue-50/60 border-blue-400" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                      >
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                          {prompt.physicsTopic}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-2">{prompt.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                          {prompt.description}
                        </p>
                      </button>
                    ))}
                </div>

                {/* Selected Prompt view & custom parameters input */}
                {(() => {
                  const currentPrompt = PROMPT_TEMPLATES.find((p) => p.id === activePromptId);
                  if (!currentPrompt) return <p className="text-xs text-slate-400">בחר פרומפט מהרשימה</p>;
                  return (
                    <div className="col-span-12 md:col-span-8 bg-slate-50/40 border border-slate-200 rounded-2xl p-5 flex flex-col space-y-4">
                      
                      <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-200/60">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{currentPrompt.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">קטגוריה: {currentPrompt.category === 'socratic' ? 'חשיבה סוקרטית' : currentPrompt.category === 'simulation' ? 'בניית סימולציה' : currentPrompt.category === 'derivation' ? 'הסבר נוסחאות' : 'סקירת מעבדות'}</p>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(currentPrompt.id, currentPrompt.promptText)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow-sm"
                        >
                          {copiedPromptId === currentPrompt.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">הועתק ללוח!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתק פרומפט מותאם</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Educational explanation card */}
                      <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl flex items-start space-x-2.5 space-x-reverse">
                        <Lightbulb className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-800">הערך הפדגוגי לתלמיד:</h4>
                          <p className="text-xs text-amber-700 leading-normal mt-0.5">{currentPrompt.explanation}</p>
                        </div>
                      </div>

                      {/* Prompt Parameter Form */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600">התאמה אישית של נושא / קובץ הניסוי:</label>
                        <input
                          type="text"
                          value={customParam}
                          onChange={(e) => setCustomParam(e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 font-medium shadow-inner"
                          placeholder="רשמו כאן את הנושא הספציפי שתרצו לכלול בפרומפט..."
                        />
                        <p className="text-[10px] text-slate-400">הטקסט שתרשמו כאן יחליף אוטומטית את הסוגריים המרובעים בתוך קוד הפרומפט בעת ההעתקה.</p>
                      </div>

                      {/* Prompt Box */}
                      <div className="flex-1 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold mb-1">תצוגה מקדימה של הפרומפט:</span>
                        <div className="relative bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed text-left" dir="ltr">
                          {currentPrompt.promptText
                            .replace("[הכנס נושא פיזיקלי, למשל: מדוע בתנועה מעגלית אנכית כוח הנורמל בנקודה העליונה משתנה WITH המהירות?]", customParam)
                            .replace("[הכנס נושא פיזיקלי, למשל: מדוע בתנועה מעגלית אנכית כוח הנורמל בנקודה העליונה משתנה עם המהירות?]", customParam)
                            .replace("[הכנס את הנוסחה או המושג, למשל: פיתוח מהירות מילוט מכבידה של כוכב לכת]", customParam)
                            .replace("[הכנס תופעה, למשל: מטוטלת קפיצית דו-ממדית עם חיכוך אוויר]", customParam)
                            .replace("[הדבק כאן את דוח המעבדה או את הפרקים הרלוונטיים]", "דו\"ח מדידת מקדם חיכוך קינטי באמצעות קפיץ.")}
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>
          )}

          {/* TAB 3: LAB CODE GENERATOR */}
          {activeTab === "lab-coder" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                  ניתוח נתונים דיגיטלי
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">מחולל קוד מעבדה מבוסס פייתון</h2>
                <p className="text-xs text-slate-500 mt-1">
                  הגדירו את סוג הניסוי הפיזיקלי, והבינה המלאכותית תכין מחברת Google Colab מקיפה המבצעת רגרסיה ושרטוט גרף מדעי עם פסי שגיאה.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Parameters pane */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">סוג ניסוי המעבדה:</label>
                    <select
                      value={experimentType}
                      onChange={(e) => setExperimentType(e.target.value)}
                      className="w-full p-3 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="תנועה שוות תאוצה על מסילה (חוק שני של ניוטון)">חוק שני של ניוטון (תאוצה וכוח)</option>
                      <option value="חוק הוק ומדידת קבוע קפיץ k">חוק הוק ומדידת קבוע קפיץ k</option>
                      <option value="מדידת תאוצת הכבידה g בעזרת מטוטלת פשוטה">מדידת תאוצת הכבידה g בעזרת מטוטלת</option>
                      <option value="חוק אום ודיוק בהתנגדות חוט מוליך">חוק אום והתנגדות סגולית</option>
                      <option value="טעינה ופריקה של קבל (ניתוח אקספוננציאלי)">טעינה ופריקה של קבל (אקספוננציאל)</option>
                      <option value="מדידת קבוע פלאנק באפקט הפוטואלקטרי">האפקט הפוטואלקטרי (בגרות מעבדה י\"ב)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">פרמטרים מיוחדים ומדידות נוספות (אופציונלי):</label>
                    <textarea
                      rows={4}
                      value={labParameters}
                      onChange={(e) => setLabParameters(e.target.value)}
                      className="w-full p-3 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
                      placeholder="למשל: סוג השגיאה (מחשוב אופטי, מדידה ידנית), קצב לקיחת נתונים, שמות משתנים לגרף וכדומה..."
                    />
                  </div>

                  <button
                    onClick={handleGenerateLabCode}
                    disabled={isGeneratingCode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-blue-100 flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
                  >
                    {isGeneratingCode ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>יוצר קוד ומדריך פדגוגי...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>חולל קוד וגרף מעבדתי</span>
                      </>
                    )}
                  </button>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1 space-x-reverse">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span>כיצד תלמיד מריץ את הקוד?</span>
                    </h4>
                    <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                      <li>מעתיקים את קוד הפייתון המיוצר.</li>
                      <li>פותחים דפדפן בכתובת colab.research.google.com</li>
                      <li>יוצרים מחברת חדשה, מדביקים ומריצים (Shift+Enter).</li>
                    </ol>
                  </div>
                </div>

                {/* Code display pane */}
                <div className="col-span-12 md:col-span-8 flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">קוד פייתון מוכן לשימוש (SciPy / Matplotlib):</span>
                    <button
                      onClick={handleCopyCode}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-600">הועתק בהצלחה!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>העתקת קוד פייתון</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre max-h-96 text-left" dir="ltr">
                    {generatedCode}
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-blue-800 mb-1 flex items-center space-x-1 space-x-reverse">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span>הסבר מדעי ופדגוגי בעברית לתלמידים:</span>
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {codeExplanation}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ADVANCED ADVISOR CHAT */}
          {activeTab === "advisor-chat" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 h-auto md:h-[600px] text-right">
              
              {/* Right/First Column: Predefined Quick Questions Sidebar */}
              <div className="w-full md:w-80 flex flex-col border border-slate-200/80 rounded-2xl bg-slate-50/50 p-5 shrink-0 font-sans text-right justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 space-x-reverse mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">שאלות מובנות להשראה</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3 border-b border-slate-100 pb-2">שאלות משתמשים לפי קהל יעד</h3>
                  
                  {/* Selector Tabs for Quick Roles */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold mb-3 border border-slate-200/50">
                    {[
                      { id: "teacher", label: "מורים" },
                      { id: "student", label: "תלמידים" },
                      { id: "admin", label: "מנהלים" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedSuggestionRole(tab.id as any)}
                        className={`py-1.5 rounded-lg text-center transition-all cursor-pointer text-[11px] ${
                          selectedSuggestionRole === tab.id 
                            ? "bg-white text-blue-600 shadow-sm font-bold border border-slate-100" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Predefined Questions Scroll Container */}
                  <div className="space-y-2 max-h-[220px] md:max-h-[380px] overflow-y-auto pr-1">
                    {PREDEFINED_QUESTIONS_DATA.find(q => q.role === selectedSuggestionRole)?.questions.map((qText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUserInput(qText);
                        }}
                        onDoubleClick={() => {
                          submitChatMessage(qText);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 text-slate-700 text-[11px] font-medium text-right transition cursor-pointer leading-relaxed flex items-start space-x-2 space-x-reverse group shadow-sm hover:shadow-md"
                        title="קליק יחיד למילוי תיבת ההקלדה, דאבל-קליק לשליחה ישירה"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                        <span className="group-hover:text-blue-950">{qText}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 text-[10px] text-slate-400 leading-relaxed text-right">
                  <span className="font-bold text-slate-500 block mb-0.5">💡 כיצד להשתמש בשאלות?</span>
                  לחיצה קלה תמלא את שורת ההקלדה ותאפשר לכם לערוך אותה. לחיצה כפולה (Double Click) תשלח את השאלה ישירות ליועץ.
                </div>
              </div>

              {/* Left/Second Column: Chat Window */}
              <div className="flex-1 flex flex-col h-[480px] md:h-full">
                
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                      תקשורת אינטראקטיבית עם היועץ
                    </span>
                    <h2 className="text-base font-extrabold text-slate-800 mt-1.5">Advisor-PhysicAI</h2>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>יועץ AI פעיל</span>
                  </div>
                </div>

                {/* Chat Message Thread */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2 my-2 bg-slate-50/40 rounded-xl border border-slate-100">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white rounded-br-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                        }`}
                      >
                        {/* Message metadata */}
                        <span className={`block text-[9px] mb-1 font-bold ${msg.role === "user" ? "text-slate-400" : "text-blue-600"}`}>
                          {msg.role === "user" ? "אני (מורה/תלמיד/מנהל)" : "יועץ פיזיק-AI פדגוגי"}
                        </span>
                        
                        {/* Message text formatted using helper logic if needed */}
                        <div className="whitespace-pre-line leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isSendingMessage && (
                    <div className="flex justify-end">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs shadow-sm flex items-center space-x-2 space-x-reverse">
                        <div className="flex space-x-1 space-x-reverse">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                        <span className="text-slate-500 font-medium text-[11px]">היועץ מגבש תשובה פדגוגית...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Form Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="הקלידו כאן את שאלתכם, או בחרו שאלה מוכנה מהרשימה מימין..."
                    className="flex-1 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim() || isSendingMessage}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span>שלח שאלתך</span>
                  </button>
                </form>

              </div>

            </div>
          )}

          {/* TAB 5: USER FEEDBACK & EVALUATION SURVEYS */}
          {activeTab === "feedback" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans">
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                      מרכז הערכה ומשוב פדגוגי
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mt-2">שאלוני משוב והערכת שילוב ה-AI בפיזיקה</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    שאלוני עמדות והערכה למורים, תלמידים והנהלה במרכז שוורץ-רייסמן לצורך שיפור וייעול הסילבוס.
                  </p>
                </div>
                
                {/* View/Fill mode switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1 self-stretch md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackViewMode("fill");
                      setSubmittedSuccess(false);
                    }}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${feedbackViewMode === "fill" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>מילוי שאלון חדש</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackViewMode("results")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${feedbackViewMode === "results" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>תוצאות וסטטיסטיקה ({feedbacks.length})</span>
                  </button>
                </div>
              </div>

              {feedbackViewMode === "fill" ? (
                /* FILL MODE */
                <div>
                  {submittedSuccess ? (
                    /* SUCCESS STATE */
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto font-sans">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">המשוב נשלח בהצלחה!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        תודה רבה לך על השיתוף! תשובותיך נשמרו בצורה מאובטחת במערכת ונוספו ללוח המחוונים הסטטיסטי בזמן אמת. המסקנות ישמשו לשיפור מתמיד של תוכנית הלימודים במרכז.
                      </p>
                      <div className="flex gap-3 pt-4 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedSuccess(false);
                            // Reset forms
                            setTeacherForm({ frequency: "", primaryBenefit: "", challenge: "", rating: 5, comments: "", name: "" });
                            setStudentForm({ frequency: "", preferredTool: "", helpedUnderstanding: "", rating: 5, comments: "", name: "" });
                            setAdminForm({ impact: "", strategicBenefit: "", resourcesAllocated: "", rating: 5, comments: "", name: "" });
                          }}
                          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                        >
                          מילוי שאלון נוסף
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackViewMode("results")}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-blue-100 cursor-pointer"
                        >
                          מעבר לתוצאות חישות
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* SURVEY FORM */
                    <div className="space-y-6 font-sans">
                      {/* Role selection for survey */}
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-right">
                        <label className="block text-xs font-bold text-slate-500 mb-2.5">
                          אנא בחרו את סוג השאלון המיועד:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {[
                            { id: "teacher", label: "שאלון מורים", icon: BookOpen, desc: "עבור צוותי הוראה ופיתוח" },
                            { id: "student", label: "שאלון תלמידים", icon: User, desc: "עבור כיתות י'-י\"ב" },
                            { id: "admin", label: "שאלון מנהלים", icon: Compass, desc: "עבור הנהלה ורכזים" }
                          ].map((role) => {
                            const IconComp = role.icon;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => setFeedbackRole(role.id as any)}
                                className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                                  feedbackRole === role.id 
                                    ? "bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm" 
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xs font-bold">{role.label}</span>
                                  <IconComp className={`w-4 h-4 ${feedbackRole === role.id ? "text-blue-600" : "text-slate-400"}`} />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{role.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Survey Questions per Role */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleFormSubmit();
                      }} className="space-y-5 text-right">
                        
                        {/* TEACHER FORM */}
                        {feedbackRole === "teacher" && (
                          <div className="space-y-5">
                            {/* Question 1 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                1. מה תדירות השימוש ביישומי בינה מלאכותית (ChatGPT, Claude וכו') בהוראת פיזיקה במרכז?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                {["יומיומית", "פעם-פעמיים בשבוע", "פעם בחודש", "כמעט אף פעם לא"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setTeacherForm({ ...teacherForm, frequency: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      teacherForm.frequency === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 2 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                2. באיזה אופן כלי ה-AI מסייע לך בצורה המשמעותית ביותר כיום?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "כתיבת והסברת קוד פייתון למעבדות",
                                  "פיתוח מערכי שיעור ומעבדות מותאמים אישית",
                                  "פתרון שאלות פיזיקליות מורכבות",
                                  "ניסוח דגמי פתרון ובקרת תוצאות דוחות"
                                ].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setTeacherForm({ ...teacherForm, primaryBenefit: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      teacherForm.primaryBenefit === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 3 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                3. מה החשש או האתגר המרכזי בשילוב בינה מלאכותית בכיתות הפיזיקה?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "העתקות וחוסר חשיבה עצמאית של תלמידים",
                                  "קושי טכני של תלמידים עם קוד (Python / Colab)",
                                  "חוסר זמן בתוכנית הלימודים הצפופה",
                                  "מחסור במדריכים, סילבוסים ומערכים מובנים"
                                ].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setTeacherForm({ ...teacherForm, challenge: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      teacherForm.challenge === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Rating (1-5 Stars) */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                4. רמת שביעות הרצון הכללית ממהלך שילוב מיומנויות ה-AI במרכז:
                              </label>
                              <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-w-xs justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setTeacherForm({ ...teacherForm, rating: star })}
                                    className="p-1 cursor-pointer transition transform hover:scale-110"
                                  >
                                    <Sparkles 
                                      className={`w-6 h-6 ${
                                        teacherForm.rating >= star 
                                          ? "text-amber-500 fill-amber-400" 
                                          : "text-slate-300"
                                      }`} 
                                    />
                                  </button>
                                ))}
                                <span className="text-xs font-bold text-slate-600 mr-2 ml-2">
                                  {teacherForm.rating} מתוך 5
                                </span>
                              </div>
                            </div>

                            {/* Open Text Comment */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                5. הערות פדגוגיות פתוחות והצעות לשיפור (טקסט חופשי):
                              </label>
                              <textarea
                                value={teacherForm.comments}
                                onChange={(e) => setTeacherForm({ ...teacherForm, comments: e.target.value })}
                                placeholder="למשל: סדנאות נוספות למורים, סנכרון עם קמפוס IL..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 h-24"
                              />
                            </div>

                            {/* Name Input */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                שם מלא ותפקיד (אופציונלי):
                              </label>
                              <input
                                type="text"
                                value={teacherForm.name}
                                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                                placeholder="למשל: דרור ל., מורה לפיזיקה (חולון)"
                                className="w-full md:w-2/3 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* STUDENT FORM */}
                        {feedbackRole === "student" && (
                          <div className="space-y-5">
                            {/* Question 1 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                1. באיזו תדירות אתה משתמש בכלי בינה מלאכותית לביצוע ניתוחי מעבדה או פתרון בעיות בפיזיקה?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                {["בכל שיעור/מעבדה", "לפעמים (לצורך דוחות חקר)", "רק כשאני נתקע בקוד", "כמעט ולא"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setStudentForm({ ...studentForm, frequency: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      studentForm.frequency === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 2 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                2. איזה כלי בינה מלאכותית (AI) הוא המועדף עליך ללמידת פיזיקה וקידוד במרכז?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "Claude (לכתיבת קוד ופרומפטים)",
                                  "ChatGPT (להסברי רקע פיזיקליים)",
                                  "Gemini (לאינטגרציה וחיפוש)",
                                  "Google Colab (להרצת פייתון ישירה)"
                                ].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setStudentForm({ ...studentForm, preferredTool: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      studentForm.preferredTool === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 3 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                3. האם אתה מרגיש ששילוב ה-AI שיפר את הבנתך בפיזיקה חקרנית ואת הציון שלך?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "כן, באופן משמעותי מאוד",
                                  "כן, בצורה מסוימת",
                                  "לא השפיע על הבנתי",
                                  "זה רק מבלבל אותי"
                                ].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setStudentForm({ ...studentForm, helpedUnderstanding: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      studentForm.helpedUnderstanding === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Rating (1-5 Stars) */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                4. דרג את מידת הביטחון שלך בכתיבה והבנה של קוד Python כיום:
                              </label>
                              <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-w-xs justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setStudentForm({ ...studentForm, rating: star })}
                                    className="p-1 cursor-pointer transition transform hover:scale-110"
                                  >
                                    <Sparkles 
                                      className={`w-6 h-6 ${
                                        studentForm.rating >= star 
                                          ? "text-amber-500 fill-amber-400" 
                                          : "text-slate-300"
                                      }`} 
                                    />
                                  </button>
                                ))}
                                <span className="text-xs font-bold text-slate-600 mr-2 ml-2">
                                  {studentForm.rating} מתוך 5
                                </span>
                              </div>
                            </div>

                            {/* Open Text Comment */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                5. מה הכי אהבת בשילוב ה-AI בשיעורי הפיזיקה, או מה היה לך קשה במיוחד? (טקסט חופשי):
                              </label>
                              <textarea
                                value={studentForm.comments}
                                onChange={(e) => setStudentForm({ ...studentForm, comments: e.target.value })}
                                placeholder="למשל: נהניתי מאוד מכתיבת ההדמיות בתלת מימד... קשה להתמודד עם שגיאות קוד כשהקוד לא רץ..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 h-24"
                              />
                            </div>

                            {/* Name Input */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                שם מלא וכיתה (אופציונלי):
                              </label>
                              <input
                                type="text"
                                value={studentForm.name}
                                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                placeholder='למשל: תמר ו., כיתה י"א (שוורץ רייסמן)'
                                className="w-full md:w-2/3 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* ADMIN FORM */}
                        {feedbackRole === "admin" && (
                          <div className="space-y-5">
                            {/* Question 1 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                1. כיצד אתה מעריך את ההשפעה המערכתית של שילוב מיומנויות ה-AI במרכז שוורץ-רייסמן?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                {["השפעה מהפכנית ומשפרת למידה", "השפעה חיובית מתונה", "השפעה מועטה כרגע", "מוקדם מדי להעריך"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAdminForm({ ...adminForm, impact: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      adminForm.impact === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 2 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                2. מהו היתרון האסטרטגי המרכזי של שילוב ה-AI עבור התלמידים והמרכז?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "הכנת התלמידים לאקדמיה ותעשייה",
                                  "מיתוג המרכז כמוביל פדגוגי חדשני ומדעי",
                                  "העצמת מורים ופיתוח פדגוגי מקצועי",
                                  "העלאת הישגי הבגרות במעבדות חקר"
                                ].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAdminForm({ ...adminForm, strategicBenefit: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      adminForm.strategicBenefit === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Question 3 */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                3. האם לדעתך מוקצים כיום מספיק משאבים (שעות מפתחים, הדרכות, השתלמויות, חומרים) למהלך זה?
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                {["מספיק בהחלט", "נדרש תגבור קל", "חסרים משאבים משמעותיים", "חסר לחלוטין"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAdminForm({ ...adminForm, resourcesAllocated: opt })}
                                    className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer font-medium ${
                                      adminForm.resourcesAllocated === opt
                                        ? "bg-blue-50/70 border-blue-400 text-blue-700 font-semibold"
                                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Rating (1-5 Stars) */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                4. מה מידת המוכנות של המרכז להרחיב את שילוב ה-AI למקצועות מדעיים נוספים (כימיה, ביולוגיה):
                              </label>
                              <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-w-xs justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setAdminForm({ ...adminForm, rating: star })}
                                    className="p-1 cursor-pointer transition transform hover:scale-110"
                                  >
                                    <Sparkles 
                                      className={`w-6 h-6 ${
                                        adminForm.rating >= star 
                                          ? "text-amber-500 fill-amber-400" 
                                          : "text-slate-300"
                                      }`} 
                                    />
                                  </button>
                                ))}
                                <span className="text-xs font-bold text-slate-600 mr-2 ml-2">
                                  {adminForm.rating} מתוך 5
                                </span>
                              </div>
                            </div>

                            {/* Open Text Comment */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                5. הערות אסטרטגיות, חזון ארוך טווח ומסקנות מערכתיות (טקסט חופשי):
                              </label>
                              <textarea
                                value={adminForm.comments}
                                onChange={(e) => setAdminForm({ ...adminForm, comments: e.target.value })}
                                placeholder="למשל: נרצה לפרסם מאמר על המהלך, להדריך את מפקחי משרד החינוך, לפתח סמינר משותף..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 h-24"
                              />
                            </div>

                            {/* Name Input */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                שם מלא ותפקיד הנהלה (אופציונלי):
                              </label>
                              <input
                                type="text"
                                value={adminForm.name}
                                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                                placeholder="למשל: שלמה א., רכז ארצי / מנהל מרכז מדעי"
                                className="w-full md:w-2/3 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl transition shadow-md shadow-blue-100 flex items-center space-x-2 space-x-reverse cursor-pointer"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>שליחת השאלון ושמירת משוב</span>
                          </button>
                        </div>

                      </form>
                    </div>
                  )}
                </div>
              ) : (
                /* RESULTS / ANALYTICS DASHBOARD MODE */
                <div className="space-y-6">
                  
                  {/* Aggregated Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans text-right">
                    
                    {/* Stat 1: Total feedbacks */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">סה"כ משובים</span>
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-extrabold text-slate-800">{feedbacks.length}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">חוות דעת פעילות במערכת</span>
                      </div>
                    </div>

                    {/* Stat 2: Avg satisfaction */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1 flex-row-reverse">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">שביעות רצון ממוצעת</span>
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-extrabold text-slate-800">
                          {(feedbacks.reduce((acc, f) => acc + f.answers.rating, 0) / feedbacks.length).toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold"> / 5.0 כוכבים</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">מדד הצלחה פדגוגי כללי</span>
                      </div>
                    </div>

                    {/* Stat 3: Distribution of roles */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl col-span-1 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">פילוח משוב לפי סוג משתמש</span>
                      <div className="space-y-2 mt-1">
                        {[
                          { id: "teacher", label: "מורים", color: "bg-blue-500" },
                          { id: "student", label: "תלמידים", color: "bg-green-500" },
                          { id: "admin", label: "מנהלים", color: "bg-purple-500" }
                        ].map((role) => {
                          const count = feedbacks.filter(f => f.role === role.id).length;
                          const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                          return (
                            <div key={role.id} className="text-xs">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                                <span>{role.label} ({count})</span>
                                <span>{pct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className={`${role.color} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Survey Detailed Charts & Analysis section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-sans text-right">
                    
                    {/* Chart Card 1: Teachers & Students Tools and Challenges */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                        כלי ה-AI הפופולריים והשימושיים ביותר בקרב תלמידים
                      </h3>
                      <div className="space-y-3.5">
                        {[
                          { name: "Claude (לכתיבת קוד ופרומפטים)", percentage: 48 },
                          { name: "Google Colab (להרצת פייתון)", percentage: 28 },
                          { name: "ChatGPT (להסברי רקע פיזיקליים)", percentage: 16 },
                          { name: "Gemini (לאינטגרציה וחיפוש)", percentage: 8 }
                        ].map((item, idx) => {
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span className="truncate">{item.name}</span>
                                <span className="text-blue-600 font-bold">{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chart Card 2: Teacher Challenges */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                        האתגר הפדגוגי המרכזי לפי צוות המורים
                      </h3>
                      <div className="space-y-3.5">
                        {[
                          { name: "העתקות וחוסר חשיבה עצמאית של תלמידים", percentage: 42, color: "bg-red-500" },
                          { name: "חוסר זמן בתוכנית הלימודים הצפופה", percentage: 33, color: "bg-amber-500" },
                          { name: "קושי טכני של תלמידים עם קוד (Python / Colab)", percentage: 17, color: "bg-blue-500" },
                          { name: "מחסור במדריכים, סילבוסים ומערכים מובנים", percentage: 8, color: "bg-purple-500" }
                        ].map((item, idx) => {
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span className="truncate">{item.name}</span>
                                <span className="text-slate-600 font-bold">{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Submitted Feed Comments */}
                  <div className="space-y-3 pt-2 font-sans text-right">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-700">
                        פידבקים והערות פתוחות של מורים, תלמידים ומנהלים ({feedbacks.length})
                      </h3>
                      <button 
                        type="button"
                        onClick={() => {
                          if(confirm("האם ברצונך לאפס את המשובים ולחזור לנתוני המקור?")) {
                            localStorage.removeItem("schwartz_reisman_ai_feedback");
                            setFeedbacks(SEED_FEEDBACKS);
                          }
                        }}
                        className="text-[10px] text-slate-400 hover:text-red-500 font-semibold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>איפוס משובים</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feedbacks.map((item) => {
                        const roleMeta = 
                          item.role === "teacher" ? { label: "שאלון מורים", color: "bg-blue-50 text-blue-700 border-blue-100" } :
                          item.role === "student" ? { label: "שאלון תלמידים", color: "bg-green-50 text-green-700 border-green-100" } :
                          { label: "שאלון מנהלים", color: "bg-purple-50 text-purple-700 border-purple-100" };

                        return (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-2xl border transition hover:shadow-md flex flex-col justify-between space-y-3 text-right ${
                              item.isUserSubmitted 
                                ? "bg-amber-50/50 border-amber-200 shadow-sm shadow-amber-50" 
                                : "bg-white border-slate-200/70"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Meta Info */}
                              <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.color}`}>
                                  {roleMeta.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.timestamp}
                                </span>
                              </div>

                              {/* Answers summaries */}
                              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 leading-normal space-y-1 text-right">
                                <p><span className="font-bold text-slate-500">תדירות/השפעה:</span> {item.answers.q1}</p>
                                <p><span className="font-bold text-slate-500">יתרון/כלי מרכזי:</span> {item.answers.q2}</p>
                                <p><span className="font-bold text-slate-500">אתגר/השפעה:</span> {item.answers.q3}</p>
                              </div>

                              {/* Comment block */}
                              {item.answers.comments && (
                                <p className="text-xs text-slate-700 italic leading-relaxed pt-1 text-right">
                                  "{item.answers.comments}"
                                </p>
                              )}
                            </div>

                            {/* Footer block (Rating & Name) */}
                            <div className="border-t border-slate-100/80 pt-2 flex justify-between items-center mt-auto">
                              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">
                                {item.answers.userName || "משתמש אנונימי"}
                              </span>
                              <div className="flex items-center space-x-0.5 space-x-reverse bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                                <span className="text-[10px] font-bold text-amber-700">{item.answers.rating}/5</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </section>

      </main>

      {/* Footer information bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto text-xs text-slate-400 font-medium flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex space-x-4 space-x-reverse">
          <span>תכנית לימודים: Schwartz-Reisman Physics AI Core v2.5</span>
          <span className="text-slate-300">|</span>
          <span>מסונכרן עם סילבוס קמפוס IL ובגרויות משרד החינוך</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span>מרכז פיתוח ומחקר פדגוגי עצמאי</span>
          <div className="flex space-x-1 space-x-reverse">
            <span className="w-4 h-1 bg-blue-600 rounded-full"></span>
            <span className="w-4 h-1 bg-blue-600 rounded-full"></span>
            <span className="w-4 h-1 bg-slate-300 rounded-full"></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
