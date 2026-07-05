import React, { useState, useRef } from 'react';
import { UserLevel, Domain } from '../types';
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  BookOpen, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Check, 
  Info, 
  Settings,
  ArrowRight
} from 'lucide-react';

interface Question {
  id: string;
  topic: 'basics' | 'music' | 'em_waves' | 'tech';
  topicHeb: string;
  difficulty: 'easy' | 'medium' | 'high';
  difficultyHeb: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  simulationTip: string; // Dynamic guides showing how to use the site's simulators
}

// Substantial question bank matching the user's criteria
const DEFAULT_QUESTION_BANK: Question[] = [
  // --- BASICS ---
  {
    id: 'b1',
    topic: 'basics',
    topicHeb: 'יסודות הגלים',
    difficulty: 'easy',
    difficultyHeb: 'קלה',
    question: 'מה קורה למהירות של גל מכני במיתר מתוח כאשר מגדילים את הריסון (Damping) שלו בארגז החול?',
    options: [
      'המהירות קטנה משמעותית כי הריסון בולם את הגל.',
      'המהירות נשארת קבועה, מאחר שהיא תלויה רק בתכונות האלסטיות של התווך (מתיחות וצפיפות המסה).',
      'המהירות גדלה כדי לפצות על אובדן האנרגיה של המעטפת.',
      'הגל הופך לגל עומד באופן מיידי ונעצר לחלוטין במרחב.'
    ],
    correctIdx: 1,
    explanation: 'הריסון (Damping) משפיע על האמפליטודה (עוצמת הגל) לאורך המרחק והזמן, אך אינו משנה את מהירות ההתקדמות של חזית הגל, אשר מוכתבת אך ורק על ידי תכונות התווך (כמו מתיחות המיתר וצפיפותו).',
    simulationTip: '💡 פתחו את סימולטור "1. יסודות הגלים" ➜ בחרו בארגז חול ➜ שנו את מדד הריסון וצפו כיצד האמפליטודה של הגל דועכת לאורך המיתר, אך מהירות ההתקדמות שלו נותרת זהה!'
  },
  {
    id: 'b2',
    topic: 'basics',
    topicHeb: 'יסודות הגלים',
    difficulty: 'medium',
    difficultyHeb: 'בינונית',
    question: 'באמצעות בונה ההרמוניות (Fourier Synthesizer), שילבתם את הרמוניית היסוד f1 ואת ההרמוניה השלישית f3 (שתיהן באמפליטודה חיובית). איזו צורה תקבלו במרכז המיתר?',
    options: [
      'גל שן-מסור בעל עליות חדות וירידות אנכיות.',
      'גל מלבני מקורב (קודקוד פחוס) בעל סימטריית חצי-מחזור אנטי-סימטרית.',
      'גל סינוס מושלם לחלוטין ללא כל שינוי.',
      'גל דמוי פעימה (Beat) שבו העוצמה עולה ויורדת בקצב איטי.'
    ],
    correctIdx: 1,
    explanation: 'לפי תורת פורייה, גל מרובע מורכב מסכום של הרמוניות אי-זוגיות בלבד (f1, f3, f5, ...). הוספת f3 ל-f1 "משטחת" את הגבעה של הסינוס ומקרבת אותה לצורה מלבנית.',
    simulationTip: '💡 פתחו את סימולטור "1. יסודות הגלים" ➜ גללו מטה ל-"בקרת הרמוניות (Fourier Synthesizer)" ➜ העלו את f1 ל-100% ואת f3 ל-40% וראו כיצד הגל הסינוסאידי הופך למרובע מקורב עם קודקוד שטוח!'
  },
  {
    id: 'b3',
    topic: 'basics',
    topicHeb: 'יסודות הגלים',
    difficulty: 'high',
    difficultyHeb: 'גבוהה',
    question: 'בניתוח תדרים Fourier FFT, כאשר אנו יוצרים פולס גל קצר במיוחד (חבילת גלים קצרה בזמן), מה קורה לרוחב הספקטרום שלו בתחום התדר?',
    options: [
      'הספקטרום נהיה צר וממוקד מאוד סביב תדר בודד.',
      'הספקטרום מתרחב ומכיל מגוון עצום של תדרים (קשר אי-וודאות של פורייה: Δt * Δf ≥ Const).',
      'התדרים נעלמים לחלוטין וה-FFT יראה אפס בכל התדרים.',
      'מתקבלת תדר הרמוני יחיד אך האמפליטודה שלו שואפת לאינסוף.'
    ],
    correctIdx: 1,
    explanation: 'זהו ביטוי ישיר לקשר אי-הוודאות של פורייה: ככל שחבילת הגלים ממוקדת וקצרה יותר בזמן (Δt קטן), נדרש מגוון רחב יותר של גלים סינוסאידיים בתדרים שונים כדי ליצור אותה באמצעות התאבכות, ולכן רוחב הפס בתדר (Δf) מתרחב.',
    simulationTip: '💡 פתחו את סימולטור "1. יסודות הגלים" ➜ בחרו במצב "פעימות וחבילת גלים" ➜ צפו בגרף ה-FFT וראו כיצד חבילת גלים צרה יוצרת פיזור ספקטרלי רחב, בניגוד לגל רציף וארוך המיוצג כפיק יחיד וצר!'
  },

  // --- MUSIC ---
  {
    id: 'm1',
    topic: 'music',
    topicHeb: 'מוזיקה וצלילים',
    difficulty: 'easy',
    difficultyHeb: 'קלה',
    question: 'מהו ההבדל הפיזיקלי העיקרי המתרחש במיתר בעת הפקת צליל בכינור (באמצעות קשת) לעומת פריטה בגיטרה?',
    options: [
      'בכינור נוצר גל אורך ואילו בגיטרה נוצר גל רוחב.',
      'בכינור הקשת מפעילה מנגנון אחיזה והחלקה (Stick-Slip) המייצר גל דמוי שן-מסור (Sawtooth), בעוד פריטה יוצרת גל משולש הדועך בחופשיות.',
      'בגיטרה מהירות הגל במיתר משתנה כל הזמן, ובכינור היא קבועה לחלוטין.',
      'בכינור אין נקודות צומת בקצוות המיתר ואילו בגיטרה הקצוות מקובעים.'
    ],
    correctIdx: 1,
    explanation: 'הקשת בכינור מצופה שרף דביק אשר תופס את המיתר ומושך אותו הצידה (Stick) עד שהכוח האלסטי מתגבר עליו והמיתר מחליק חזרה במהירות (Slip). מחזור זה מפיק תנודה מתמשכת בעלת גל שן-מסור עשיר בהרמוניות בהירות.',
    simulationTip: '💡 כנסו לסימולטור "2. מוזיקה וצלילים" ➜ עברו ללשונית "מעבדה פיזיקלית: פריטת מיתר" ➜ החליפו בין מצב "קשת (Bow)" למצב "פריטה (Pluck)" וראו את הפינה הנעה במיתר (פינת הלמהולץ) ואת צורת הגל האופיינית!'
  },
  {
    id: 'm2',
    topic: 'music',
    topicHeb: 'מוזיקה וצלילים',
    difficulty: 'medium',
    difficultyHeb: 'בינונית',
    question: 'אם ננגן בחלילית (Recorder) ונחסום 5 חורים לעומת חסימת חור אחד בלבד, כיצד הדבר ישפיע על הצליל הנשמע?',
    options: [
      'הצליל יהיה גבוה יותר (תדר גבוה יותר) כי אורך הגל האפקטיבי קטן.',
      'הצליל יהיה נמוך יותר (תדר נמוך יותר) כי אנו מאריכים את עמוד האוויר הרוטט בתוך החלילית, מה שמגדיל את אורך גל היסוד.',
      'העוצמה של הצליל תפחת לאפס מאחר והאוויר לא יכול לצאת.',
      'החלילית תתחיל להפיק גלים אלקטרומגנטיים במקום גלי קול.'
    ],
    correctIdx: 1,
    explanation: 'חסימת חורים נוספים בחלילית מונעת מהאוויר לצאת דרך החורים העליונים ומאלצת את הגל העומד להתפשט לכל אורך הצינור עד לחורים התחתונים. עמוד האוויר הרוטט מתארך, אורך הגל של גל היסוד גדל, ולכן התדר הנפלט (f = v/λ) קטן (צליל עמוק ונמוך יותר).',
    simulationTip: '💡 כנסו לסימולטור "2. מוזיקה וצלילים" ➜ בחרו בלשונית "כלי נשיפה (חלילית/קלרינט/חצוצרה)" ➜ לחצו על החורים השונים בחלילית והקשיבו לשינוי הטון, תוך מעקב אחר אורך הגל המצויר בתוך הצינור!'
  },
  {
    id: 'm3',
    topic: 'music',
    topicHeb: 'מוזיקה וצלילים',
    difficulty: 'high',
    difficultyHeb: 'גבוהה',
    question: 'כיצד משפיעה מתיחות המיתר (T) וצפיפות המסה שלו (μ) על תדרי התהודה שלו, בהנחה שאורכו קבוע?',
    options: [
      'הגדלת המתיחות (T) והקטנת הצפיפות (μ) מעלות את מהירות הגל v, ובכך מעלות את כל תדרי ההרמוניות f_n = n * v / 2L.',
      'הקטנת המתיחות והגדלת הצפיפות מקצרות את המיתר פיזית.',
      'מהירות הגל אינה משתנה, אך אורך הגל משתנה ביחס הפוך למתיחות.',
      'הגדלת הצפיפות מעלה את התדר כיוון שיש יותר חומר שרוטט בו-זמנית.'
    ],
    correctIdx: 0,
    explanation: 'לפי נוסחת טיילור למהירות גל במיתר v = √(T/μ). תדר היסוד נתון על ידי f₁ = v / 2L = √(T/μ) / 2L. מכאן שהגדלת המתיחות T או הפחתת צפיפות המסה μ (מיתר דק יותר) מגדילות את מהירות הגל v ומעלות את תדר התנודה.',
    simulationTip: '💡 כנסו לסימולטור "2. מוזיקה וצלילים" ➜ עברו ל-"מעבדה פיזיקלית: פריטת מיתר" ➜ שחקו עם מדדי המתיחות (Tension) וצפיפות המסה (Density) וצפו בשינוי התדר המחושב בזמן אמת בגרף!'
  },

  // --- EM WAVES ---
  {
    id: 'e1',
    topic: 'em_waves',
    topicHeb: 'גלים אלקטרומגנטיים',
    difficulty: 'easy',
    difficultyHeb: 'קלה',
    question: 'מדוע השמיים נראים כחולים בצהריים ואדומים/כתומים בזמן השקיעה?',
    options: [
      'בשקיעה השמש מפיקה פחות אור כחול באופן טבעי.',
      'פיזור ריילי (Rayleigh Scattering) פועל חזק יותר על אור בעל אורך גל קצר (כחול). בצהריים הוא מתפזר לכל עבר בשמיים; בשקיעה האור עובר מרחק עצום באטמוספירה והכחול מתפזר כולו הצידה, כך שרק האדום/כתום שורד ומגיע לעיננו.',
      'האטמוספירה בולעת את הצבע הכחול לחלוטין והופכת אותו לחום וחום נפלט כשקיעה.',
      'בצהריים מהירות האור הכחול גדולה יותר, ובשקיעה האור האדום מאיץ ועובר אותו.'
    ],
    correctIdx: 1,
    explanation: 'חלקיקי האטמוספירה הקטנים מפזרים את גלי האור ביחס הפוך לחזקה הרביעית של אורך הגל (I ∝ 1/λ⁴). לכן האור הכחול (אורך גל קצר) מתפזר פי 10 יותר מאשר האור האדום. בשקיעה, מסלול קרני השמש באטמוספירה ארוך מאוד, רוב האור הכחול מתפזר לחלוטין הצידה ואינו מגיע לצופה, מה שמותיר את הגוונים האדומים הארוכים.',
    simulationTip: '💡 פתחו את סימולטור "3. גלים אלקטרומגנטיים" ➜ עברו לכרטיסיית "פיזור ריילי (Scattering)" ➜ לחצו על לחצן השקיעה וצפו באנימציית גלי האור המתפזרים ובגרף פיזור העוצמה לפי אורך הגל!'
  },
  {
    id: 'e2',
    topic: 'em_waves',
    topicHeb: 'גלים אלקטרומגנטיים',
    difficulty: 'medium',
    difficultyHeb: 'בינונית',
    question: 'כאשר אור עובר מריק (n=1) לתוך זכוכית (n=1.5), מה קורה לתדירותו (f), מהירותו (v) ואורך הגל שלו (λ)?',
    options: [
      'התדירות קטנה פי 1.5, ואילו המהירות ואורך הגל נשארים ללא שינוי.',
      'התדירות נשארת קבועה לחלוטין, אך המהירות ואורך הגל קטנים שניהם פי 1.5.',
      'כל שלושת המדדים גדלים פי 1.5 בשל לחץ אופטי.',
      'אורך הגל גדל פי 1.5, והמהירות קטנה פי 1.5 כדי שהתדר ישאר קבוע.'
    ],
    correctIdx: 1,
    explanation: 'התדר (f) של גל נקבע אך ורק על ידי מקור האור ואינו משתנה במעבר בין תווכים. מהירות הגל בזכוכית קטנה לפי הגדרת מקדם השבירה v = c/n (כלומר קטנה פי 1.5). מכיוון ש-v = λ * f, אורך הגל λ חייב להתכווץ בהתאם פי 1.5 כדי לשמור על שוויון.',
    simulationTip: '💡 פתחו את סימולטור "3. גלים אלקטרומגנטיים" ➜ עברו לכרטיסיית "חוק סנל ושבירת אור" ➜ כוונו את מקדם השבירה של התווך השני ל-1.5 וצפו בהתכווצות המרחק בין חזיתות הגל (אורך הגל) בתוך החומר השקוף!'
  },
  {
    id: 'e3',
    topic: 'em_waves',
    topicHeb: 'גלים אלקטרומגנטיים',
    difficulty: 'high',
    difficultyHeb: 'גבוהה',
    question: 'מהו התנאי הפיזיקלי ההכרחי להתרחשות תופעת "החזרה גמורה" (Total Internal Reflection)?',
    options: [
      'האור חייב לעבור מתווך בעל מקדם שבירה נמוך לתווך בעל מקדם שבירה גבוה, בכל זווית שהיא.',
      'האור חייב לעבור מתווך צפוף אופטית (n1 גבוה) לתווך פחות צפוף (n2 נמוך), וזווית הפגיעה חייבת להיות גדולה מהזווית הקריטית: θ_critical = arcsin(n2 / n1).',
      'על האור לפגוע בדיוק בניצב למשטח (זווית פגיעה של 0 מעלות).',
      'מקדם השבירה של התווך השני חייב להיות שווה בדיוק לאפס.'
    ],
    correctIdx: 1,
    explanation: 'כאשר אור נע לחומר פחות צפוף (כמו ממים לאוויר), קרן האור נשברת הרחק מהאנך. בזווית פגיעה מסוימת (הזווית הקריטית), זווית השבירה מגיעה ל-90 מעלות ומתלכדת עם המשטח. עבור כל זווית גדולה מזו, הקרן אינה יכולה לצאת כלל ומוחזרת במלואה לתוך התווך הראשון.',
    simulationTip: '💡 פתחו את סימולטור "3. גלים אלקטרומגנטיים" ➜ עברו ל-"חוק סנל ושבירת אור" ➜ שחקו עם זווית הפגיעה כאשר n1=1.5 ו-n2=1.0, וצפו בנקודת המעבר שבה הקרן השבורה נעלמת ומתקבלת החזרה מלאה!'
  },

  // --- TECH ---
  {
    id: 't1',
    topic: 'tech',
    topicHeb: 'טכנולוגיות וגלים',
    difficulty: 'easy',
    difficultyHeb: 'קלה',
    question: 'מדוע מורחים ג\'ל אקוסטי מיוחד על עור הבטן של נשים בהריון לפני בדיקת אולטרסאונד?',
    options: [
      'כדי לקרר את המכשיר ולמנוע כוויות מהמזעור האלקטרוני.',
      'הג\'ל מהווה חומר להתאמת עכבות (Impedance Matching) המונע החזרה מוקדמת של 99.9% מגלי הקול במפגש שבין מתמר האולטרסאונד לאוויר שעל העור.',
      'כדי לחטא את העור ולמנוע זיהומים מהחיישן.',
      'הג\'ל משנה את תדירות גל הקול והופך אותה למוזיקה מרגיעה עבור העובר.'
    ],
    correctIdx: 1,
    explanation: 'ללא ג\'ל, ישנו מרווח אוויר קטנטן בין המתמר לעור. מכיוון שהפרש העכבה האקוסטית (Acoustic Impedance - Z) בין האוויר לרקמות הגוף הוא עצום, כמעט כל אנרגיית גלי הקול תוחזר מיידית בנקודת החיבור והגל לא יחדור לגוף. הג\'ל בעל עכבה קרובה לרקמות הגוף ומבטיח מעבר חלק של הגלים.',
    simulationTip: '💡 פתחו את סימולטור "4. טכנולוגיות גלים" ➜ בחרו ב-"אולטרסאונד רפואי" ➜ קראו את ההסבר הפיזיקלי ועקבו אחר פענוח ההד והחשיבות של מעבר הגל האקוסטי ללא חסמי עכבה אקוסטית!'
  },
  {
    id: 't2',
    topic: 'tech',
    topicHeb: 'טכנולוגיות וגלים',
    difficulty: 'medium',
    difficultyHeb: 'בינונית',
    question: 'כאשר מבצעים דימות רנטגן (X-Ray), מהי ההשפעה של כיוונון מתח האנודה (Voltage - kV) לעומת זרם השפופרת (Current - mA)?',
    options: [
      'המתח קובע את צבע האור הנפלט והזרם קובע את טמפרטורת החדר.',
      'המתח (kV) קובע את האנרגיה וחדירות הפוטונים (קובע את הניגודיות והחדירה לרקמות), בעוד הזרם (mA) קובע את כמות הפוטונים הנפלטת (בהירות ואיכות החשיפה).',
      'הזרם חודר את העצמות והמתח חודר את השרירים בלבד.',
      'אין הבדל ביניהם, שניהם משפיעים אך ורק על מהירות התפשטות הקרן בחלל.'
    ],
    correctIdx: 1,
    explanation: 'מתח האנודה (kV) מעניק לאלקטרונים אנרגיה קינטית גבוהה יותר, וכך פוטוני הרנטגן המופקים הם בעלי אורך גל קצר ואנרגטי יותר (חדירות גבוהה יותר). זרם השפופרת (mA) קובע את מספר האלקטרונים המופקים, כלומר את שטף פוטוני הרנטגן, המשפיע על בהירות ויחס האות לרעש בתמונה.',
    simulationTip: '💡 פתחו את סימולטור "4. טכנולוגיות גלים" ➜ עברו ל-"מצלמה תרמית ורנטגן" ➜ בחרו בדימות רנטגן ➜ שנו את הסליידרים של מתח (kV) וזרם (mA) וראו כיצד מתח נמוך או גבוה מדי פוגע באיכות החשיפה של התמונה!'
  },
  {
    id: 't3',
    topic: 'tech',
    topicHeb: 'טכנולוגיות וגלים',
    difficulty: 'high',
    difficultyHeb: 'גבוהה',
    question: 'בסימולציית המיקרוגל הפיזיקלית, כיצד משפיע פולס קצר במיוחד (חבילת גלים צרה של 2 ms) על רוחב הפס הספקטרלי של המגנטרון?',
    options: [
      'הוא מייצר גל עומד מושלם בתדר יחיד וללא כל סטיית רוחב פס.',
      'פולס קצר בזמן גורם להתרחבות ספקטרלית משמעותית (Δf רחב) סביב תדר היסוד, מה שיוצר שינויי פאזה מהירים ופיזור אנרגטי רחב.',
      'הקרינה נפסקת לחלוטין מכיוון ש-2 מילישניות אינן מספיקות לעירור מולקולות מים.',
      'התדר הופך לשלילי בהתאם למשוואות מקסוול.'
    ],
    correctIdx: 1,
    explanation: 'פעימה אלקטרומגנטית קצרה בזמן מיוצגת על ידי חבילת גלים בעלת מעטפת גאוסיאנית צרה. לפי משפט פורייה, ככל שמשך הזמן (Δt) מתקצר, רוחב התדרים הדרוש לייצוגו (Δf) מתרחב משמעותית, מה שמכתיב פיזור תדרים רחב יותר סביב תדר המגנטרון.',
    simulationTip: '💡 פתחו את סימולטור "4. טכנולוגיות גלים" ➜ בחרו בלשונית "תנור מיקרוגל" ➜ שנו את המצב ל-"חבילת גלים (Wave Packet)" וגררו את סליידר משך הפולס לערך מינימלי. צפו בחישוב רוחב הפס המשתנה ישירות על המסך!'
  }
];

