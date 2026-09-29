export type SupportedLanguage =
  | "English"
  | "Hindi"
  | "Marathi"
  | "Kannada"
  | "Tamil"
  | "Telugu";

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    // Nav & Common
    nav_dashboard: "Dashboard",
    nav_crisis_monitor: "Crisis & Weather",
    nav_campaigns: "Campaigns",
    nav_audience: "Audience",
    nav_templates: "Content & Templates",
    nav_channels: "Channels",
    nav_analytics: "Analytics",
    nav_reports: "Reports",
    nav_settings: "Settings",

    // Dashboard Overview
    dashboard_title: "Dashboard Overview 👋",
    dashboard_subtitle: "Real-time overview of your communication campaigns and audience.",
    refresh: "Refresh",
    
    // Stats cards
    stat_campaigns: "Total Campaigns",
    stat_recipients: "Total Recipients",
    stat_content: "Content Generated",
    stat_languages: "Languages Active",
    stat_segments: "Audience Segments",
    stat_vs_last_month: "vs last month",

    // Recent Campaigns
    recent_campaigns: "Recent Campaigns",
    view_all: "View All",
    col_name: "Name",
    col_type: "Type",
    col_priority: "Priority",
    col_status: "Status",
    col_content: "Content",
    items: "items",
    no_campaigns: "No campaigns yet. Create your first campaign!",

    // Campaigns by status
    campaigns_by_status: "Campaigns by Status",
    total: "Total",
    no_status_data: "No campaigns yet",

    // Status & Priority names
    status_draft: "Draft",
    status_active: "Active",
    status_scheduled: "Scheduled",
    status_running: "Running",
    status_completed: "Completed",
    status_cancelled: "Cancelled",
    priority_low: "Low",
    priority_normal: "Normal",
    priority_high: "High",
    priority_critical: "Critical",

    // Tones
    tone_formal: "Formal",
    tone_friendly: "Friendly",
    tone_urgent: "Urgent",
    tone_informative: "Informative",
    tone_empathetic: "Empathetic",

    // AI generator widget
    ai_widget_title: "AI Content Generator",
    powered_by_llm: "Powered by LLM",
    topic_placeholder: "Enter your campaign topic or idea",
    topic_example: "e.g., Dengue prevention awareness",
    tone: "Tone",
    language: "Language",
    generate_content: "Generate Content",
    generating: "Generating...",
    copied: "Copied!",
    copy: "Copy",

    // Audience Segments
    audience_segments: "Audience Segments",
    manage: "Manage",
    members: "members",
    dynamic_segment: "Dynamic Segment",

    // Analytics Page
    analytics_title: "Campaign Analytics",
    analytics_subtitle: "Monitor your campaign performance and engagement metrics.",
    total_delivered: "Total Delivered",
    open_rate: "Open Rate",
    click_through_rate: "Click-through Rate",
    engagement_rate: "Engagement Rate",
    engagement_trend: "Engagement Trend",
    performance_by_channel: "Performance by Channel",
    language_wise_reach: "Language-wise Reach",
    audience_engagement: "Audience Engagement",
    engaged: "Engaged",
    active: "Active",
    inactive: "Inactive",
    time_range_7d: "Last 7 Days",
    time_range_30d: "Last 30 Days",
    time_range_all: "All Time",
  },

  Hindi: {
    // Nav & Common
    nav_dashboard: "डैशबोर्ड",
    nav_campaigns: "अभियान",
    nav_audience: "दर्शक / ऑडियंस",
    nav_templates: "सामग्री और टेम्पलेट्स",
    nav_channels: "संचार माध्यम",
    nav_analytics: "एनालिटिक्स",
    nav_reports: "रिपोर्ट्स",
    nav_settings: "सेटिंग्स",

    // Dashboard Overview
    dashboard_title: "डैशबोर्ड अवलोकन 👋",
    dashboard_subtitle: "आपके जनसंचार अभियानों और श्रोताओं का वास्तविक समय अवलोकन।",
    refresh: "ताज़ा करें",
    
    // Stats cards
    stat_campaigns: "कुल अभियान",
    stat_recipients: "कुल नागरिक प्राप्तकर्ता",
    stat_content: "उत्पन्न सामग्री",
    stat_languages: "सक्रिय भाषाएं",
    stat_segments: "श्रोता वर्ग (सेगमेंट)",
    stat_vs_last_month: "पिछले महीने की तुलना में",

    // Recent Campaigns
    recent_campaigns: "हाल के अभियान",
    view_all: "सभी देखें",
    col_name: "नाम",
    col_type: "प्रकार",
    col_priority: "प्राथमिकता",
    col_status: "स्थिति",
    col_content: "सामग्री",
    items: "सामग्रियां",
    no_campaigns: "अभी तक कोई अभियान नहीं। अपना पहला अभियान बनाएं!",

    // Campaigns by status
    campaigns_by_status: "स्थिति के अनुसार अभियान",
    total: "कुल",
    no_status_data: "कोई अभियान उपलब्ध नहीं",

    // Status & Priority names
    status_draft: "ड्राफ्ट",
    status_active: "सक्रिय",
    status_scheduled: "अनुसूचित",
    status_running: "चालू",
    status_completed: "पूर्ण",
    status_cancelled: "रद्द",
    priority_low: "निम्न",
    priority_normal: "सामान्य",
    priority_high: "उच्च",
    priority_critical: "गंभीर",

    // Tones
    tone_formal: "औपचारिक",
    tone_friendly: "मैत्रीपूर्ण",
    tone_urgent: "अति आवश्यक",
    tone_informative: "जानकारीपूर्ण",
    tone_empathetic: "सहानुभूतिपूर्ण",

    // AI generator widget
    ai_widget_title: "एआई सामग्री जनरेटर",
    powered_by_llm: "एलएलएम द्वारा संचालित",
    topic_placeholder: "अपना अभियान विषय या विचार दर्ज करें",
    topic_example: "उदा. डेंगू रोकथाम जागरूकता संदेश",
    tone: "टोन / शैली",
    language: "भाषा",
    generate_content: "सामग्री उत्पन्न करें",
    generating: "उत्पन्न किया जा रहा है...",
    copied: "कॉपी किया गया!",
    copy: "कॉपी",

    // Audience Segments
    audience_segments: "श्रोता वर्ग (ऑडियंस)",
    manage: "प्रबंधन",
    members: "सदस्य",
    dynamic_segment: "सक्रिय सेगमेंट",

    // Analytics Page
    analytics_title: "अभियान एनालिटिक्स",
    analytics_subtitle: "अपने अभियान के प्रदर्शन और नागरिक सहभागिता मेट्रिक्स की निगरानी करें।",
    total_delivered: "कुल वितरित संदेश",
    open_rate: "ओपन दर",
    click_through_rate: "क्लिक-थ्रू दर",
    engagement_rate: "सहभागिता दर",
    engagement_trend: "सहभागिता रुझान (7 दिन)",
    performance_by_channel: "माध्यम अनुसार प्रदर्शन (चैनल)",
    language_wise_reach: "भाषावार नागरिक पहुंच",
    audience_engagement: "नागरिक सहभागिता",
    engaged: "सहभागी",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    time_range_7d: "पिछले 7 दिन",
    time_range_30d: "पिछले 30 दिन",
    time_range_all: "सभी समय",
  },

  Marathi: {
    // Nav & Common
    nav_dashboard: "डॅशबोर्ड",
    nav_campaigns: "मोहिमा",
    nav_audience: "नागरिक प्रेक्षक",
    nav_templates: "सामग्री व टेम्पलेट्स",
    nav_channels: "संवाद माध्यमे",
    nav_analytics: "विश्लेषण (Analytics)",
    nav_reports: "अहवाल",
    nav_settings: "सेटिंग्ज",

    // Dashboard Overview
    dashboard_title: "डॅशबोर्ड विहंगावलोकन 👋",
    dashboard_subtitle: "आपल्या जनसंपर्क मोहिमा आणि नागरिकांचे थेट रिअल-टाइम विहंगावलोकन.",
    refresh: "रिफ्रेश करा",
    
    // Stats cards
    stat_campaigns: "एकूण मोहिमा",
    stat_recipients: "एकूण प्राप्तकर्ते",
    stat_content: "तयार सामग्री",
    stat_languages: "सक्रिय भाषा",
    stat_segments: "प्रेक्षक विभाग",
    stat_vs_last_month: "मागील महिन्याशी तुलना",

    // Recent Campaigns
    recent_campaigns: "अलीकडील मोहिमा",
    view_all: "सर्व पहा",
    col_name: "नाव",
    col_type: "प्रकार",
    col_priority: "प्राधान्य",
    col_status: "स्थिती",
    col_content: "सामग्री",
    items: "घटक",
    no_campaigns: "अद्याप कोणतीही मोहीम नाही. आपली पहिली मोहीम तयार करा!",

    // Campaigns by status
    campaigns_by_status: "स्थितीनुसार मोहिमा",
    total: "एकूण",
    no_status_data: "माहिती उपलब्ध नाही",

    // Status & Priority names
    status_draft: "मसुदा (Draft)",
    status_active: "सक्रिय (Active)",
    status_scheduled: "नियोजित",
    status_running: "प्रगतीपथावर",
    status_completed: "पूर्ण",
    status_cancelled: "रद्द",
    priority_low: "कमी",
    priority_normal: "सामान्य",
    priority_high: "उच्च",
    priority_critical: "गंभीर",

    // Tones
    tone_formal: "औपचारिक",
    tone_friendly: "मैत्रीपूर्ण",
    tone_urgent: "तातडीचे",
    tone_informative: "माहितीपूर्ण",
    tone_empathetic: "सहानुभूतीपूर्ण",

    // AI generator widget
    ai_widget_title: "एआय सामग्री जनरेटर",
    powered_by_llm: "एलएलएम समर्थित",
    topic_placeholder: "आपला मोहीम विषय किंवा कल्पना प्रविष्ट करा",
    topic_example: "उदा. पूर इशारा किंवा आरोग्य मोहीम",
    tone: "टोन / शैली",
    language: "भाषा",
    generate_content: "सामग्री तयार करा",
    generating: "तयार होत आहे...",
    copied: "कॉपी केले!",
    copy: "कॉपी",

    // Audience Segments
    audience_segments: "नागरिक गट (Segments)",
    manage: "व्यवस्थापित करा",
    members: "सदस्य",
    dynamic_segment: "डायनॅमिक विभाग",

    // Analytics Page
    analytics_title: "मोहीम विश्लेषण (Analytics)",
    analytics_subtitle: "आपल्या मोहिमांची कार्यक्षमता आणि पोहोच मेट्रिक्स पहा.",
    total_delivered: "एकूण वितरित संदेश",
    open_rate: "ओपन दर",
    click_through_rate: "क्लिक-थ्रू दर",
    engagement_rate: "सहभागिता दर",
    engagement_trend: "सहभागिता कल (ट्रेंड)",
    performance_by_channel: "माध्यमानुसार कार्यक्षमता",
    language_wise_reach: "भाषावार नागरिक पोहोच",
    audience_engagement: "नागरिक सहभाग",
    engaged: "सहभागी",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    time_range_7d: "मागील ७ दिवस",
    time_range_30d: "मागील ३० दिवस",
    time_range_all: "संपूर्ण वेळ",
  },

  Kannada: {
    // Nav & Common
    nav_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    nav_campaigns: "ಅಭಿಯಾನಗಳು",
    nav_audience: "ಪ್ರೇಕ್ಷಕರು",
    nav_templates: "ವಿಷಯ ಮತ್ತು ಟೆಂಪ್ಲೇಟ್‌ಗಳು",
    nav_channels: "ಸಂವಹನ ಚಾನಲ್‌ಗಳು",
    nav_analytics: "ವಿಶ್ಲೇಷಣೆ",
    nav_reports: "ವರದಿಗಳು",
    nav_settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",

    // Dashboard Overview
    dashboard_title: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನ 👋",
    dashboard_subtitle: "ನಿಮ್ಮ ಸಂವಹನ ಅಭಿಯಾನಗಳು ಮತ್ತು ನಾಗರಿಕರ ನೈಜ-ಸಮಯದ ಅವಲೋಕನ.",
    refresh: "ರಿಫ್ರೆಶ್",
    
    // Stats cards
    stat_campaigns: "ಒಟ್ಟು ಅಭಿಯಾನಗಳು",
    stat_recipients: "ಒಟ್ಟು ಸ್ವೀಕೃತದಾರರು",
    stat_content: "ರಚಿಸಲಾದ ವಿಷಯ",
    stat_languages: "ಸಕ್ರಿಯ ಭಾಷೆಗಳು",
    stat_segments: "ಪ್ರೇಕ್ಷಕರ ಗುಂಪುಗಳು",
    stat_vs_last_month: "ಕಳೆದ ತಿಂಗಳಿಗೆ ಹೋಲಿಸಿದರೆ",

    // Recent Campaigns
    recent_campaigns: "ಇತ್ತೀಚಿನ ಅಭಿಯಾನಗಳು",
    view_all: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ",
    col_name: "ಹೆಸರು",
    col_type: "ವಿಧ",
    col_priority: "ಆದ್ಯತೆ",
    col_status: "ಸ್ಥಿತಿ",
    col_content: "ವಿಷಯ",
    items: "ಐಟಂಗಳು",
    no_campaigns: "ಯಾವುದೇ ಅಭಿಯಾನಗಳಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಅಭಿಯಾನವನ್ನು ರಚಿಸಿ!",

    // Campaigns by status
    campaigns_by_status: "ಸ್ಥಿತಿಯ ಪ್ರಕಾರ ಅಭಿಯಾನಗಳು",
    total: "ಒಟ್ಟು",
    no_status_data: "ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",

    // Status & Priority names
    status_draft: "ಕರಡು",
    status_active: "ಸಕ್ರಿಯ",
    status_scheduled: "ನಿಗದಿತ",
    status_running: "ಚಾಲನೆಯಲ್ಲಿದೆ",
    status_completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    status_cancelled: "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ",
    priority_low: "ಕಡಿಮೆ",
    priority_normal: "ಸಾಮಾನ್ಯ",
    priority_high: "ಹೆಚ್ಚು",
    priority_critical: "ನಿರ್ಣಾಯಕ",

    // Tones
    tone_formal: "ಔಪಚಾರಿಕ",
    tone_friendly: "ಸ್ನೇಹಪರ",
    tone_urgent: "ತುರ್ತು",
    tone_informative: "ಮಾಹಿತಿಯುಕ್ತ",
    tone_empathetic: "ಸಹಾನುಭೂತಿಯ",

    // AI generator widget
    ai_widget_title: "AI ವಿಷಯ ಜನರೇಟರ್",
    powered_by_llm: "LLM ನಿಂದ ಚಾಲಿತವಾಗಿದೆ",
    topic_placeholder: "ನಿಮ್ಮ ಅಭಿಯಾನದ ವಿಷಯವನ್ನು ನಮೂದಿಸಿ",
    topic_example: "ಉದಾ. ಡೆಂಗ್ಯೂ ತಡೆಗಟ್ಟುವಿಕೆ ಜಾಗೃತಿ",
    tone: "ಧ್ವನಿ",
    language: "ಭಾಷೆ",
    generate_content: "ವಿಷಯ ರಚಿಸಿ",
    generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    copied: "ನಕಲಿಸಲಾಗಿದೆ!",
    copy: "ನಕಲಿಸಿ",

    // Audience Segments
    audience_segments: "ಪ್ರೇಕ್ಷಕರ ವಿಭಾಗಗಳು",
    manage: "ನಿರ್ವಹಿಸಿ",
    members: "ಸದಸ್ಯರು",
    dynamic_segment: "ಕ್ರಿಯಾತ್ಮಕ ವಿಭಾಗ",

    // Analytics Page
    analytics_title: "ಅಭಿಯಾನ ವಿಶ್ಲೇಷಣೆ",
    analytics_subtitle: "ನಿಮ್ಮ ಅಭಿಯಾನದ ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆಯ ಮೆಟ್ರಿಕ್ಸ್‌ಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
    total_delivered: "ಒಟ್ಟು ತಲುಪಿಸಲಾದ ಸಂದೇಶಗಳು",
    open_rate: "ತೆರೆಯುವ ದರ",
    click_through_rate: "ಕ್ಲಿಕ್ ದರ",
    engagement_rate: "ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ ದರ",
    engagement_trend: "ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆಯ ಪ್ರವೃತ್ತಿ",
    performance_by_channel: "ಚಾನಲ್ ಮೂಲಕ ಕಾರ್ಯಕ್ಷಮತೆ",
    language_wise_reach: "ಭಾಷಾವಾರು ತಲುಪುವಿಕೆ",
    audience_engagement: "ಪ್ರೇಕ್ಷಕರ ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ",
    engaged: "ತೊಡಗಿಸಿಕೊಂಡಿದ್ದಾರೆ",
    active: "ಸಕ್ರಿಯ",
    inactive: "ನಿಷ್ಕ್ರಿಯ",
    time_range_7d: "ಕಳೆದ 7 ದಿನಗಳು",
    time_range_30d: "ಕಳೆದ 30 ದಿನಗಳು",
    time_range_all: "ಎಲ್ಲಾ ಸಮಯ",
  },

  Tamil: {
    // Nav & Common
    nav_dashboard: "டாஷ்போர்டு",
    nav_campaigns: "பிரச்சாரங்கள்",
    nav_audience: "பார்வையாளர்கள்",
    nav_templates: "உள்ளடக்கம் & வார்ப்புருக்கள்",
    nav_channels: "தொடர்பு சேனல்கள்",
    nav_analytics: "பகுப்பாய்வு",
    nav_reports: "அறிக்கைகள்",
    nav_settings: "அமைப்புகள்",

    // Dashboard Overview
    dashboard_title: "டாஷ்போர்டு கண்ணோட்டம் 👋",
    dashboard_subtitle: "உங்கள் மக்கள் தொடர்பு பிரச்சாரங்களின் நேரடி கண்ணோட்டம்.",
    refresh: "புதுப்பி",
    
    // Stats cards
    stat_campaigns: "மொத்த பிரச்சாரங்கள்",
    stat_recipients: "மொத்த பெறுநர்கள்",
    stat_content: "உருவாக்கப்பட்ட உள்ளடக்கம்",
    stat_languages: "செயலில் உள்ள மொழிகள்",
    stat_segments: "பார்வையாளர் பிரிவுகள்",
    stat_vs_last_month: "கடந்த மாதத்துடன் ஒப்பீடு",

    // Recent Campaigns
    recent_campaigns: "சமீபத்திய பிரச்சாரங்கள்",
    view_all: "அனைத்தையும் காண்க",
    col_name: "பெயர்",
    col_type: "வகை",
    col_priority: "முன்னுரிமை",
    col_status: "நிலை",
    col_content: "உள்ளடக்கம்",
    items: "உருப்படிகள்",
    no_campaigns: "பிரச்சாரங்கள் இல்லை. உங்கள் முதல் பிரச்சாரத்தை உருவாக்குங்கள்!",

    // Campaigns by status
    campaigns_by_status: "நிலை வாரியாக பிரச்சாரங்கள்",
    total: "மொத்தம்",
    no_status_data: "தரவு இல்லை",

    // Status & Priority names
    status_draft: "வரைவு",
    status_active: "செயலில்",
    status_scheduled: "திட்டமிடப்பட்டது",
    status_running: "இயங்குகிறது",
    status_completed: "முடிந்தது",
    status_cancelled: "ரத்து செய்யப்பட்டது",
    priority_low: "குறைந்த",
    priority_normal: "சாதாரண",
    priority_high: "அதிக",
    priority_critical: "முக்கியமான",

    // Tones
    tone_formal: "முறையான",
    tone_friendly: "நட்பான",
    tone_urgent: "அவசரம்",
    tone_informative: "தகவல் தரும்",
    tone_empathetic: "பரிவுள்ள",

    // AI generator widget
    ai_widget_title: "AI உள்ளடக்க ஜெனரேட்டர்",
    powered_by_llm: "LLM மூலம் இயக்கப்படுகிறது",
    topic_placeholder: "பிரச்சார தலைப்பை உள்ளிடவும்",
    topic_example: "எ.கா. டெங்கு விழிப்புணர்வு எச்சரிக்கை",
    tone: "தொனி",
    language: "மொழி",
    generate_content: "உள்ளடக்கத்தை உருவாக்கு",
    generating: "உருவாக்குகிறது...",
    copied: "நகலெடுக்கப்பட்டது!",
    copy: "நகலெடு",

    // Audience Segments
    audience_segments: "பார்வையாளர் பிரிவுகள்",
    manage: "நிர்வகி",
    members: "உறுப்பினர்கள்",
    dynamic_segment: "டைனமிக் பிரிவு",

    // Analytics Page
    analytics_title: "பிரச்சார பகுப்பாய்வு",
    analytics_subtitle: "உங்கள் பிரச்சாரத்தின் செயல்திறன் மற்றும் ஈடுபாட்டு அளவீடுகளைக் கண்காணிக்கவும்.",
    total_delivered: "மொத்த விநியோகம்",
    open_rate: "திறப்பு விகிதம்",
    click_through_rate: "கிளிக் விகிதம்",
    engagement_rate: "ஈடுபாட்டு விகிதம்",
    engagement_trend: "ஈடுபாட்டு போக்கு",
    performance_by_channel: "சேனல் வாரியாக செயல்திறன்",
    language_wise_reach: "மொழி வாரியான சென்றடைவு",
    audience_engagement: "பார்வையாளர் ஈடுபாடு",
    engaged: "ஈடுபட்டவர்கள்",
    active: "செயலில்",
    inactive: "செயலற்ற",
    time_range_7d: "கடந்த 7 நாட்கள்",
    time_range_30d: "கடந்த 30 நாட்கள்",
    time_range_all: "அனைத்து காலம்",
  },

  Telugu: {
    // Nav & Common
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_campaigns: "ప్రచారాలు",
    nav_audience: "ప్రేక్షకులు",
    nav_templates: "కంటెంట్ & టెంప్లేట్‌లు",
    nav_channels: "కమ్యూనికేషన్ ఛానెల్‌లు",
    nav_analytics: "విశ్లేషణలు (Analytics)",
    nav_reports: "నివేదికలు",
    nav_settings: "సెట్టింగ్‌లు",

    // Dashboard Overview
    dashboard_title: "డాష్‌బోర్డ్ స్థూలదృష్టి 👋",
    dashboard_subtitle: "మీ ప్రజా ప్రచారాలు మరియు ప్రేక్షకుల రియల్-టైమ్ స్థూలదృష్టి.",
    refresh: "రిఫ్రెష్ చేయండి",
    
    // Stats cards
    stat_campaigns: "మొత్తం ప్రచారాలు",
    stat_recipients: "మొత్తం గ్రహీతలు",
    stat_content: "సృష్టించబడిన కంటెంట్",
    stat_languages: "క్రియాశీల భాషలు",
    stat_segments: "ప్రేక్షకుల విభాగాలు",
    stat_vs_last_month: "గత నెలతో పోలిస్తే",

    // Recent Campaigns
    recent_campaigns: "ఇటీవలి ప్రచారాలు",
    view_all: "అన్నీ చూడండి",
    col_name: "పేరు",
    col_type: "రకం",
    col_priority: "ప్రాధాన్యత",
    col_status: "స్థితి",
    col_content: "కంటెంట్",
    items: "అంశాలు",
    no_campaigns: "ఇంకా ప్రచారాలు లేవు. మీ మొదటి ప్రచారాన్ని సృష్టించండి!",

    // Campaigns by status
    campaigns_by_status: "స్థితి వారీగా ప్రచారాలు",
    total: "మొత్తం",
    no_status_data: "సమాచారం లేదు",

    // Status & Priority names
    status_draft: "డ్రాఫ్ట్",
    status_active: "క్రియాశీలం",
    status_scheduled: "షెడ్యూల్ చేయబడింది",
    status_running: "నడుస్తోంది",
    status_completed: "పూర్తయింది",
    status_cancelled: "రద్దు చేయబడింది",
    priority_low: "తక్కువ",
    priority_normal: "సాధారణ",
    priority_high: "అధిక",
    priority_critical: "కీలకమైన",

    // Tones
    tone_formal: "అధికారిక",
    tone_friendly: "స్నేహపూర్వక",
    tone_urgent: "అత్యవసరం",
    tone_informative: "సమాచారపూర్వక",
    tone_empathetic: "సానుభూతిపూర్వక",

    // AI generator widget
    ai_widget_title: "AI కంటెంట్ జనరేటర్",
    powered_by_llm: "LLM మద్దతుతో",
    topic_placeholder: "మీ ప్రచార అంశాన్ని నమోదు చేయండి",
    topic_example: "ఉదా. డెంగ్యూ నివారణ అవగాహన",
    tone: "టోన్",
    language: "భాష",
    generate_content: "కంటెంట్‌ను సృష్టించండి",
    generating: "సృష్టిస్తోంది...",
    copied: "కాపీ చేయబడింది!",
    copy: "కాపీ",

    // Audience Segments
    audience_segments: "ప్రేక్షకుల విభాగాలు",
    manage: "నిర్వహించండి",
    members: "సభ్యులు",
    dynamic_segment: "డైనమిక్ విభాగం",

    // Analytics Page
    analytics_title: "ప్రచార విశ్లేషణలు",
    analytics_subtitle: "మీ ప్రచార పనితీరు మరియు ఎంగేజ్‌మెంట్ కొలమానాలను పర్యవేక్షించండి.",
    total_delivered: "మొత్తం పంపబడిన సందేశాలు",
    open_rate: "ఓపెన్ రేటు",
    click_through_rate: "క్లిక్-త్రూ రేటు",
    engagement_rate: "ఎంగేజ్‌మెంట్ రేటు",
    engagement_trend: "ఎంగేజ్‌మెంట్ ట్రెండ్",
    performance_by_channel: "ఛానెల్ వారీ పనితీరు",
    language_wise_reach: "భాషావారీ రీచ్",
    audience_engagement: "ప్రేక్షకుల ఎంగేజ్‌మెంట్",
    engaged: "నిమగ్నమై ఉన్నారు",
    active: "క్రియాశీలం",
    inactive: "నిష్క్రియం",
    time_range_7d: "గత 7 రోజులు",
    time_range_30d: "గత 30 రోజులు",
    time_range_all: "మొత్తం సమయం",
  },
};

export function getTranslation(lang: string, key: string): string {
  const language = (lang in TRANSLATIONS ? lang : "English") as SupportedLanguage;
  const dict = TRANSLATIONS[language] || TRANSLATIONS["English"];
  return dict[key] || TRANSLATIONS["English"][key] || key;
}
