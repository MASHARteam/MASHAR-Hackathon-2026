const showcase = {
  title: "תוצרי האקתון 2026",
  subtitle: "חלון ראווה לפרויקטים, לרעיונות ולכלים שנולדו במהלך ההאקתון.",
  projects: [
    {
      id: "waves-music-technology",
      title: "Waves, Music and Technology",
      owner: "אבי גרולמן",
      type: "אפליקציית AI Studio",
      summary: "חיבור בין גלים, מוזיקה וטכנולוגיה דרך תוצר אינטראקטיבי ללימוד פיזיקה וגלים.",
      tags: ["גלים", "מוזיקה", "AI Studio"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/avi-waves.png",
        alt: "צילום מסך של פורטל הגלים, המוזיקה והטכנולוגיה"
      },
      links: [
        { label: "פתיחת האפליקציה", href: "https://ai.studio/apps/b2853358-4d01-4885-98ec-1c5b7aca85cb" },
        { label: "קוד מקומי", href: "https://github.com/MASHARteam/MASHAR-Hackathon-2026/tree/master/Avi_G" }
      ],
      details: ["תוצר אינטראקטיבי המציג את נקודת המפגש בין מדע, צליל וטכנולוגיה."]
    },
    {
      id: "ori-argman-physics-tools",
      title: "פורטל פיזיקה וסימולציית גל עומד",
      owner: "אורי ארגמן",
      type: "פורטל וסימולציה",
      summary: "שני כלים אינטראקטיביים ללמידת פיזיקה: פורטל תרגול/למידה וסימולציית גל עומד על מיתר.",
      tags: ["פיזיקה", "גלים", "סימולציה"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/ori-standing-wave.png",
        alt: "צילום מסך של סימולציית גל עומד על מיתר"
      },
      links: [
        { label: "פורטל פיזיקה", href: "https://service-576264902196.europe-west2.run.app/" },
        { label: "סימולציית גל עומד", href: "https://standing-wave-on-a-string-simulation-576264902196.europe-west2.run.app/" }
      ],
      details: [
        "פורטל פיזיקה אינטראקטיבי לצד סימולציה ממוקדת של גל עומד על מיתר.",
        "הכרטיס משתמש בצילום מסך מתוך סימולציית הגל העומד."
      ]
    },
    {
      id: "ori-raviv-brainstorm",
      title: "סיעור מוחות ופיזיקה משחקית",
      owner: "אורי רביב",
      type: "מוקאפ, מחקר ומצגת",
      summary: "תהליך רעיוני וחזותי לפיתוח חוויית פיזיקה משחקית, כולל מוקאפ פעיל, מחקר UX/UI ומצגת.",
      tags: ["מוקאפ", "UX/UI", "מצגת"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/ori-playingphysics.png",
        alt: "צילום מסך של מוקאפ אפליקציית הפיזיקה"
      },
      links: [
        { label: "פתיחת המוקאפ", href: "https://playingphysics.lovable.app" },
        { label: "מסמך מחקר", href: "https://mashar-my.sharepoint.com/:t:/g/personal/dror-moshe_aharoni_wise_org_il/IQCw98c3VCffRa5oPd4fabk3ARCUAcClKcq1dQ5H6ZovJVg?e=QKx7GH" },
        { label: "מצגת NotebookLM", href: "https://notebooklm.google.com/notebook/90b4aa23-8fc5-4451-b7fd-32d8e96455da/artifact/a4b8f6c3-b511-4b6b-a29a-0cdd6901c1f8?utm_source=nlm_web_share&utm_medium=google_oo&utm_campaign=art_share_1&utm_content=&utm_smc=nlm_web_share_google_oo_art_share_1_" },
        { label: "מצגת מקומית", href: "public/projects/ori-raviv/Gamified_AI_Physics_Assessment_(2).pptx" },
        { label: "קובץ מחקר מקומי", href: "public/projects/ori-raviv/physics-app-ux-research.md" }
      ],
      details: [
        "הפרויקט מציג כיוון משחקי ללמידת פיזיקה, עם מוקאפ אינטראקטיבי וחומרי מחקר/מצגת משלימים.",
        "הכרטיס משתמש בצילום מסך מתוך המוקאפ הפעיל."
      ]
    },
    {
      id: "edit-bliss-flute-bot",
      title: "בוט הכנת חליל מגזר",
      owner: "אדית בליס",
      type: "בוט, מצגת ושיחות פיתוח",
      summary: "בוט יצירתי שמלווה הכנה של חליל מגזר ומשלב הנחיה דיגיטלית, מצגת ושיחות עבודה עם ChatGPT.",
      tags: ["בוט", "מוזיקה", "ChatGPT"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/edit-ppt-thumbnail.jpeg",
        alt: "תמונה מייצגת מתוך מצגת בוט הכנת חליל מגזר"
      },
      links: [
        { label: "פתיחת ה-GPT", href: "https://chatgpt.com/g/g-6a42777607fc8191a6bc8857904d13fc-hknt-khlyl-mgzr" },
        { label: "מצגת מקומית", href: "public/projects/edit-bliss/flute-bot-presentation.pptx" },
        { label: "שיחת פיתוח 1", href: "https://chatgpt.com/share/6a43bb96-acd4-83eb-ba02-5df1509c8ec3" },
        { label: "שיחת פיתוח 2", href: "https://chatgpt.com/share/6a43bbd0-9b78-83ed-a090-c5ec94c8db7f" },
        { label: "שיחת פיתוח 3", href: "https://chatgpt.com/share/6a43bbf3-3794-83ed-a1b2-92b8f32bc7e7" },
        { label: "שיחת פיתוח 4", href: "https://chatgpt.com/share/6a43bb8f-cbc8-83ed-9c75-b37553d66cce" }
      ],
      details: [
        "תוצר המשלב יצירה ידנית, מוזיקה והנחיה דיגיטלית סביב הכנת חליל מגזר.",
        "חומרי הפרויקט כוללים GPT ייעודי, מצגת ושיחות פיתוח מצורפות."
      ]
    },
    {
      id: "chat-learning-path",
      title: "מסלול למידה אישי מבוסס AI",
      owner: "עודד בטר, שולי אייל, רן דמארי ומארי דונאי",
      type: "אפליקציית למידה מבוססת AI",
      summary: "מערכת לבניית מסלול לימודים אישי המשלב פיזיקה חקרנית, AI, ניתוח נתונים, סימולציות ומעבדות.",
      tags: ["AI", "פיזיקה", "סילבוס", "צ'אט"],
      featured: true,
      visual: {
        kind: "image",
        src: "public/assets/screenshots/oded-learning-path.png",
        alt: "צילום מסך של מסלול הלמידה האישי של עודד בטר והצוות"
      },
      links: [
        { label: "פתיחת האפליקציה", href: "https://ai.studio/apps/d2418b12-a962-448f-92ca-14069d943e57" },
        { label: "קוד מקומי", href: "https://github.com/MASHARteam/MASHAR-Hackathon-2026/tree/master/Oded" }
      ],
      details: [
        "הפרויקט מיועד להנגיש, להתאים ולבנות מסלול הכשרה ולימודים תלת-שנתי אישי.",
        "המערכת מסייעת למורים ולתלמידים ליצור תוכנית פדגוגית מותאמת אישית ולקבל ליווי שוטף.",
        "שאלון אפיון פדגוגי אינטראקטיבי בארבעה שלבים מאפיין ניסיון עם כלי AI, שכבת גיל, מטרות למידה, ניסיון קודם בתכנות ותחומי מיקוד פיזיקליים.",
        "מחולל מסלול לימודים תלת-שנתי מבוסס Gemini API מנתח את תשובות השאלון ומפיק סילבוס מדורג לשלוש שנים.",
        "צ'אט יועץ פדגוגי מאפשר להעמיק בנושאי הלימוד, לשאול שאלות ולקבל הצעות לשיפור והטמעה.",
        "הממשק תומך עברית מלאה, RTL, טאבים למסלול אישי ולצ'אט, ותצוגה ברורה של הנתונים.",
        "התוצר פעיל כעת בקישור AI Studio, וקוד המקור המקומי נמצא בתיקיית Oded."
      ],
      featureBlocks: [
        { heading: "שאלון אפיון", text: "ארבעה שלבים לאפיון גיל, ניסיון עם AI, מטרות למידה, תכנות ותחומי פיזיקה." },
        { heading: "AI Syllabus Generator", text: "מנוע מבוסס Gemini API שמפיק מסלול לימודים מדורג לשלוש שנים." },
        { heading: "צ'אט מלווה", text: "ממשק שיחה חי לקבלת הסברים, שאלות פדגוגיות והצעות הטמעה." }
      ]
    },
    {
      id: "computational-article",
      title: "מאמר חישובי",
      owner: "שמעון לרנר",
      type: "מחברת Colab",
      summary: "מאמר/מחברת חישובית ב-Google Colab כחלק מתוצרי ההאקתון.",
      tags: ["Colab", "חישוביות", "מאמר"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/shimon-colab.png",
        alt: "צילום מסך של מחברת Google Colab"
      },
      links: [
        { label: "פתיחת ה-Colab", href: "https://colab.research.google.com/drive/1QseCsGCqKI0wbqkvkeCAq9bZGvyKh7jD?usp=sharing" }
      ],
      details: ["תוצר חישובי שנפתח כ-Google Colab ומיועד להצגת עבודה חישובית/מחקרית."]
    },
    {
      id: "math-practice-portal",
      title: "פורטל תרגול במתמטיקה",
      owner: "טל סילוורווטר",
      type: "אפליקציית תרגול",
      summary: "אפליקציית תרגול מתמטיקה לתלמידי פיזיקה בכיתות י׳-י״ב.",
      tags: ["מתמטיקה", "פיזיקה", "תרגול"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/tal-silverwater.png",
        alt: "צילום מסך של פורטל התרגול במתמטיקה"
      },
      links: [
        { label: "פתיחת התוצר", href: "public/projects/tal-silverwater/index.html" }
      ],
      details: [
        "פורטל תרגול אינטראקטיבי למיומנויות מתמטיות הנדרשות בלימודי פיזיקה.",
        "התוצר כולל חוויית תרגול עצמאית ונפתח כעמוד מלא מתוך כרטיס הפרויקט."
      ]
    },
    {
      id: "inquiry-labs",
      title: "חידוש מעבדות חקר ישנות",
      owner: "דורה אתגר וטל ורדן",
      type: "תוצר חישובי",
      summary: "חידוש והנגשה של מעבדות חקר ישנות באמצעות גרסאות DOCX נוחות לעריכה ושימוש מחודש.",
      tags: ["מעבדות", "חקר", "DOCX"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/Dora_Tal.jpeg",
        alt: "תמונה מייצגת של פרויקט חידוש מעבדות חקר ישנות"
      },
      links: [
        { label: "פתיחת קבצי DOCX", href: "https://mashar-my.sharepoint.com/:f:/g/personal/tal_verdene_wise_org_il/IgA0ARbnhk9lRaiLqaxyBPzgAQUjxkp3IGx8rh4FXYCjS6o?e=VJIvA4" }
      ],
      details: [
        "חידוש מעבדות חקר ישנות והנגשתן מחדש לעבודה שוטפת בכיתה ובמעבדה.",
        "התוצר כולל גרסאות DOCX לקבצי המעבדה, כדי לאפשר עריכה, התאמה ושימוש חוזר."
      ]
    },
    {
      id: "inertia-cart",
      title: "עגלת ההתמדה",
      owner: "אלון שחם, אבי כהן ואסף אלבלח (פרויקט אישי)",
      type: "אב-טיפוס פיזיקלי",
      summary: "עגלה חווייתית המדגימה את חוק ההתמדה בעזרת מנגנון חיישן ושחרור כדור אוטומטי.",
      tags: ["מכניקה", "התמדה", "אב-טיפוס"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/Alon_Assaf_Moshe.jpeg",
        alt: "תמונה מייצגת של פרויקט עגלת ההתמדה"
      },
      links: [],
      details: [
        "מכיוון שעגלות התמדה מסוג זה אינן מיוצרות ומסופקות יותר, הצוות בראשות אלון שחם הרים את הכפפה במטרה להחזיר את הניסוי הקלאסי והחשוב הזה אל מעבדת הפיזיקה, תוך שדרוגו באמצעים מודרניים.",
        "הפרויקט מציע כלי פיזי וחווייתי הממחיש באופן אקטיבי את חוק ההתמדה, החוק הראשון של ניוטון.",
        "אל העגלה מחובר התקן ייחודי בצורת מקל סבא, שבקצהו תלוי כדור. במהלך תנועת העגלה, כאשר ההתקן חולף על פני חיישן ממוקם, המערכת מזהה זאת ומשחררת באופן אוטומטי את הכדור התלוי.",
        "המנגנון מאפשר לתלמידים לחקור ולראות בעיניהם את שימור המהירות האופקית של הכדור בזמן הנפילה.",
        "במהלך ההאקתון הצוות תכנן, עיצב והשלים מאפס את בניית אב-הטיפוס של העגלה, כולל המנגנון המכני והאלקטרוני של החיישן ושחרור הכדור.",
        "הערך הפדגוגי של הפרויקט הוא החייאת ניסוי שאינו זמין יותר לרכישה והנגשת מושגים מופשטים במכניקה דרך התנסות מוחשית, מסקרנת ופעילה."
      ]
    },
    {
      id: "asaf-wall",
      title: "כלי למידה עצמאית",
      owner: "אסף וול",
      type: "אפליקציית AI Studio",
      summary: "כלי דיגיטלי ללמידה עצמאית המלווה תלמידים בתהליך לימוד ותרגול אישי.",
      tags: ["למידה עצמאית", "AI Studio", "תרגול"],
      visual: {
        kind: "image",
        src: "public/assets/screenshots/Assaf_wool.png",
        alt: "צילום מסך של כלי למידה עצמאית"
      },
      links: [
        { label: "פתיחת האפליקציה", href: "https://ai.studio/apps/57ea6d8a-81af-458f-8ee9-4da2b3d70a1e" }
      ],
      details: [
        "כלי למידה עצמאית שנבנה ב-AI Studio ומיועד ללוות תלמידים בעבודה אישית.",
        "הכרטיס משתמש בצילום מסך של התוצר וקישור ישיר לפתיחת האפליקציה."
      ]
    }
  ],
  feedback: {
    headline: "מה למדנו מהמשוב",
    intro: "17 משתתפים סיכמו את חוויית ההאקתון. התמונה הכללית חיובית מאוד: הפורמט הפיזי, עבודת הצוות והתוצרים עצמם נתפסו כחוזקות מרכזיות, לצד צורך ברור בהכנה מוקדמת ובהידוק רכיבי הלמידה.",
    metrics: [
      { value: "3.94/5", label: "שביעות רצון כללית" },
      { value: "4.41/5", label: "חלל, חדרים וציוד" },
      { value: "4.12/5", label: "דינמיקה קבוצתית" },
      { value: "12/17", label: "רוצים להמשיך לפתח" }
    ],
    insights: [
      {
        title: "הפורמט הפיזי עבד",
        text: "16 מתוך 17 משתתפים שללו יום ראשון מרחוק. עבור רוב המשתתפים, יומיים מלאים יחד היו תנאי משמעותי לשיתוף פעולה ולהפריה הדדית."
      },
      {
        title: "התוצרים היו רגע השיא",
        text: "משתתפים חזרו שוב ושוב לרגע שבו רעיון הפך לאבטיפוס עובד: לראות גרסה ראשונית, להציג מוצר ולגלות יכולות שלא תוכננו מראש."
      },
      {
        title: "הלמידה צריכה הכנה טובה יותר",
        text: "מדד הלמידה וההעשרה היה הנמוך ביותר מבין המדדים הכלליים. המשתתפים ביקשו לקבל כלים, רעיונות וכיווני עבודה כמה ימים לפני האירוע."
      }
    ],
    recommendations: [
      "לשלוח מראש כלי AI, דוגמאות וכיווני עבודה כדי להגיע ממוקדים יותר.",
      "להקדיש סשן קצר להתנסות בכלים ייעודיים לפני ספרינט הפיתוח.",
      "להדק את הלו״ז ולשמור על רציפות השתתפות הצוותים.",
      "לעדכן מראש בלוחות הזמנים המלאים ולשפר את גיוון הכיבוד."
    ]
  }
};



