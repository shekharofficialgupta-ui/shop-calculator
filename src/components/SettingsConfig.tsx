import React, { useState } from "react";
import { 
  Settings, Store, Eye, EyeOff, RefreshCw, Check, Trash2, AlertTriangle, Globe, FileText, 
  ShoppingBag, Calculator, Notebook, Lock, Unlock, Download, Upload, Info, HelpCircle, Heart, ShieldAlert,
  Share2
} from "lucide-react";
import { getTranslation } from "../translations";

interface SettingsConfigProps {
  shopName: string;
  setShopName: (name: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onResetOnboarding: () => void;
}

export default function SettingsConfig({
  shopName,
  setShopName,
  language,
  onLanguageChange,
  onResetOnboarding,
}: SettingsConfigProps) {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tutorialToast, setTutorialToast] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({
    bill: false,
    shopping: false,
    notebook: false,
    calculator: false,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shareToast, setShareToast] = useState("");

  const handleShareApp = async () => {
    const appName = getTranslation("shareTitleText", language);
    const appUrl = window.location.origin + window.location.pathname;
    const shareMessage = `📈 *${appName}*\n\n${getTranslation("shareMessageText", language)}\n\n${getTranslation("tryAppNowText", language)} ${appUrl}`;

    let sharedSuccessfully = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: shareMessage,
          url: appUrl,
        });
        sharedSuccessfully = true;
      } catch (err: any) {
        // Gracefully handle cancellation or iframe sandbox blocking without polluting error logs
        console.warn("Navigator share was not completed or supported in this environment:", err?.message || err);
      }
    }

    // Fallback: Copy to clipboard if navigator.share failed, was canceled, or is not supported
    if (!sharedSuccessfully) {
      try {
        await navigator.clipboard.writeText(shareMessage);
        setShareToast(getTranslation("shareLinkCopied", language));
        setTimeout(() => setShareToast(""), 3500);
      } catch (err) {
        console.warn("Clipboard copy fallback failed:", err);
      }
    }
  };

  // App Lock local states
  const [isPinEnabled, setIsPinEnabled] = useState(() => {
    return localStorage.getItem("shop_app_pin_enabled") === "true";
  });
  const [currentPin, setCurrentPin] = useState(() => {
    return localStorage.getItem("shop_app_pin") || "";
  });
  const [oldPinVal, setOldPinVal] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess("");

    if (currentPin && oldPinVal !== currentPin) {
      setPinError(language === "hi" ? "पुराना PIN गलत है!" : "Incorrect Old PIN!");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setPinError(language === "hi" ? "PIN केवल 4 अंकों का होना चाहिए!" : "PIN must be exactly 4 digits!");
      return;
    }

    if (newPin !== confirmPinVal) {
      setPinError(getTranslation("pinMismatch", language));
      return;
    }

    localStorage.setItem("shop_app_pin", newPin);
    localStorage.setItem("shop_app_pin_enabled", "true");
    setCurrentPin(newPin);
    setIsPinEnabled(true);
    setPinSuccess(getTranslation("pinSaved", language));
    setOldPinVal("");
    setNewPin("");
    setConfirmPinVal("");
    setShowOldPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const handleToggleLock = () => {
    const nextState = !isPinEnabled;
    const existingPin = localStorage.getItem("shop_app_pin") || currentPin;
    if (nextState && !existingPin) {
      setPinError(language === "hi" ? "कृपया लॉक सक्षम करने से पहले एक PIN सेट करें!" : "Please set a PIN before enabling App Lock!");
      return;
    }
    // Explicitly guarantee we do not touch the stored PIN
    localStorage.setItem("shop_app_pin_enabled", nextState ? "true" : "false");
    setIsPinEnabled(nextState);
    if (existingPin) {
      setCurrentPin(existingPin);
      localStorage.setItem("shop_app_pin", existingPin);
    }
    setPinSuccess(nextState 
      ? (language === "hi" ? "ऐप लॉक सफलतापूर्वक सक्षम किया गया!" : "App Lock enabled successfully!")
      : (language === "hi" ? "ऐप लॉक सफलतापूर्वक अक्षम किया गया!" : "App Lock disabled successfully!")
    );
  };

  const handleLanguageChange = (lang: string) => {
    onLanguageChange(lang);
    localStorage.setItem("preferred_language", lang);
  };

  // Helper counts from localStorage
  const getBillMakerCount = () => {
    try {
      const saved = localStorage.getItem("bill_invoice_history");
      if (saved) return JSON.parse(saved).length;
    } catch (e) {}
    return 0;
  };

  const getShoppingListCount = () => {
    try {
      const saved = localStorage.getItem("shop_shopping_list");
      if (saved) return JSON.parse(saved).length;
    } catch (e) {}
    return 0;
  };

  const getNotebookCount = () => {
    try {
      const saved = localStorage.getItem("shop_notebook_memos");
      if (saved) return JSON.parse(saved).length;
    } catch (e) {}
    return 0;
  };

  const getCalculatorCount = () => {
    try {
      const saved = localStorage.getItem("shop_calc_history");
      if (saved) return JSON.parse(saved).length;
    } catch (e) {}
    return 0;
  };

  interface ResetOption {
    id: string;
    label: string;
    keys: string[];
    getCount: () => number;
    unit: string;
  }

  const resetOptions: ResetOption[] = [
    {
      id: "bill",
      label: getTranslation("billMakerHistory", language),
      keys: ["bill_invoice_history", "bill_gst_percent", "bill_gst_enabled", "bill_gst_is_custom", "bill_custom_gst_percent"],
      getCount: getBillMakerCount,
      unit: getTranslation("billsCountUnit", language),
    },
    {
      id: "shopping",
      label: getTranslation("module5Name", language),
      keys: ["shop_shopping_list", "shop_shopping_list_budget", "shop_shopping_list_purchase_history"],
      getCount: getShoppingListCount,
      unit: getTranslation("itemsCountUnit", language),
    },
    {
      id: "notebook",
      label: getTranslation("module7Name", language),
      keys: ["shop_notebook_memos"],
      getCount: getNotebookCount,
      unit: getTranslation("memosCountUnit", language),
    },
    {
      id: "calculator",
      label: getTranslation("calcHistory", language),
      keys: ["shop_calc_expr", "shop_calc_eq", "shop_calc_finished", "shop_calc_deg_mode", "shop_calc_memory", "shop_calc_history"],
      getCount: getCalculatorCount,
      unit: getTranslation("recordsCountUnit", language),
    },
  ];

  const handleCheckboxChange = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isAnySelected = Object.values(selectedItems).some((val) => val === true);

  const handleResetClick = () => {
    if (!isAnySelected) return;
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    resetOptions.forEach((option) => {
      if (selectedItems[option.id]) {
        option.keys.forEach((key) => {
          localStorage.removeItem(key);
        });
      }
    });

    setSelectedItems({
      bill: false,
      shopping: false,
      notebook: false,
      calculator: false,
    });

    setShowConfirmModal(false);
    setResetSuccess(true);

    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1500);
  };

  const getOptionIcon = (id: string) => {
    switch (id) {
      case "bill":
        return <FileText className="w-3.5 h-3.5 text-violet-400" />;
      case "shopping":
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
      case "notebook":
        return <Notebook className="w-3.5 h-3.5 text-rose-400" />;
      case "calculator":
        return <Calculator className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="text-gray-100 p-1 min-h-screen pb-20">
      <div className="max-w-md mx-auto space-y-2.5">
        {/* Module Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-900/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-600/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">{getTranslation("settingsTitle", language)}</h3>
              <p className="text-[8px] text-gray-500 font-mono leading-none mt-0.5">{getTranslation("module08", language)} • OFFLINE PREFERENCES</p>
            </div>
          </div>
          <span className="text-[8px] font-mono bg-emerald-400/10 text-emerald-400 px-1.5 py-0.2 rounded">
            Live Config
          </span>
        </div>

        {/* Configurations List */}
        <div className="space-y-2.5">
          
          {/* Store Name & Language Configuration */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-900/40">
              <Store className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("metadataSection", language)}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[8.5px] text-gray-400 uppercase font-bold mb-1">
                  {getTranslation("shopNameLabel", language)}
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Gupta General Store"
                  className="w-full bg-[#07070F] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-[8.5px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-violet-400" /> {getTranslation("prefLanguage", language)}
                </label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full bg-[#07070F] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/30 cursor-pointer font-medium"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
              </div>
            </div>
          </div>

          {/* APP LOCK (PIN) CONFIGURATION */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-3 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-900/40">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                  {getTranslation("appLockTitle", language)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isPinEnabled
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/25"
                    : "bg-gray-900 text-gray-500 border border-gray-800"
                }`}
              >
                {isPinEnabled ? (
                  <>
                    <Lock className="w-2.5 h-2.5" />
                    <span>ENABLED</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-2.5 h-2.5" />
                    <span>DISABLED</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[9.5px] text-gray-400 leading-relaxed space-y-1">
              <span>{getTranslation("appLockDesc", language)}</span>
              {currentPin && (
                <span className="block text-violet-400 font-semibold mt-1">
                  {language === "hi" 
                    ? "✓ आपका PIN सहेजा हुआ है। लॉक को बंद (DISABLE) करने पर भी PIN डिलीट नहीं होगा। जब आप दोबारा सक्षम करेंगे, तो यही PIN काम करेगा।"
                    : "✓ Your PIN is securely saved. Disabling the lock won't delete or reset your PIN. When enabled again, your existing PIN will be active."}
                </span>
              )}
            </p>

            {/* Set/Change PIN Sub-Form */}
            <form onSubmit={handleSavePin} className="bg-[#07070F]/50 border border-gray-800/60 rounded-xl p-2.5 space-y-2.5">
              <div className="space-y-2.5">
                {currentPin && (
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-bold mb-1">
                      {getTranslation("enterOldPin", language)}
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPin ? "text" : "password"}
                        maxLength={4}
                        pattern="\d*"
                        value={oldPinVal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setOldPinVal(val);
                        }}
                        placeholder="••••"
                        className="w-full bg-[#07070F] border border-gray-800 rounded-lg pl-2 pr-8 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-violet-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPin(!showOldPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none p-1 cursor-pointer flex items-center justify-center"
                      >
                        {showOldPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-bold mb-1">
                      {getTranslation("enterNewPin", language)}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? "text" : "password"}
                        maxLength={4}
                        pattern="\d*"
                        value={newPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setNewPin(val);
                        }}
                        placeholder="••••"
                        className="w-full bg-[#07070F] border border-gray-800 rounded-lg pl-2 pr-8 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-violet-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none p-1 cursor-pointer flex items-center justify-center"
                      >
                        {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-bold mb-1">
                      {getTranslation("confirmPin", language)}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? "text" : "password"}
                        maxLength={4}
                        pattern="\d*"
                        value={confirmPinVal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setConfirmPinVal(val);
                        }}
                        placeholder="••••"
                        className="w-full bg-[#07070F] border border-gray-800 rounded-lg pl-2 pr-8 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-violet-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none p-1 cursor-pointer flex items-center justify-center"
                      >
                        {showConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {pinError && (
                <p className="text-[9px] text-red-400 bg-red-950/20 border border-red-900/10 py-1 px-2 rounded-md font-medium text-center">
                  {pinError}
                </p>
              )}

              {pinSuccess && (
                <p className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/10 py-1 px-2 rounded-md font-medium text-center">
                  {pinSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-[10px] text-white font-bold font-mono tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                {currentPin ? "UPDATE PIN" : getTranslation("setPin", language)}
              </button>
            </form>
          </div>

          {/* Theme display setup - Extremely compact, no long paragraph */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-2.5 flex items-center justify-between shadow-md animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("themeSection", language)}
              </span>
            </div>
            <span className="text-[8.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
              {getTranslation("eyeSafeActive", language)}
            </span>
          </div>

          {/* Reset offline storage data */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-900/40">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider block">
                {getTranslation("clearStorageSection", language)}
              </span>
            </div>
            
            <p className="text-[9.5px] text-gray-400 leading-relaxed">
              {getTranslation("clearStorageDesc", language)}
            </p>

            <div className="space-y-2 pt-1">
              {resetOptions.map((option) => {
                const count = option.getCount();
                const isChecked = !!selectedItems[option.id];
                const IconComponent = getOptionIcon(option.id);

                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-red-950/20 border-red-500/35 text-white animate-fadeIn"
                        : "bg-[#07070F]/50 border-gray-800/80 text-gray-400 hover:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(option.id)}
                        className="rounded border-gray-850 bg-[#07070F] text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <div className="flex items-center gap-2">
                        {IconComponent}
                        <span className="text-xs font-medium">{option.label}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800/40 text-gray-500 font-bold">
                      {count} {option.unit}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetClick}
                disabled={!isAnySelected}
                className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isAnySelected
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/20"
                    : "bg-gray-900 border border-gray-850 text-gray-500 cursor-not-allowed"
                }`}
              >
                {resetSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-bounce" /> {getTranslation("dataCleaned", language)}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> {getTranslation("resetButton", language)}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ABOUT & HELP SECTION */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-900/40">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("aboutHelpTitle", language)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">Shop Calculator</span>
              <span className="text-[9px] font-mono bg-violet-500/10 text-violet-400 px-2.5 py-0.5 rounded-full font-bold border border-violet-500/20">
                v1.0
              </span>
            </div>

            <div className="space-y-1">
              <h5 className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">{getTranslation("howToUseTitle", language)}</h5>
              <p className="text-[9.5px] text-gray-400 leading-relaxed font-normal">
                {getTranslation("howToUseDesc", language)}
              </p>
            </div>

            <div className="pt-1.5 border-t border-gray-900/40 flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
              <span>{getTranslation("madeInIndia", language)}</span>
            </div>
          </div>

          {/* ONBOARDING TUTORIAL SECTION */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-900/40">
              <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("appGuideTitle", language)}
              </span>
            </div>
            
            <p className="text-[9.5px] text-gray-400 leading-relaxed font-normal">
              {getTranslation("appGuideDesc", language)}
            </p>

            <button
              type="button"
              onClick={() => {
                onResetOnboarding();
                setTutorialToast(getTranslation("tutorialResetSuccess", language));
                setTimeout(() => setTutorialToast(""), 3500);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-[11px] text-white font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {getTranslation("showTutorialBtn", language)}
            </button>

            {tutorialToast && (
              <p className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/10 py-1 px-2 rounded-md font-medium text-center animate-fadeIn">
                {tutorialToast}
              </p>
            )}
          </div>

          {/* SHARE APP SECTION */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-900/40">
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {getTranslation("shareSectionTitle", language)}
              </span>
            </div>
            
            <p className="text-[9.5px] text-gray-400 leading-relaxed font-normal">
              {getTranslation("shareSectionDesc", language)}
            </p>

            <button
              type="button"
              onClick={handleShareApp}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[11px] text-white font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-violet-950/20"
            >
              <Share2 className="w-4 h-4" />
              {getTranslation("shareBtn", language)}
            </button>

            {shareToast && (
              <p className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/10 py-1 px-2 rounded-md font-medium text-center animate-fadeIn">
                {shareToast}
              </p>
            )}
          </div>

          {/* PRIVACY GUARANTEE NOTE */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider font-mono">
                {getTranslation("privacyTitle", language)}
              </span>
            </div>
            <p className="text-[9.5px] text-gray-400 leading-relaxed font-medium">
              {getTranslation("privacyDesc", language)}
            </p>
          </div>

        </div>
      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#12122A] border border-gray-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{getTranslation("confirmClearTitle", language)}</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {getTranslation("confirmClearDesc", language)}
              </p>
            </div>

            {/* List of items that will be deleted */}
            <div className="bg-[#07070F] border border-gray-800/80 rounded-xl p-3 text-left space-y-2">
              {resetOptions
                .filter((option) => selectedItems[option.id])
                .map((option) => {
                  const count = option.getCount();
                  return (
                    <div key={option.id} className="flex items-center justify-between text-xs font-semibold text-gray-300">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        {option.label}
                      </span>
                      <span className="text-[10px] font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/20">
                        {count} {option.unit}
                      </span>
                    </div>
                  );
                })}
            </div>

            <p className="text-[10px] text-gray-500 italic">
              {getTranslation("confirmClearWarn", language)}
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-xl py-2.5 text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                {getTranslation("cancel", language)}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-red-950/20"
              >
                {getTranslation("yesDelete", language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
