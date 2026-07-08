import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle, Eye, RefreshCw } from "lucide-react";
import { getTranslation } from "../translations";

// Onboarding localStorage Keys
const ONBOARDING_WELCOME_KEY = "onboarding_completed_v1";
const TOUR_SEEN_PREFIX = "tour_seen_";

interface OnboardingProps {
  key?: any;
  language: string;
  selectedModule: string | null;
  onResetAll?: () => void;
}

export interface TourStep {
  target: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
}

const MODULE_TOURS: Record<string, TourStep[]> = {
  BillMaker: [
    {
      target: "#bill-customer-info",
      titleEn: "Customer & Invoice Info",
      titleHi: "ग्राहक और इनवॉइस की जानकारी",
      contentEn: "Enter client name and invoice number here. Defaults to Walk-in customer for quick billing.",
      contentHi: "यहाँ ग्राहक का नाम और इनवॉइस नंबर डालें। तुरंत बिलिंग के लिए यह पहले से वॉक-इन ग्राहक पर सेट रहता है।"
    },
    {
      target: "#bill-add-item-btn",
      titleEn: "Add Invoice Items",
      titleHi: "बिल में सामान जोड़ें",
      contentEn: "Tap here to add items to your bill. Define names, rates, and quantities easily.",
      contentHi: "अपने बिल में सामान जोड़ने के लिए यहाँ क्लिक करें। नाम, दर और मात्रा आसानी से सेट करें।"
    },
    {
      target: "#bill-action-row",
      titleEn: "Save & Share PDF Bill",
      titleHi: "सहेजें और PDF शेयर करें",
      contentEn: "Click to instantly compile a professional PDF, save it locally, or share directly via WhatsApp.",
      contentHi: "तुरंत एक पेशेवर PDF बिल बनाने, उसे स्थानीय रूप से सहेजने या व्हाट्सएप पर सीधे शेयर करने के लिए क्लिक करें।"
    }
  ],
  SmartCalculator: [
    {
      target: "#calc-display",
      titleEn: "Interactive Live Display",
      titleHi: "इंटरैक्टिव लाइव डिस्प्ले",
      contentEn: "Shows your mathematical expression with live calculated results as you type.",
      contentHi: "आपके टाइप करते ही रीयल-टाइम में परिकलित परिणाम और गणितीय समीकरण दिखाता है।"
    },
    {
      target: "#calc-history-btn",
      titleEn: "Calculation Tape History",
      titleHi: "गणना का इतिहास",
      contentEn: "Tap this clock button to view, recall, or clear your past calculations tape anytime.",
      contentHi: "अपनी पिछली सभी गणनाओं को देखने, उपयोग करने या साफ करने के लिए इस घड़ी आइकन पर टैप करें।"
    }
  ],
  ShoppingList: [
    {
      target: "#shopping-stats-card",
      titleEn: "Shopping Progress Tracker",
      titleHi: "शॉपिंग प्रोग्रेस ट्रैकर",
      contentEn: "Track your shopping completion rate, total pending list estimate, and active budget limits.",
      contentHi: "अपनी खरीदारी की प्रगति दर, कुल पेंडिंग सामानों का अनुमान और सक्रिय बजट सीमा को यहाँ ट्रैक करें।"
    },
    {
      target: "#shopping-budget-box",
      titleEn: "Set Budget Limit",
      titleHi: "बजट सीमा सेट करें",
      contentEn: "Click the edit icon to define your maximum budget limit and avoid overspending on inventory.",
      contentHi: "अपनी अधिकतम बजट सीमा निर्धारित करने और फालतू खर्च से बचने के लिए एडिट पेंसिल आइकन पर क्लिक करें।"
    },
    {
      target: "#shopping-add-panel",
      titleEn: "Add Checklist Items",
      titleHi: "चेकलिस्ट में सामान जोड़ें",
      contentEn: "Quickly enter item names, estimated prices, and quantities to populate your checklist.",
      contentHi: "अपनी चेकलिस्ट तैयार करने के लिए सामान का नाम, अनुमानित मूल्य और मात्रा तुरंत दर्ज करें।"
    }
  ],
  Notebook: [
    {
      target: "#notebook-search-row",
      titleEn: "Search & Create Memos",
      titleHi: "खोजें और मेमो बनाएं",
      contentEn: "Search through your saved records or click '+' to log new Udhaar accounts or Inventory notes.",
      contentHi: "अपने सहेजे गए रिकॉर्ड खोजें या नया उधारी खाता या इन्वेंट्री नोट्स लिखने के लिए '+' पर क्लिक करें।"
    },
    {
      target: "#notebook-tags-row",
      titleEn: "Category Filters",
      titleHi: "श्रेणी फ़िल्टर",
      contentEn: "Instantly filter your memos using dedicated tabs like Udhaar Log, Inventory, or Reminders.",
      contentHi: "उधारी लॉग, इन्वेंट्री, या रिमाइंडर्स जैसी श्रेणियों का उपयोग करके तुरंत अपने नोट्स फ़िल्टर करें।"
    }
  ],
  EmiCalculator: [
    {
      target: "#emi-loan-card",
      titleEn: "Loan Parameters",
      titleHi: "ऋण की जानकारी",
      contentEn: "Drag the sliders or type precise values for Loan Amount, Interest, and Loan Tenure.",
      contentHi: "लोन राशि, ब्याज दर और लोन अवधि की जानकारी स्लाइड करें या सीधे टाइप करके भरें।"
    },
    {
      target: "#emi-results-card",
      titleEn: "Instant EMI Breakdown",
      titleHi: "मासिक ईएमआई और ब्याज सारांश",
      contentEn: "See your calculated Monthly EMI, total interest payable, and absolute total repayment sum.",
      contentHi: "यहाँ अपनी मासिक ईएमआई, कुल देय ब्याज और अंतिम भुगतान होने वाली कुल राशि का पूरा विवरण देखें।"
    }
  ]
};