export default function SelfPracticeQuiz({ level }: { level: UserLevel }) {
  // Navigation and mode states
  const [step, setStep] = useState<'setup' | 'playing' | 'summary'>('setup');
  
  // Custom quiz criterion states (Requirement 1 & 2)
  const [selectedTopics, setSelectedTopics] = useState<Record<string, boolean>>({
    basics: true,
    music: true,
    em_waves: true,
    tech: true
  });
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'high'>('medium');

  // Quiz active states
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerChecked, setAnswerChecked] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number>(0);
  
  // Custom uploaded/created questions (Requirement 2)
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [customInputText, setCustomInputText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isUsingCustom, setIsUsingCustom] = useState<boolean>(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  // Build Quiz based on criteria or loaded custom questions
  const startQuiz = () => {
    let sourcePool = isUsingCustom && customQuestions.length > 0 
      ? customQuestions 
      : DEFAULT_QUESTION_BANK;

    // Filter by topics
    let filtered = sourcePool.filter(q => selectedTopics[q.topic]);

    // If not using custom questions, also filter by difficulty
    if (!isUsingCustom) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    // In case no questions matched criteria, fall back to matching topics or any
    if (filtered.length === 0) {
      filtered = sourcePool.filter(q => selectedTopics[q.topic]);
    }
    if (filtered.length === 0) {
      filtered = [...sourcePool];
    }

    // Shuffle and pick requested amount
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const finalSelection = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    setActiveQuestions(finalSelection);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setAnswerChecked(false);
    setUserScore(0);
    setStep('playing');
  };

  const handleAnswerSelect = (idx: number) => {
    if (answerChecked) return;
    setSelectedAnswer(idx);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || answerChecked) return;
    const currentQ = activeQuestions[currentQuestionIdx];
    if (selectedAnswer === currentQ.correctIdx) {
      setUserScore(prev => prev + 1);
    }
    setAnswerChecked(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerChecked(false);
    } else {
      setStep('summary');
    }
  };

  // Custom Quiz Parser & Adapter (Requirement 2)
  const parseAndAddQuiz = (text: string) => {
    try {
      setUploadError('');
      let parsed: any;
      
      // Try parsing as JSON first
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback: Parse simple text-based custom format
        // Topic: basics | music | em_waves | tech
        // Question: [text]
        // Options: A) [t] B) [t] ...
        // Correct: 0
        // Explanation: [t]
        parsed = parseTextFormat(text);
      }

      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      // Validate parsed items
      const validated: Question[] = [];
      parsed.forEach((item: any, i: number) => {
        if (!item.question || !Array.isArray(item.options) || item.options.length < 2) {
          throw new Error(`שאלה מספר ${i + 1} לא תקינה. וודאו שיש לה נוסח ואפשרויות בחירה.`);
        }
        
        const topicVal = item.topic && ['basics', 'music', 'em_waves', 'tech'].includes(item.topic) 
          ? item.topic 
          : 'basics';

        const diffVal = item.difficulty && ['easy', 'medium', 'high'].includes(item.difficulty)
          ? item.difficulty
          : 'medium';

        validated.push({
          id: `custom_${Date.now()}_${i}`,
          topic: topicVal,
          topicHeb: topicVal === 'basics' ? 'יסודות הגלים' : topicVal === 'music' ? 'מוזיקה וצלילים' : topicVal === 'em_waves' ? 'גלים אלקטרומגנטיים' : 'טכנולוגיות וגלים',
          difficulty: diffVal,
          difficultyHeb: diffVal === 'easy' ? 'קלה' : diffVal === 'medium' ? 'בינונית' : 'גבוהה',
          question: item.question,
          options: item.options,
          correctIdx: typeof item.correctIdx === 'number' ? item.correctIdx : 0,
          explanation: item.explanation || 'לא סופק הסבר נוסף לשאלה זו.',
          simulationTip: item.simulationTip || `💡 טיפ למידה מותאם: מומלץ להיעזר במחלקות וסימולטורים של "${topicVal === 'basics' ? '1. יסודות הגלים' : topicVal === 'music' ? '2. מוזיקה וצלילים' : topicVal === 'em_waves' ? '3. גלים אלקטרומגנטיים' : '4. טכנולוגיות גלים'}" באתר כדי לאמת את הפיזיקה!`
        });
      });

      if (validated.length === 0) {
        throw new Error('לא נמצאו שאלות תקינות בקובץ.');
      }

      setCustomQuestions(validated);
      setIsUsingCustom(true);
      setQuestionCount(validated.length);
      // Auto enable topics from custom questions
      const topicsInCustom = { basics: false, music: false, em_waves: false, tech: false };
      validated.forEach(q => {
        topicsInCustom[q.topic] = true;
      });
      setSelectedTopics(topicsInCustom);

      alert(`🎉 השאלון נטען בהצלחה! זוהו ${validated.length} שאלות מותאמות אישית. האתר יצר עבורכם רצף למידה מונחה.`);
    } catch (err: any) {
      setUploadError(err.message || 'שגיאה בפענוח השאלון. ודאו שהפורמט תקין.');
    }
  };

  // Basic regex text format parser for user friendliness
  const parseTextFormat = (text: string): any[] => {
    const questions: any[] = [];
    // Split by double newlines or question markers
    const blocks = text.split(/\n(?=(?:[שש]אלה|Question|Q):)/i);
    
    blocks.forEach((block) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 3) return;

      let question = '';
      const options: string[] = [];
      let correctIdx = 0;
      let explanation = '';
      let topic = 'basics';

      lines.forEach((line) => {
        if (/^(?:שאלות|שאלה|Question|Q):/i.test(line)) {
          question = line.replace(/^(?:שאלות|שאלה|Question|Q):\s*/i, '');
        } else if (/^[A-D]\)\s*/i.test(line)) {
          options.push(line.replace(/^[A-D]\)\s*/i, ''));
        } else if (/^(?:תשובה|נכון|Correct|Ans):\s*/i.test(line)) {
          const ansStr = line.replace(/^(?:תשובה|נכון|Correct|Ans):\s*/i, '');
          // convert A, B, C, D to index
          if (/^[A-D]$/i.test(ansStr)) {
            correctIdx = ansStr.toUpperCase().charCodeAt(0) - 65;
          } else {
            correctIdx = parseInt(ansStr) || 0;
          }
        } else if (/^(?:הסבר|Explanation|Exp):\s*/i.test(line)) {
          explanation = line.replace(/^(?:הסבר|Explanation|Exp):\s*/i, '');
        } else if (/^(?:נושא|Topic):\s*/i.test(line)) {
          const t = line.replace(/^(?:נושא|Topic):\s*/i, '').toLowerCase();
          if (t.includes('מוזיקה') || t.includes('music') || t.includes('צליל')) topic = 'music';
          else if (t.includes('אלקטרו') || t.includes('em') || t.includes('אור')) topic = 'em_waves';
          else if (t.includes('טכנולוג') || t.includes('tech') || t.includes('רפואה')) topic = 'tech';
          else topic = 'basics';
        } else if (!question) {
          // If no prefix, first line might be the question
          question = line;
        }
      });

      if (question && options.length >= 2) {
        questions.push({ question, options, correctIdx, explanation, topic });
      }
    });

    if (questions.length === 0) {
      throw new Error('לא נמצאו שאלות בפורמט הטקסט. אנא השתמשו בפורמט הדוגמה המובנה.');
    }
    return questions;
  };

  const loadSampleCustomQuiz = () => {
    const sample = `שאלה: מה קורה כאשר מעבירים קשת על מיתר כינור (Bow) לעומת פריטה בארגז חול פיזיקלי?
A) נוצר גל סינוס מושלם וחלק בגלל כוח המתיחות.
B) נוצרת תנודת "אחוז והחלק" (Stick-Slip) המייצרת גל שן-מסור חד בעל הרמוניות רבות.
C) מולקולות המים במיתר מתחילות לרתוח.
D) הגל דועך מיידית עקב כוח המשיכה.
תשובה: B
הסבר: הקשת גורמת לגל שן-מסור ייחודי המאופיין בהרמוניות בהירות ומנסרות, הנובעות מחיכוך מתמשך.
נושא: music

שאלה: מהו תדר הפעימה (Beat Frequency) הנשמע כאשר משלבים שני גלי קול בתדרים 440 הרץ ו-443 הרץ?
A) 883 הרץ
B) 441.5 הרץ
C) 3 הרץ (הפרש התדרים)
D) 1.5 הרץ
תשובה: C
הסבר: תדירות הפעימה שווה להפרש המוחלט בין שני התדרים המתאבכים: f_beat = |f1 - f2| = 3Hz.
נושא: basics`;
    setCustomInputText(sample);
    parseAndAddQuiz(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readQuizFile(file);
  };

  const readQuizFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseAndAddQuiz(text);
    };
    reader.onerror = () => {
      setUploadError('שגיאה בקריאת הקובץ.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readQuizFile(file);
    }
  };

  const clearCustomQuestions = () => {
    setCustomQuestions([]);
    setIsUsingCustom(false);
    setCustomInputText('');
    setUploadError('');
  };

  const getEncouragement = (score: number, total: number) => {
    const ratio = score / total;
    if (ratio === 1) return '🏆 אלופי הגלים הפיזיקליים! עניתם נכון על כל השאלות!';
    if (ratio >= 0.8) return '🌟 מדהים! שליטה מעולה בחוקי הפיזיקה ואנליזת גלים!';
    if (ratio >= 0.5) return '👍 עבודה יפה! יש לכם בסיס מצוין. נסו להיעזר בסימולטורים לשאלות שטעיתם בהן.';
    return '📚 דרך נהדרת להתחיל! גשו לסימולטורים השונים באתר כדי לבצע את הניסויים בפועל ולהבין את המושגים לעומק.';
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 lg:p-8 space-y-6 text-white" id="self-practice-quiz-panel">
      
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-sans font-extrabold tracking-tight">
              5. שאלוני תרגול עצמי והנחיית למידה
            </h2>
            <p className="text-xs text-slate-400">
              בנו שאלון מותאם אישית או העלו שאלון משלכם לחקירה מונחית ופעילה
            </p>
          </div>
        </div>

        {step !== 'setup' && (
          <button
            onClick={() => setStep('setup')}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזרה לתפריט הבנייה</span>
          </button>
        )}
      </div>

      {/* SETUP STEP (Criteria selection & Custom Quiz Upload) */}
      {step === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Criteria selection (Requirement 1) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="font-sans font-bold text-sm text-slate-200 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <span>הגדרת קריטריונים לשאלון:</span>
              </h3>

              {/* 1. Select Topics Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block font-medium">איזה תחום תרצה לתרגל? (ניתן לבחור מספר תחומים):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-855 rounded-xl border border-slate-800 cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTopics.basics} 
                      onChange={() => toggleTopic('basics')}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">יסודות הגלים</span>
                      <span className="text-[10px] text-slate-500 block">סופרפוזיציה, גלים עומדים וסנתיזת פורייה</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-855 rounded-xl border border-slate-800 cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTopics.music} 
                      onChange={() => toggleTopic('music')}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">מוזיקה וצלילים</span>
                      <span className="text-[10px] text-slate-500 block">חלילית, קלרינט, חצוצרה ופריטת מיתר פיזיקלית</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-855 rounded-xl border border-slate-800 cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTopics.em_waves} 
                      onChange={() => toggleTopic('em_waves')}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">גלים אלקטרומגנטיים</span>
                      <span className="text-[10px] text-slate-500 block">חוק סנל ושבירה, פיזור ריילי ושמיים כחולים</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-855 rounded-xl border border-slate-800 cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTopics.tech} 
                      onChange={() => toggleTopic('tech')}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">טכנולוגיות וגלים</span>
                      <span className="text-[10px] text-slate-500 block">אולטרסאונד רפואי, דימות רנטגן ותנור מיקרוגל</span>
                    </div>
                  </label>

                </div>
              </div>

              {/* 2. Number of questions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-medium">כמה שאלות תרצה בשאלון?</label>
                  <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-850 font-mono">
                    {questionCount} {questionCount === 1 ? 'שאלה' : 'שאלות'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max={isUsingCustom ? Math.max(1, customQuestions.length) : 10} 
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* 3. Difficulty (Available for built-in questions) */}
              {!isUsingCustom && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block font-medium">רמת קושי מועדפת:</label>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-850">
                    {(['easy', 'medium', 'high'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-2 text-xs font-sans rounded-lg cursor-pointer transition-all ${difficulty === diff ? 'bg-amber-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        {diff === 'easy' ? 'קלה 🟢' : diff === 'medium' ? 'בינונית 🟡' : 'גבוהה 🔴'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status information and Start Quiz */}
              <div className="pt-2">
                {isUsingCustom ? (
                  <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-3 flex justify-between items-center mb-4 text-xs">
                    <span className="text-amber-200">
                      ⚙️ טעון שאלון מותאם אישית משלכם ({customQuestions.length} שאלות זמינות)
                    </span>
                    <button
                      onClick={clearCustomQuestions}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    >
                      בטל והחזר שאלון מובנה
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mb-3">
                    השאלון ייווצר על בסיס שאלות תהודה, חישוב וקשרי גלים התואמים את הקריטריונים שבחרתם.
                  </p>
                )}

                <button
                  onClick={startQuiz}
                  disabled={!Object.values(selectedTopics).some(Boolean)}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-sans font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>הרכב שאלון והתחל לתרגל! 🚀</span>
                </button>
              </div>

            </div>
          </div>

          {/* Custom Quiz Upload / Creator (Requirement 2) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-slate-200">
                <Upload className="w-4 h-4 text-sky-400" />
                <h3 className="font-sans font-bold text-sm">העלאת שאלון משלכם (Adaptor):</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                רוצים לטעון שאלון שיצרתם? האתר יפענח אותו ויתאים אותו למערכת כדי לייצר רצף למידה והנחיות מונחות המבוססות על הסימולטורים שלנו!
              </p>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragOver ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".json,.txt" 
                  className="hidden" 
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-300 block">גררו והשליכו לכאן קובץ שאלון</span>
                <span className="text-[10px] text-slate-500 block mt-1">תומך בקבצי JSON או קבצי טקסט תקינים (.txt, .json)</span>
              </div>

              {/* Direct Paste Area */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 block">או הדביקו טקסט שאלון כאן:</label>
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="הדביקו קובץ JSON או פורמט שאלות חופשי..."
                  className="w-full h-24 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-xl border border-slate-800 font-mono focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-red-950/50 border border-red-900/40 text-red-200 text-[10px] rounded-lg flex items-start gap-1.5 leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => parseAndAddQuiz(customInputText)}
                  disabled={!customInputText.trim()}
                  className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  פלח והתאם שאלון!
                </button>
                <button
                  type="button"
                  onClick={loadSampleCustomQuiz}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs rounded-lg cursor-pointer transition-colors"
                  title="טען תבנית שאלות לדוגמה"
                >
                  טען שאלון לדוגמה 📋
                </button>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-900/30 p-2.5 rounded-lg leading-relaxed border border-slate-850">
                <strong className="text-slate-400">פורמט מומלץ (קובץ טקסט פשוט):</strong><br/>
                שאלה: מהי מהירות קול ממוצעת באולטרסאונד?<br/>
                A) 1540 מ'/שנייה<br/>
                B) 340 מ'/שנייה<br/>
                תשובה: A<br/>
                הסבר: בגוף האדם המהירות הממוצעת לחישוב ההד היא כ-1540 מ'/שנייה.
              </div>

            </div>
          </div>

        </div>
      )}

      {/* QUIZ ACTIVE PLAYER */}
      {step === 'playing' && activeQuestions.length > 0 && (
        <div className="space-y-6">
          {/* Progress header */}
          <div className="flex justify-between items-center bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">
              שאלה <strong className="text-white font-mono text-sm">{currentQuestionIdx + 1}</strong> מתוך <strong className="text-white font-mono text-sm">{activeQuestions.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                activeQuestions[currentQuestionIdx].topic === 'basics' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50' :
                activeQuestions[currentQuestionIdx].topic === 'music' ? 'bg-rose-950 text-rose-400 border border-rose-900/50' :
                activeQuestions[currentQuestionIdx].topic === 'em_waves' ? 'bg-sky-950 text-sky-400 border border-sky-900/50' :
                'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
              }`}>
                {activeQuestions[currentQuestionIdx].topicHeb}
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                רמה: {activeQuestions[currentQuestionIdx].difficultyHeb}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIdx + 1) / activeQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-base font-sans font-bold leading-relaxed text-slate-100">
              {activeQuestions[currentQuestionIdx].question}
            </h4>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {activeQuestions[currentQuestionIdx].options.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={answerChecked}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full text-right p-4 rounded-xl text-xs leading-relaxed transition-all border flex items-center justify-between cursor-pointer ${
                    answerChecked
                      ? idx === activeQuestions[currentQuestionIdx].correctIdx
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                        : selectedAnswer === idx
                          ? 'bg-red-950/60 border-red-500 text-red-200'
                          : 'bg-slate-900/30 border-slate-850 text-slate-500'
                      : selectedAnswer === idx
                        ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold shadow-md shadow-amber-500/5'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold bg-slate-800 text-slate-400 w-5 h-5 rounded-md flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {answerChecked && idx === activeQuestions[currentQuestionIdx].correctIdx && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Simulated tool advice / tip */}
            <div className="mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-850/80">
              <span className="text-[11px] font-sans text-slate-400 leading-relaxed block">
                {activeQuestions[currentQuestionIdx].simulationTip}
              </span>
            </div>

            {/* Actions & Explanations */}
            <div className="pt-2">
              {!answerChecked ? (
                <button
                  onClick={checkAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-sans font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow shadow-amber-500/10"
                >
                  בדיקת תשובה ✔️
                </button>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className={`p-4 rounded-xl border ${
                    selectedAnswer === activeQuestions[currentQuestionIdx].correctIdx
                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-900/50 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                      {selectedAnswer === activeQuestions[currentQuestionIdx].correctIdx ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>תשובה נכונה! כל הכבוד.</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>אופס! תשובה לא מדויקת.</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {activeQuestions[currentQuestionIdx].explanation}
                    </p>
                  </div>

                  <button
                    onClick={nextQuestion}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    {currentQuestionIdx < activeQuestions.length - 1 ? 'לשאלה הבאה ➜' : 'סיום השאלון וקבלת סיכום 🏁'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* QUIZ SUMMARY & ANALYTICS */}
      {step === 'summary' && (
        <div className="bg-slate-950/50 p-6 lg:p-8 rounded-3xl border border-slate-800 text-center space-y-6 max-w-2xl mx-auto">
          
          <div className="inline-flex bg-amber-500/10 p-4 rounded-full text-amber-400 border border-amber-500/20 mb-2">
            <Sparkles className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-extrabold text-xl text-slate-100">הושלם בהצלחה!</h3>
            <p className="text-xs text-slate-400">השגתם תוצאה של:</p>
          </div>

          {/* Large circular score display */}
          <div className="relative w-36 h-36 mx-auto flex flex-col items-center justify-center bg-slate-900 rounded-full border-4 border-amber-500 shadow-xl">
            <span className="text-3xl font-sans font-extrabold text-amber-400 font-mono">
              {Math.round((userScore / activeQuestions.length) * 100)}%
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 font-bold">
              {userScore} מתוך {activeQuestions.length} נכונות
            </span>
          </div>

          {/* Encouragement box */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 max-w-md mx-auto">
            <p className="text-xs font-bold leading-relaxed text-slate-200">
              {getEncouragement(userScore, activeQuestions.length)}
            </p>
          </div>

          {/* Next steps advice */}
          <div className="text-right text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-2" dir="rtl">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>המלצות למידה להמשך:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pr-1">
              <li>
                על מנת להעמיק, מומלץ לחזור ללשוניות <strong className="text-white">"ארגז החול"</strong> ולנסות לשחזר את הניסויים שהופיעו בשאלות.
              </li>
              <li>
                נסו להחליף את רמת הלימוד בראש העמוד ל-<strong className="text-white">תיכון 5 יח"ל</strong> או <strong className="text-white">אקדמיה</strong> כדי לראות את הנוסחאות המלאות.
              </li>
              <li>
                תוכלו תמיד לטעון שאלון נוסף, מותאם אישית או מובנה, בתיבה הראשית.
              </li>
            </ul>
          </div>

          {/* Play again buttons */}
          <div className="flex gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => {
                setStep('setup');
              }}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans font-extrabold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow shadow-amber-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>תרגול שאלון חדש</span>
            </button>
            <button
              onClick={startQuiz}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              התחל מחדש (אותם קריטריונים)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
