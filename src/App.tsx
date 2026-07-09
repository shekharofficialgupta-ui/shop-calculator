import { useState, useEffect } from "react";
import { 
  Home as HomeIcon, 
  Receipt, 
  Calculator, 
  Percent, 
  Tag, 
  ShoppingBag, 
  CalendarDays, 
  Ruler, 
  TrendingUp, 
  CreditCard, 
  Notebook, 
  Settings as SettingsIcon,
  Plus,
  Store,
  Calendar,
  IndianRupee,
  ChevronRight,
  Sparkles,
  Info,
  Lock,
  Delete,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { useCurrency, CurrencyType } from "./CurrencyContext";
import { getTranslation } from "./translations";

// Import all 8 utility screens
import SmartCalculator from "./components/SmartCalculator";
import BillMaker from "./components/BillMaker";
import GstCalculator from "./components/GstCalculator";
import DiscountCalculator from "./components/DiscountCalculator";
import ShoppingList from "./components/ShoppingList";
import EmiCalculator from "./components/EmiCalculator";
import NotebookScreen from "./components/Notebook";
import SettingsConfig from "./components/SettingsConfig";
import { Onboarding, resetOnboarding } from "./components/Onboarding";

export default function App() {
  const { formatInr } = useCurrency();
  const currency = "INR";

  // Local language state
  const [language, setLanguage] = useState(() => localStorage.getItem("preferred_language") || "en");

  // App Lock state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const isPinEnabled = localStorage.getItem("shop_app_pin_enabled") === "true";
    const pin = localStorage.getItem("shop_app_pin");
    return !isPinEnabled || !pin;
  });
  const [enteredPin, setEnteredPin] = useState("");
  const [lockScreenError, setLockScreenError] = useState("");

  const [showPinChars, setShowPinChars] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(() => {
    const val = Number(localStorage.getItem("shop_app_wrong_pin_attempts") || "0");
    return isNaN(val) ? 0 : val;
  });
  const [lockoutExpiry, setLockoutExpiry] = useState(() => {
    const val = Number(localStorage.getItem("shop_app_lockout_expiry") || "0");
    return isNaN(val) ? 0 : val;
  });
  const [lockoutLevel, setLockoutLevel] = useState(() => {
    const val = Number(localStorage.getItem("shop_app_lockout_level") || "0");
    return isNaN(val) ? 0 : val;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (lockoutExpiry > Date.now()) {
      const calcSecs = Math.max(0, Math.ceil((lockoutExpiry - Date.now()) / 1000));
      setSecondsLeft(calcSecs);
    } else {
      setSecondsLeft(0);
    }
  }, [lockoutExpiry]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      const calcSecs = Math.max(0, Math.ceil((lockoutExpiry - Date.now()) / 1000));
      setSecondsLeft(calcSecs);
      if (calcSecs <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, lockoutExpiry]);

  const handlePinKeypad = (num: string) => {
    if (secondsLeft > 0) return;
    setLockScreenError("");
    const newPin = enteredPin + num;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
      
      // If reached 4 digits, verify PIN
      if (newPin.length === 4) {
        const correctPin = localStorage.getItem("shop_app_pin") || "";
        if (newPin === correctPin) {
          setIsUnlocked(true);
          // Reset lockout tracking on success
          localStorage.removeItem("shop_app_wrong_pin_attempts");
          localStorage.removeItem("shop_app_lockout_level");
          localStorage.removeItem("shop_app_lockout_expiry");
          setWrongAttempts(0);
          setLockoutLevel(0);
          setLockoutExpiry(0);
        } else {
          const nextAttempts = wrongAttempts + 1;
          if (nextAttempts >= 5) {
            // Trigger lockout
            // level 0: 1 min, level 1: 2 min, level >= 2: 5 min
            const duration = lockoutLevel === 0 ? 60 : lockoutLevel === 1 ? 120 : 300;
            const expiry = Date.now() + duration * 1000;
            
            localStorage.setItem("shop_app_lockout_expiry", expiry.toString());
            localStorage.setItem("shop_app_lockout_level", (lockoutLevel + 1).toString());
            localStorage.setItem("shop_app_wrong_pin_attempts", "0");
            
            setLockoutExpiry(expiry);
            setLockoutLevel((prev) => prev + 1);
            setWrongAttempts(0);
            setEnteredPin("");
            
            const errMsg = language === "hi" 
              ? `बहुत ज़्यादा गलत प्रयास! कृपया ${duration / 60} मिनट बाद फिर से प्रयास करें।`
              : `Too many incorrect attempts! Please try again in ${duration / 60} minute(s).`;
            setLockScreenError(errMsg);
          } else {
            localStorage.setItem("shop_app_wrong_pin_attempts", nextAttempts.toString());
            setWrongAttempts(nextAttempts);
            
            const remaining = 5 - nextAttempts;
            const errMsg = language === "hi"
              ? `गलत PIN! आपके पास ${remaining} प्रयास और बचे हैं।`
              : `Incorrect PIN! You have ${remaining} attempt(s) remaining.`;
            setLockScreenError(errMsg);
            
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            setTimeout(() => {
              setEnteredPin("");
            }, 350);
          }
        }
      }
    }
  };

  const handlePinBackspace = () => {
    if (secondsLeft > 0) return;
    setLockScreenError("");
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  // Local states for step 1 & 2
  const [shopName, setShopName] = useState(() => localStorage.getItem("shop_app_shop_name") || "");
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [onboardingKey, setOnboardingKey] = useState(0);

  const handleResetOnboarding = () => {
    resetOnboarding();
    setOnboardingKey((prev) => prev + 1);
    setSelectedModule(null);
    setActiveTab("Home");
  };

  // Auto-persist shop name to localStorage
  useEffect(() => {
    localStorage.setItem("shop_app_shop_name", shopName);
  }, [shopName]);

  // Monitor global focus events to detect when an input/textarea/select is active (virtual keyboard proxy)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT")
        ) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Sync activeTab and selectedModule
  useEffect(() => {
    if (activeTab === "Home") {
      setSelectedModule(null);
    } else if (activeTab === "BillMaker") {
      setSelectedModule("BillMaker");
    } else if (activeTab === "Calc") {
      setSelectedModule("SmartCalculator");
    } else if (activeTab === "QuickAdd") {
      setSelectedModule("BillMaker");
    } else if (activeTab === "More") {
      const validMoreModules = ["Settings", "GstCalculator", "DiscountCalculator", "ShoppingList", "EmiCalculator", "Notebook"];
      if (!validMoreModules.includes(selectedModule || "")) {
        setSelectedModule("Settings");
      }
    }
  }, [activeTab, selectedModule]);
  
  const [billTrigger, setBillTrigger] = useState(0);
  const [shoppingTrigger, setShoppingTrigger] = useState(0);

  const [rawSalesToday, setRawSalesToday] = useState(0);
  const [billsToday, setBillsToday] = useState(0);
  const [rawShoppingEstimate, setRawShoppingEstimate] = useState(0);
  const [pendingItemsCount, setPendingItemsCount] = useState(0);

  // Sync / Calculate Today's Sales and Bills Made
  useEffect(() => {
    const savedHistory = localStorage.getItem("bill_invoice_history");
    const todayStr = new Date().toLocaleDateString();
    
    if (savedHistory) {
      try {
        const invoices = JSON.parse(savedHistory);
        const todaysInvoices = invoices.filter((inv: any) => inv.date === todayStr);
        
        const salesSum = todaysInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.grandTotal) || 0), 0);
        setRawSalesToday(salesSum);
        setBillsToday(todaysInvoices.length);
      } catch (e) {
        setRawSalesToday(0);
        setBillsToday(0);
      }
    } else {
      setRawSalesToday(0);
      setBillsToday(0);
    }
  }, [billTrigger]);

  // Sync / Calculate Shopping Estimate
  useEffect(() => {
    const savedList = localStorage.getItem("shop_shopping_list");
    if (savedList) {
      try {
        const list = JSON.parse(savedList);
        const pendingItems = list.filter((item: any) => !item.bought);
        const estimateSum = pendingItems.reduce(
          (sum: number, item: any) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
          0
        );
        setRawShoppingEstimate(estimateSum);
        setPendingItemsCount(pendingItems.length);
      } catch (e) {
        setRawShoppingEstimate(0);
        setPendingItemsCount(0);
      }
    } else {
      // Default initial list pending sum (starts at 0 for fresh user)
      setRawShoppingEstimate(0);
      setPendingItemsCount(0);
    }
  }, [shoppingTrigger, activeTab, selectedModule]);

  // Currency Converter helper for display (large INR number becomes small foreign currency)
  const formatAmount = (inrAmount: number) => {
    return formatInr(inrAmount, currency === "INR" ? 0 : 2);
  };

  if (!isUnlocked) {
    const isKeypadDisabled = secondsLeft > 0;
    return (
      <div className="min-h-screen bg-[#0A0A14] text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-xs w-full space-y-5 text-center animate-fadeIn">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-violet-400/30">
              <Lock className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">
                {getTranslation("appTitle", language)}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                {getTranslation("offlineHub", language)}
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-[#0F0F23] border border-gray-800/60 p-5 rounded-2xl shadow-xl">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("enterPin", language)}
              </h2>
              <p className="text-[10px] text-gray-500">
                {language === "hi" ? "ऐप सुरक्षित है" : "Application Secured"}
              </p>
            </div>

            {/* Cooldown Timer Alert */}
            {secondsLeft > 0 && (
              <div className="bg-red-950/25 border border-red-900/35 rounded-xl p-3 space-y-1 text-center animate-fadeIn">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                  {language === "hi" ? "बहुत ज़्यादा गलत प्रयास!" : "TOO MANY INCORRECT ATTEMPTS!"}
                </p>
                <p className="text-[9px] text-gray-400">
                  {language === "hi" 
                    ? "सुरक्षा कारणों से ऐप अस्थाई रूप से लॉक है।" 
                    : "The app has been temporarily locked for security."}
                </p>
                <div className="flex items-center justify-center gap-1.5 py-1 text-red-400 font-mono font-extrabold text-base tracking-widest animate-pulse">
                  <span>{Math.floor(secondsLeft / 60).toString().padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{(secondsLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            )}

            {/* Digit Indicators with eye toggle */}
            <div className="flex items-center justify-center gap-3.5 py-1">
              <div className="flex gap-2.5">
                {[0, 1, 2, 3].map((index) => {
                  const isEntered = enteredPin.length > index;
                  const char = isEntered && showPinChars ? enteredPin[index] : "";
                  return (
                    <div
                      key={index}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-sm transition-all duration-150 ${
                        isEntered
                          ? "bg-violet-950/40 border-violet-500/70 text-violet-300 scale-105 shadow-[0_0_10px_rgba(167,139,250,0.3)]"
                          : "bg-transparent border-gray-800 text-gray-600"
                      }`}
                    >
                      {char ? char : (isEntered ? "•" : "")}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowPinChars(!showPinChars)}
                disabled={isKeypadDisabled}
                className={`p-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-gray-200 active:scale-95 transition-all cursor-pointer focus:outline-none ${isKeypadDisabled ? "opacity-20 cursor-not-allowed" : ""}`}
                title={showPinChars ? "Hide PIN" : "Show PIN"}
              >
                {showPinChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {lockScreenError && (
              <p className="text-[10px] text-red-400 font-semibold animate-pulse max-w-[200px] mx-auto">
                {lockScreenError}
              </p>
            )}

            {/* Premium Touch Grid Keypad */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isKeypadDisabled}
                  onClick={() => !isKeypadDisabled && handlePinKeypad(num)}
                  className={`w-12 h-12 rounded-full border text-white text-sm font-bold flex items-center justify-center active:scale-90 transition-all font-mono ${
                    isKeypadDisabled 
                      ? "bg-gray-950/30 border-gray-900/40 text-gray-700 cursor-not-allowed opacity-30" 
                      : "bg-gray-900/60 hover:bg-gray-800 border border-gray-800/40 cursor-pointer"
                  }`}
                >
                  {num}
                </button>
              ))}
              
              <div className="w-12 h-12" />

              <button
                type="button"
                disabled={isKeypadDisabled}
                onClick={() => !isKeypadDisabled && handlePinKeypad("0")}
                className={`w-12 h-12 rounded-full border text-white text-sm font-bold flex items-center justify-center active:scale-90 transition-all font-mono ${
                  isKeypadDisabled 
                    ? "bg-gray-950/30 border-gray-900/40 text-gray-700 cursor-not-allowed opacity-30" 
                    : "bg-gray-900/60 hover:bg-gray-800 border border-gray-800/40 cursor-pointer"
                }`}
              >
                0
              </button>

              <button
                type="button"
                disabled={isKeypadDisabled}
                onClick={() => !isKeypadDisabled && handlePinBackspace()}
                className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                  isKeypadDisabled
                    ? "bg-gray-950/30 border-gray-900/40 text-gray-700 cursor-not-allowed opacity-30"
                    : "bg-red-950/20 hover:bg-red-900/30 border border-red-900/20 text-red-400 cursor-pointer"
                }`}
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] text-gray-600 font-mono">
              {getTranslation("madeInIndia", language)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A14] text-gray-100 font-sans flex flex-col selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* HEADER BAR */}
      {selectedModule !== "SmartCalculator" && selectedModule !== "BillMaker" && selectedModule !== "GstCalculator" && selectedModule !== "DiscountCalculator" && selectedModule !== "ShoppingList" && selectedModule !== "EmiCalculator" && selectedModule !== "Notebook" && (
        <header className="sticky top-0 z-50 bg-[#0A0A14]/90 backdrop-blur-md border-b border-gray-900/60 px-3 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            
            {/* Logo & App Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.15)]">
                <Store className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">{getTranslation("appTitle", language)}</h1>
                <p className="text-[9px] text-gray-500 font-mono tracking-wider">{getTranslation("offlineHub", language)}</p>
              </div>
            </div>

            {/* Shop Name Editor & Currency Indicator */}
            {selectedModule !== "SettingsConfig" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-900/40 border border-gray-800 px-2 py-1 rounded-md">
                  {isEditingShop ? (
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      onBlur={() => setIsEditingShop(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setIsEditingShop(false);
                      }}
                      autoFocus
                      className="bg-transparent text-[11px] font-medium text-white focus:outline-none w-28"
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingShop(true)}
                      className="text-[11px] font-medium text-gray-300 hover:text-violet-400 transition-colors flex items-colors gap-1"
                    >
                      <Store className="w-3 h-3 text-gray-400" />
                      <span>{shopName || getTranslation("setShopName", language)}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-3 pb-24">

        {selectedModule ? (
          <div className="animate-fadeIn">
            {/* Elegant Back Navigation Bar */}
            {selectedModule !== "SmartCalculator" && selectedModule !== "BillMaker" && selectedModule !== "EmiCalculator" && (
              <div className="max-w-md mx-auto mb-4 flex items-center justify-between border-b border-gray-900/45 pb-2">
                <button 
                  onClick={() => { setSelectedModule(null); setActiveTab("Home"); }}
                  className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1.5 font-bold py-1 px-3 rounded-lg bg-gray-900 border border-gray-800 transition-all hover:border-gray-700 active:scale-95 cursor-pointer"
                >
                  {getTranslation("backToDashboard", language)}
                </button>
                <span className="text-[9px] font-mono text-gray-600 tracking-wider">{getTranslation("gatewayLabel", language)}</span>
              </div>
            )}

            {selectedModule === "BillMaker" && (
              <div className="max-w-md mx-auto mb-3 flex items-center justify-between border-b border-gray-900/45 pb-2 gap-2">
                <button 
                  onClick={() => { setSelectedModule(null); setActiveTab("Home"); }}
                  className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1.5 font-bold py-1 px-2.5 rounded-lg bg-gray-900 border border-gray-800 transition-all hover:border-gray-700 active:scale-95 cursor-pointer shrink-0"
                >
                  {getTranslation("backToDashboard", language)}
                </button>
                <span className="text-[9px] font-mono text-gray-600 tracking-wider">{getTranslation("gatewayLabel", language)}</span>
              </div>
            )}

            {/* Selected Component */}
            {selectedModule === "SmartCalculator" && (
              <SmartCalculator 
                language={language}
                onBack={() => { 
                  setSelectedModule(null); 
                  setActiveTab("Home"); 
                }} 
              />
            )}
            {selectedModule === "BillMaker" && (
              <BillMaker 
                language={language}
                shopName={shopName} 
                onHistoryChanged={() => setBillTrigger((prev) => prev + 1)} 
              />
            )}
            {selectedModule === "GstCalculator" && <GstCalculator language={language} />}
            {selectedModule === "DiscountCalculator" && <DiscountCalculator language={language} />}
            {selectedModule === "ShoppingList" && (
              <ShoppingList 
                language={language}
                onListChanged={() => setShoppingTrigger((prev) => prev + 1)} 
              />
            )}
            {selectedModule === "EmiCalculator" && (
              <EmiCalculator 
                language={language}
                onBack={() => { 
                  setSelectedModule(null); 
                  setActiveTab("Home"); 
                }} 
              />
            )}
            {selectedModule === "Notebook" && <NotebookScreen language={language} />}
            {selectedModule === "Settings" && (
              <SettingsConfig 
                language={language}
                onLanguageChange={setLanguage}
                shopName={shopName} 
                setShopName={setShopName} 
                onResetOnboarding={handleResetOnboarding}
              />
            )}
          </div>
        ) : (
          <>
            {/* HERO GREETING SECTION */}
            <section className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1">
                  {getTranslation("welcomeUser", language)}
                </h3>
                <span className="text-[11px] text-gray-400">•</span>
                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Sun, 05 July 2026
                </span>
              </div>

              {/* Quick Stats Summary Row */}
              <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{getTranslation("dbSyncActive", language)}</span>
              </div>
            </section>

            {/* SALES SUMMARY CARDS GRID (2 Columns on mobile, 3 Columns on desktop for high density) */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4.5">
              
              {/* Card 1: Today's Revenue */}
              <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 hover:border-violet-500/30 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all"></div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">{getTranslation("todaysSalesCard", language)}</span>
                  <div className="w-6 h-6 rounded bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <IndianRupee className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-base font-bold font-mono text-white tracking-tight">
                  {formatAmount(rawSalesToday)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
                  <span className="text-emerald-400 font-medium font-mono">↑ 12.4%</span>
                  <span>{getTranslation("vsYesterday", language)}</span>
                </div>
              </div>

              {/* Card 2: Bills Count */}
              <div 
                onClick={() => { setSelectedModule("BillMaker"); setActiveTab("BillMaker"); }}
                className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 hover:border-cyan-500/30 transition-all relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{getTranslation("billsMadeCard", language)}</span>
                  <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Receipt className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-base font-bold font-mono text-white tracking-tight">
                  {billsToday} {getTranslation("receiptsCount", language)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
                  <span className="text-cyan-400 font-medium">{getTranslation("autoPdfPrint", language)}</span>
                  <span>• 100% Offline</span>
                </div>
              </div>

              {/* Card 3: Shopping Estimate (Takes full row on small screens, continues 3rd col on desktop) */}
              <div 
                onClick={() => { setSelectedModule("ShoppingList"); setActiveTab("More"); }}
                className="col-span-2 md:col-span-1 bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 hover:border-pink-500/30 transition-all relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all"></div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded">{getTranslation("shoppingEstCard", language)}</span>
                  <div className="w-6 h-6 rounded bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-base font-bold font-mono text-white tracking-tight">
                  {formatAmount(rawShoppingEstimate)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
                  <span className="text-pink-400 font-medium">{pendingItemsCount} {getTranslation("itemsPending", language)}</span>
                  <span>• {getTranslation("autoEstimate", language)}</span>
                </div>
              </div>

            </section>

            {/* QUICK ACCESS TOOLS SECTION */}
            <section className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight uppercase">{getTranslation("quickAccessTitle", language)}</h4>
                  <p className="text-[10px] text-gray-500">{getTranslation("quickAccessDesc", language)}</p>
                </div>
                <span className="text-[9px] font-mono text-gray-400 border border-gray-850 px-2 py-0.5 rounded-full">
                  {getTranslation("modulesCount", language)}
                </span>
              </div>

              {/* GRID OF 8 TOOLS - 2 columns on mobile, 3 on tablet, 4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                
                {/* Tool 1: Smart Calculator */}
                <div 
                  onClick={() => { setSelectedModule("SmartCalculator"); setActiveTab("Calc"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-violet-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(124,58,237,0.12)]">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-violet-400 bg-violet-400/10 px-1.5 py-0.2 rounded">Calc</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-violet-400 transition-colors">{getTranslation("module1Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module1Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module01", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 2: Bill Maker */}
                <div 
                  onClick={() => { setSelectedModule("BillMaker"); setActiveTab("BillMaker"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-cyan-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(14,116,144,0.12)]">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.2 rounded">Bill</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-cyan-400 transition-colors">{getTranslation("module2Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module2Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module02", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 3: GST Calculator */}
                <div 
                  onClick={() => { setSelectedModule("GstCalculator"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-emerald-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(4,120,87,0.12)]">
                      <Percent className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded">GST</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{getTranslation("module3Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module3Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module03", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 4: Discount Calculator */}
                <div 
                  onClick={() => { setSelectedModule("DiscountCalculator"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-amber-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(180,83,9,0.12)]">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">Offer</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-amber-400 transition-colors">{getTranslation("module4Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module4Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module04", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 5: Shopping List */}
                <div 
                  onClick={() => { setSelectedModule("ShoppingList"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-pink-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(190,24,93,0.12)]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-pink-400 bg-pink-400/10 px-1.5 py-0.2 rounded">List</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-pink-400 transition-colors">{getTranslation("module5Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module5Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module05", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-pink-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 6: EMI Calculator */}
                <div 
                  onClick={() => { setSelectedModule("EmiCalculator"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-blue-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(59,130,246,0.12)]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.2 rounded">EMI</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors">{getTranslation("module6Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module6Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module06", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 7: Notebook */}
                <div 
                  onClick={() => { setSelectedModule("Notebook"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-rose-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(244,63,94,0.12)]">
                      <Notebook className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-rose-400 bg-rose-400/10 px-1.5 py-0.2 rounded">Notes</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-rose-400 transition-colors">{getTranslation("module7Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module7Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module07", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-rose-400 transition-colors" />
                  </div>
                </div>

                {/* Tool 8: Settings */}
                <div 
                  onClick={() => { setSelectedModule("Settings"); setActiveTab("More"); }}
                  className="bg-[#0F0F23] border border-gray-900/50 hover:border-slate-500/30 rounded-xl p-3 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_8px_rgba(100,116,139,0.12)]">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-400/10 px-1.5 py-0.2 rounded">Setup</span>
                  </div>
                  <h5 className="text-[11px] font-semibold text-white tracking-tight group-hover:text-slate-400 transition-colors">{getTranslation("module8Name", language)}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{getTranslation("module8Desc", language)}</p>
                  <div className="mt-2.5 pt-1.5 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                    <span>{getTranslation("module08", language)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>

              </div>
            </section>
          </>
        )}
      </main>

      {/* STICKY BOTTOM NAVIGATION */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-[#0A0A14]/90 backdrop-blur-lg border-t border-gray-800/50 px-4 py-2.5 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 ${isInputFocused ? "max-md:translate-y-24 max-md:opacity-0 max-md:pointer-events-none" : "translate-y-0"}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Tab 1: Home */}
          <button 
            onClick={() => { setSelectedModule(null); setActiveTab("Home"); }}
            className="flex flex-col items-center gap-1 cursor-pointer transition-all relative py-1"
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "Home" ? "text-violet-400" : "text-gray-500 hover:text-gray-300"}`}>
              <HomeIcon className="w-5.5 h-5.5" />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${activeTab === "Home" ? "text-violet-400" : "text-gray-500"}`}>{getTranslation("homeTab", language)}</span>
            {activeTab === "Home" && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-1 w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
              />
            )}
          </button>

          {/* Tab 2: Bill Maker */}
          <button 
            onClick={() => { setSelectedModule("BillMaker"); setActiveTab("BillMaker"); }}
            className="flex flex-col items-center gap-1 cursor-pointer transition-all relative py-1"
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "BillMaker" ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>
              <Receipt className="w-5.5 h-5.5" />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${activeTab === "BillMaker" ? "text-cyan-400" : "text-gray-500"}`}>{getTranslation("billMakerTab", language)}</span>
            {activeTab === "BillMaker" && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(14,116,144,0.8)]"
              />
            )}
          </button>

          {/* Center Floating Action Button (+): Launch Quick Bill */}
          <div className="relative -top-5">
            <button 
              onClick={() => { setSelectedModule("BillMaker"); setActiveTab("QuickAdd"); }}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.5)] border-2 border-[#0A0A14] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-6.5 h-6.5 text-white" />
            </button>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-400 font-medium whitespace-nowrap">
              {getTranslation("quickBillBtn", language)}
            </span>
          </div>

          {/* Tab 3: Calculator */}
          <button 
            onClick={() => { setSelectedModule("SmartCalculator"); setActiveTab("Calc"); }}
            className="flex flex-col items-center gap-1 cursor-pointer transition-all relative py-1"
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "Calc" ? "text-violet-400" : "text-gray-500 hover:text-gray-300"}`}>
              <Calculator className="w-5.5 h-5.5" />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${activeTab === "Calc" ? "text-violet-400" : "text-gray-500"}`}>{getTranslation("calculatorTab", language)}</span>
            {activeTab === "Calc" && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-1 w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
              />
            )}
          </button>

          {/* Tab 4: More Tools */}
          <button 
            onClick={() => { setSelectedModule("Settings"); setActiveTab("More"); }}
            className="flex flex-col items-center gap-1 cursor-pointer transition-all relative py-1"
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "More" ? "text-pink-400" : "text-gray-500 hover:text-gray-300"}`}>
              <Sparkles className="w-5.5 h-5.5" />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${activeTab === "More" ? "text-pink-400" : "text-gray-500"}`}>{getTranslation("moreTab", language)}</span>
            {activeTab === "More" && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-1 w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(190,24,93,0.8)]"
              />
            )}
          </button>

        </div>
      </nav>

      <Onboarding key={onboardingKey} language={language} selectedModule={selectedModule} />
    </div>
  );
}