export function Onboarding({ language, selectedModule, onResetAll }: OnboardingProps) {
  // Welcome Modal Slides State
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeSlide, setWelcomeSlide] = useState(0);

  // Per-Module Interactive Tour State
  const [activeTourModule, setActiveTourModule] = useState<string | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: "none" });
  const [tooltipPos, setTooltipPos] = useState<{ top?: number; bottom?: number; left: number; position: "above" | "below" | "center" }>({ left: 0, position: "center" });
  
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check and initialize Welcome Screen
  useEffect(() => {
    const welcomeSeen = localStorage.getItem(ONBOARDING_WELCOME_KEY);
    if (!welcomeSeen) {
      setShowWelcome(true);
    }
  }, []);

  // Monitor module changes to trigger per-module tour
  useEffect(() => {
    if (!selectedModule || showWelcome) {
      setActiveTourModule(null);
      return;
    }

    const steps = MODULE_TOURS[selectedModule];
    if (steps && steps.length > 0) {
      const tourSeen = localStorage.getItem(`${TOUR_SEEN_PREFIX}${selectedModule}`);
      if (!tourSeen) {
        // Start tour for this module
        setActiveTourModule(selectedModule);
        setTourStepIndex(0);
      }
    } else {
      setActiveTourModule(null);
    }
  }, [selectedModule, showWelcome]);

  // Compute Highlight & Tooltip Position when tour step changes
  useEffect(() => {
    if (!activeTourModule) return;
    
    const steps = MODULE_TOURS[activeTourModule];
    if (!steps || !steps[tourStepIndex]) return;

    const updatePosition = () => {
      const step = steps[tourStepIndex];
      const element = document.querySelector(step.target);

      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Element highlight border coordinates
        setHighlightStyle({
          position: "fixed",
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          zIndex: 9999,
          borderRadius: "12px",
          pointerEvents: "none",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 15px rgba(244, 63, 94, 0.8)",
          border: "2px solid #F43F5E",
          transition: "all 0.3s ease-in-out",
        });

        // Determine Tooltip Placement (Above or Below target element)
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const tooltipWidth = Math.min(320, window.innerWidth - 24);
        
        // Horizontal alignment (bound it inside window margins)
        let leftPos = rect.left + (rect.width - tooltipWidth) / 2;
        leftPos = Math.max(12, Math.min(leftPos, window.innerWidth - tooltipWidth - 12));

        if (spaceBelow > 180) {
          // Place below
          setTooltipPos({
            top: rect.bottom + 12,
            left: leftPos,
            position: "below"
          });
        } else if (spaceAbove > 180) {
          // Place above
          setTooltipPos({
            bottom: window.innerHeight - rect.top + 12,
            left: leftPos,
            position: "above"
          });
        } else {
          // Center as fallback
          setTooltipPos({
            left: (window.innerWidth - tooltipWidth) / 2,
            position: "center"
          });
        }
      } else {
        // Element not found/rendered yet, render center of screen
        setHighlightStyle({ display: "none" });
        setTooltipPos({
          left: (window.innerWidth - 320) / 2,
          position: "center"
        });
      }
    };

    // Delay slightly to ensure layout has compiled/rendered
    const timer = setTimeout(updatePosition, 100);

    const handleResize = () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(updatePosition, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(timer);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [activeTourModule, tourStepIndex, selectedModule]);

  // Welcome Slide Actions
  const handleNextWelcome = () => {
    if (welcomeSlide < 2) {
      setWelcomeSlide((prev) => prev + 1);
    } else {
      completeWelcome();
    }
  };

  const handlePrevWelcome = () => {
    if (welcomeSlide > 0) {
      setWelcomeSlide((prev) => prev - 1);
    }
  };

  const completeWelcome = () => {
    localStorage.setItem(ONBOARDING_WELCOME_KEY, "true");
    setShowWelcome(false);
  };

  // Tour Actions
  const handleNextTourStep = () => {
    if (!activeTourModule) return;
    const steps = MODULE_TOURS[activeTourModule];
    if (tourStepIndex < steps.length - 1) {
      setTourStepIndex((prev) => prev + 1);
    } else {
      completeModuleTour();
    }
  };

  const completeModuleTour = () => {
    if (activeTourModule) {
      localStorage.setItem(`${TOUR_SEEN_PREFIX}${activeTourModule}`, "true");
    }
    setActiveTourModule(null);
  };

  // Welcome Screens Content Data
  const welcomeSlidesData = [
    {
      titleEn: "Welcome to Smart Shop Assistant",
      titleHi: "स्मार्ट शॉप असिस्टेंट में आपका स्वागत है",
      descEn: "Digitize and organize your business like a professional! Everything works 100% offline securely on your device.",
      descHi: "अपने व्यवसाय को पेशेवर तरीके से डिजिटल और व्यवस्थित बनाएं! सब कुछ आपके डिवाइस पर सुरक्षित रूप से 100% ऑफ़लाइन काम करता है।",
      icon: <Sparkles className="w-12 h-12 text-rose-500 animate-pulse" />
    },
    {
      titleEn: "Easy PDF Billing & Notes",
      titleHi: "आसान PDF बिलिंग और नोट्स",
      descEn: "Create elegant bills instantly and share them with clients via WhatsApp. Track shop Udhaar & memos securely inside our digital notebook.",
      descHi: "तुरंत सुंदर बिल बनाएं और उन्हें व्हाट्सएप के माध्यम से ग्राहकों के साथ साझा करें। डिजिटल नोटबुक में दुकान के उधारी और मेमो को सुरक्षित रूप से ट्रैक करें।",
      icon: <HelpCircle className="w-12 h-12 text-rose-500" />
    },
    {
      titleEn: "Smart Budgets & Calculators",
      titleHi: "स्मार्ट बजट और कैलकुलेटर",
      descEn: "Perform instant math with live-updating calculators for GST, Discounts, and EMIs. Manage your inventory list using auto-calculated budgets.",
      descHi: "GST, डिस्काउंट और EMI के लिए लाइव-अपडेटिंग कैलकुलेटर के साथ त्वरित गणना करें। स्वचालित रूप से गणना किए गए बजट के साथ अपनी इन्वेंट्री सूची का प्रबंधन करें।",
      icon: <Eye className="w-12 h-12 text-rose-500" />
    }
  ];

  return (
    <>
      {/* 1. WELCOME SCREEN OVERLAY */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 bg-[#070714]/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F0F23] border border-gray-800 rounded-2xl max-w-sm w-full p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(244,63,94,0.15)] flex flex-col items-center text-center"
            >
              {/* Skip Button */}
              <button
                onClick={completeWelcome}
                className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-rose-400 py-1 px-2.5 bg-gray-900/50 hover:bg-gray-900 border border-gray-800 rounded-lg cursor-pointer transition-colors"
              >
                {language === "hi" ? "छोड़ें" : "Skip"}
              </button>

              {/* Icon Indicator */}
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shadow-inner">
                {welcomeSlidesData[welcomeSlide].icon}
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5 mb-4">
                {welcomeSlidesData.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === welcomeSlide ? "w-6 bg-rose-500" : "w-1.5 bg-gray-800"
                    }`}
                  />
                ))}
              </div>

              {/* Slide Title */}
              <h2 className="text-base font-extrabold text-white tracking-tight leading-snug mb-2.5">
                {language === "hi"
                  ? welcomeSlidesData[welcomeSlide].titleHi
                  : welcomeSlidesData[welcomeSlide].titleEn}
              </h2>

              {/* Slide Description */}
              <p className="text-[11px] text-gray-400 leading-relaxed font-normal mb-8 px-1">
                {language === "hi"
                  ? welcomeSlidesData[welcomeSlide].descHi
                  : welcomeSlidesData[welcomeSlide].descEn}
              </p>

              {/* Footer Buttons Row */}
              <div className="flex justify-between items-center w-full gap-3">
                {welcomeSlide > 0 ? (
                  <button
                    onClick={handlePrevWelcome}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-400 bg-gray-900 hover:bg-gray-850 hover:text-white border border-gray-800 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {language === "hi" ? "पीछे" : "BACK"}
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                <button
                  onClick={handleNextWelcome}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-950/20"
                >
                  {welcomeSlide === 2 ? (
                    <span>{language === "hi" ? "शुरू करें" : "GET STARTED"}</span>
                  ) : (
                    <>
                      <span>{language === "hi" ? "आगे" : "NEXT"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MODULE INTERACTIVE TOUR BACKDROP & TOOLTIP */}
      {activeTourModule && MODULE_TOURS[activeTourModule] && (
        <div className="fixed inset-0 z-[9998] pointer-events-auto">
          {/* Custom element highlight glowing box (acts as blocking backdrop cutout) */}
          <div style={highlightStyle} />

          {/* Interactive Tooltip Card */}
          <div
            style={
              tooltipPos.position === "center"
                ? {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10000,
                  }
                : {
                    position: "fixed",
                    top: tooltipPos.top,
                    bottom: tooltipPos.bottom,
                    left: tooltipPos.left,
                    zIndex: 10000,
                  }
            }
            className="w-[320px] max-w-full bg-[#0F0F23] border border-rose-500/40 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_15px_rgba(244,63,94,0.1)] pointer-events-auto animate-fadeIn"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-900/40">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-mono">
                {language === "hi"
                  ? `टूर: स्टेप ${tourStepIndex + 1}/${MODULE_TOURS[activeTourModule].length}`
                  : `Tour: Step ${tourStepIndex + 1}/${MODULE_TOURS[activeTourModule].length}`}
              </span>
              <button
                onClick={completeModuleTour}
                className="text-gray-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                title="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <h4 className="text-xs font-bold text-white tracking-tight mb-1">
              {language === "hi"
                ? MODULE_TOURS[activeTourModule][tourStepIndex].titleHi
                : MODULE_TOURS[activeTourModule][tourStepIndex].titleEn}
            </h4>

            {/* Description content */}
            <p className="text-[10px] text-gray-400 leading-relaxed font-normal mb-3.5">
              {language === "hi"
                ? MODULE_TOURS[activeTourModule][tourStepIndex].contentHi
                : MODULE_TOURS[activeTourModule][tourStepIndex].contentEn}
            </p>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={completeModuleTour}
                className="text-[9px] font-bold text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {language === "hi" ? "टूर छोड़ें" : "Skip Tour"}
              </button>

              <button
                onClick={handleNextTourStep}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-[10px] text-white font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow-md shadow-rose-950/20"
              >
                {tourStepIndex === MODULE_TOURS[activeTourModule].length - 1 ? (
                  <span>{language === "hi" ? "समझ गया" : "GOT IT!"}</span>
                ) : (
                  <>
                    <span>{language === "hi" ? "आगे" : "NEXT"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Global function to reset all onboarding flags
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_WELCOME_KEY);
  Object.keys(MODULE_TOURS).forEach((mod) => {
    localStorage.removeItem(`${TOUR_SEEN_PREFIX}${mod}`);
  });
}
