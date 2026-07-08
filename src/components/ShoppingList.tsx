import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  PlusCircle, 
  MinusCircle, 
  CheckCircle2, 
  Share2,
  Edit,
  AlertTriangle
} from "lucide-react";
import { useCurrency } from "../CurrencyContext";
import { getTranslation } from "../translations";

interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  bought: boolean;
  quantity: number;
  category: string;
}

const CATEGORIES = [
  { id: "grocery", name: "Grocery", nameHi: "किराना", nameMr: "किराणा", nameGu: "કરિયાણું", nameTa: "மளிகை", nameTe: "కిరాణా", icon: "🌾", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "dairy", name: "Dairy & Eggs", nameHi: "डेयरी और अंडे", nameMr: "डेअरी आणि अंडी", nameGu: "ડેરી અને ઈંડા", nameTa: "பால் & முட்டை", nameTe: "డైరీ & గుడ్లు", icon: "🥛", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "veggies", name: "Veggies", nameHi: "सब्जियां", nameMr: "भाज्या", nameGu: "શાકभाજી", nameTa: "காய்கறிகள்", nameTe: "కూరగాయలు", icon: "🍎", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "personal", name: "Personal Care", nameHi: "व्यक्तिगत देखभाल", nameMr: "वैयक्तिक काळजी", nameGu: "વ્યક્તિગત સંભાળ", nameTa: "தனிநபர் பராமரிப்பு", nameTe: "వ్యక్తిగత సంరక్షణ", icon: "🧼", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { id: "household", name: "Household", nameHi: "घरेलू", nameMr: "घरगुती", nameGu: "ઘરવખરી", nameTa: "வீட்டு உபயோகம்", nameTe: "గృహోపకరణాలు", icon: "🏠", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "snacks", name: "Snacks", nameHi: "स्नैक्स", nameMr: "स्नॅक्स", nameGu: "નાસ્તો", nameTa: "சிற்றுண்டி", nameTe: "స్నాక్స్", icon: "🍫", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { id: "others", name: "Others", nameHi: "अन्य", nameMr: "इतर", nameGu: "અન્ય", nameTa: "மற்றவை", nameTe: "ఇతరాలు", icon: "📦", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

export const getCategoryName = (cat: any, lang: string): string => {
  if (lang === "hi") return cat.nameHi || cat.name;
  if (lang === "mr") return cat.nameMr || cat.name;
  if (lang === "gu") return cat.nameGu || cat.name;
  if (lang === "ta") return cat.nameTa || cat.name;
  if (lang === "te") return cat.nameTe || cat.name;
  return cat.name;
};

interface ShoppingListProps {
  onListChanged?: () => void;
  language: string;
}

export default function ShoppingList({ onListChanged, language }: ShoppingListProps) {
  const { currency, symbol, convertToActive, convertFromActive } = useCurrency();
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem("shop_shopping_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map old structure to support quantity and category
        return parsed.map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          category: item.category || "others"
        }));
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const [inputName, setInputName] = useState("");
  const [inputPrice, setInputPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("others");
  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // Editable Budget limit
  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    const saved = localStorage.getItem("shop_shopping_list_budget");
    return saved ? parseFloat(saved) : 0; // default total budget 0 for a fresh start
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInputVal, setBudgetInputVal] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const priceInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Real Purchase History state (different from current list, persistent)
  const [purchaseHistory, setPurchaseHistory] = useState<{name: string, price: number, category: string}[]>(() => {
    const saved = localStorage.getItem("shop_shopping_list_purchase_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const onListChangedRef = useRef(onListChanged);
  useEffect(() => {
    onListChangedRef.current = onListChanged;
  }, [onListChanged]);

  useEffect(() => {
    localStorage.setItem("shop_shopping_list", JSON.stringify(items));
    onListChangedRef.current?.();
  }, [items]);

  useEffect(() => {
    localStorage.setItem("shop_shopping_list_budget", budgetLimit.toString());
  }, [budgetLimit]);

  const addToHistory = (name: string, price: number, category: string) => {
    if (!name.trim()) return;
    setPurchaseHistory((prev) => {
      const filtered = prev.filter((item) => item.name.toLowerCase() !== name.trim().toLowerCase());
      const updated = [{ name: name.trim(), price, category }, ...filtered].slice(0, 10); // keep last 10 unique items
      localStorage.setItem("shop_shopping_list_purchase_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddItem = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputName.trim()) return;

    const actualPrice = convertFromActive(parseFloat(inputPrice) || 0);
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: inputName.trim(),
      price: actualPrice,
      bought: false,
      quantity: Math.max(1, inputQuantity),
      category: selectedCategory,
    };

    setItems((prev) => [newItem, ...prev]);
    addToHistory(inputName.trim(), actualPrice, selectedCategory);
    setInputName("");
    setInputPrice("");
    setInputQuantity(1);
    setSelectedCategory("others");
  };

  const handleToggleBought = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, bought: !item.bought } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleResetList = () => {
    setItems([]);
    setBudgetLimit(1400);
  };

  const pendingItems = items.filter((item) => !item.bought);
  const boughtItems = items.filter((item) => item.bought);

  const totalItems = items.length;
  const boughtCount = boughtItems.length;
  const completionRate = totalItems > 0 ? Math.round((boughtCount / totalItems) * 100) : 0;

  const totalEstimate = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const pendingTotal = pendingItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const boughtTotal = boughtItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getCategoryDetails = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const handleAddRecent = (recent: { name: string; price: number; category: string }) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: recent.name,
      price: recent.price,
      bought: false,
      quantity: 1,
      category: recent.category,
    };
    setItems((prev) => [newItem, ...prev]);
    addToHistory(recent.name, recent.price, recent.category);
  };

  const visibleRecent = purchaseHistory.filter(
    (recent) => !items.some((item) => item.name.toLowerCase() === recent.name.toLowerCase())
  );

  const categoryBreakdown = CATEGORIES.map((cat) => {
    const catItems = items.filter((item) => item.category === cat.id);
    const count = catItems.reduce((acc, item) => acc + item.quantity, 0);
    const total = catItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return {
      ...cat,
      count,
      total,
    };
  }).filter((cat) => cat.count > 0);

  const handleShareList = async () => {
    if (items.length === 0) {
      alert(getTranslation("shoppingListEmpty", language));
      return;
    }

    let shareText = `📝 *SHOPPING LIST*\n`;
    shareText += `Total Items: ${items.length} (Bought: ${boughtCount}, To Buy: ${pendingItems.length})\n`;
    shareText += `Total Budget: ${symbol}${budgetLimit}\n`;
    shareText += `Estimated Total: ${symbol}${convertToActive(totalEstimate).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}\n\n`;

    if (pendingItems.length > 0) {
      shareText += `👉 *TO BUY:*\n`;
      pendingItems.forEach((item, index) => {
        const cat = getCategoryDetails(item.category);
        shareText += `${index + 1}. ${cat.icon} ${item.name} (${item.quantity}x) - ${symbol}${convertToActive(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}\n`;
      });
      shareText += `\n`;
    }

    if (boughtItems.length > 0) {
      shareText += `✅ *BOUGHT:*\n`;
      boughtItems.forEach((item, index) => {
        const cat = getCategoryDetails(item.category);
        shareText += `${index + 1}. ${cat.icon} ${item.name} (${item.quantity}x)\n`;
      });
    }

    shareText += `\nShared via Smart Shop Assistant`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Shopping List",
          text: shareText,
        });
      } catch (err) {
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert(getTranslation("copySuccess", language));
      },
      () => {
        alert(getTranslation("failedToCopy", language));
      }
    );
  };

  return (
    <div className="text-gray-100 p-1" id="shopping-list-module">
      <div className="max-w-md mx-auto space-y-3">
        
        {/* Sleek Retail Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{getTranslation("module5Name", language)}</h3>
              <p className="text-[9px] text-pink-400/80 font-mono">{getTranslation("module05", language)} • SMART RETAIL</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={handleShareList}
              className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-2.5 h-2.5" /> {getTranslation("share", language)}
            </button>
            {confirmReset ? (
              <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleResetList();
                    setConfirmReset(false);
                  }}
                  className="text-[8px] font-bold font-mono text-white bg-rose-600 hover:bg-rose-700 px-1.5 py-0.5 rounded transition-all active:scale-95 cursor-pointer"
                >
                  {getTranslation("clearQuestion", language)}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-[8px] font-bold font-mono text-gray-400 hover:text-white px-1 py-0.5 rounded transition-all cursor-pointer"
                >
                  X
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-[9px] font-mono text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> {getTranslation("reset", language)}
              </button>
            )}
          </div>
        </div>

        {/* Live Shopping Progress Metrics */}
        <div id="shopping-stats-card" className="bg-gradient-to-r from-pink-950/15 to-[#0A0A1F] border border-pink-500/15 rounded-xl p-2.5 shadow-md">
          {/* Row 1: Trolley Progress */}
          <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-300 text-[11px]">{getTranslation("trolley", language)}</span>
              <span className="font-mono text-pink-400 font-bold text-[11px]">{boughtCount}/{totalItems}</span>
            </div>
            {/* Progress Bar */}
            <div className="flex-1 bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-850 max-w-[120px]">
              <div 
                className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(219,39,119,0.5)]"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="font-bold font-mono text-pink-400 text-[11px] shrink-0">{completionRate}%</span>
          </div>

          {/* Row 2: Totals list in single line */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/40 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-mono uppercase">{getTranslation("toBuy", language)}</span>
              <span className="font-bold font-mono text-amber-400">
                {symbol}{convertToActive(pendingTotal).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </span>
            </div>
            <div className="w-px h-2.5 bg-gray-800/80"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-mono uppercase">{getTranslation("bought", language)}</span>
              <span className="font-bold font-mono text-emerald-400">
                {symbol}{convertToActive(boughtTotal).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </span>
            </div>
            <div className="w-px h-2.5 bg-gray-800/80"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-mono uppercase">{getTranslation("budget", language)}</span>
              {isEditingBudget ? (
                <div className="flex items-center gap-0.5">
                  <span className="text-pink-400 font-mono font-bold">{symbol}</span>
                  <input
                    type="number"
                    value={budgetInputVal}
                    onChange={(e) => setBudgetInputVal(e.target.value)}
                    onBlur={() => {
                      const val = parseFloat(budgetInputVal) || 0;
                      setBudgetLimit(val);
                      setIsEditingBudget(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseFloat(budgetInputVal) || 0;
                        setBudgetLimit(val);
                        setIsEditingBudget(false);
                      }
                    }}
                    className="w-12 bg-gray-950 border border-pink-500/40 rounded px-1 py-0.5 text-pink-400 font-bold font-mono text-center text-[10px] focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div 
                  id="shopping-budget-box"
                  className="flex items-center gap-1 cursor-pointer hover:text-pink-300 transition-colors"
                  onClick={() => {
                    setBudgetInputVal(budgetLimit.toString());
                    setIsEditingBudget(true);
                  }}
                  title="Click to edit total budget"
                >
                  <span className={`font-bold font-mono ${totalEstimate > budgetLimit ? 'text-rose-400 animate-pulse' : 'text-pink-400'}`}>
                    {symbol}{budgetLimit.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <Edit className="w-2.5 h-2.5 text-gray-500 hover:text-pink-400 shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category-wise Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-[#0F0F23]/40 border border-pink-500/10 rounded-xl p-2.5 text-[10px]">
            <span className="text-gray-400 font-bold uppercase tracking-wider font-mono block mb-1.5 px-0.5">
              {getTranslation("categoryBreakdownLabel", language)}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {categoryBreakdown.map((cat) => (
                <div key={cat.id} className="shrink-0 flex items-center gap-1.5 bg-[#050510] border border-gray-850 px-2 py-1 rounded-lg">
                  <span className="text-xs">{cat.icon}</span>
                  <span className="text-gray-300 font-medium">{getCategoryName(cat, language)}:</span>
                  <span className="text-pink-400 font-bold font-mono">
                    {cat.count} {cat.count === 1 ? getTranslation("itemsUnit", language) : getTranslation("itemsUnitPlural", language)} · {symbol}{convertToActive(cat.total).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Used Items Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {getTranslation("recentlyAdded", language)}
              </span>
            </div>
            {purchaseHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPurchaseHistory([]);
                  localStorage.removeItem("shop_shopping_list_purchase_history");
                }}
                className="text-[8px] font-mono text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                {getTranslation("clearHistory", language)}
              </button>
            )}
          </div>
          {visibleRecent.length > 0 ? (
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none animate-fadeIn">
              {visibleRecent.slice(0, 3).map((recent, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddRecent(recent)}
                  className="shrink-0 flex items-center gap-1 bg-[#0A1A10] border border-emerald-500/10 hover:border-emerald-500/30 px-2 py-0.5 rounded text-left active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-[9px]">{getCategoryDetails(recent.category).icon}</span>
                  <div className="leading-none max-w-[80px]">
                    <span className="text-[9px] text-gray-200 block truncate">{recent.name}</span>
                  </div>
                  <span className="text-[8px] text-emerald-400 font-mono font-semibold shrink-0 ml-0.5">{symbol}{convertToActive(recent.price).toFixed(0)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[9px] text-gray-600 italic px-1">
              {getTranslation("noRecentItems", language)}
            </div>
          )}
        </div>

        {/* Interactive Add Item Panel */}
        <form id="shopping-add-panel" onSubmit={handleAddItem} className="bg-[#0A0A1C]/65 border border-gray-850/60 rounded-xl p-2.5 space-y-2 shadow-sm">
          {/* First line: Name Input and Price input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  priceInputRef.current?.focus();
                }
              }}
              placeholder={getTranslation("itemNamePlaceholder", language)}
              className="flex-1 bg-[#070714] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/40 transition-colors"
              required
            />
            <div className="relative w-24 shrink-0">
              <span className="absolute left-2 top-2 text-[10px] text-gray-500 font-mono">{symbol}</span>
              <input
                ref={priceInputRef}
                type="text"
                inputMode="decimal"
                value={inputPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setInputPrice(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitButtonRef.current?.focus();
                  }
                }}
                placeholder={getTranslation("rate", language)}
                className="w-full bg-[#070714] border border-gray-800 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-pink-500/40 text-right transition-colors"
              />
            </div>
          </div>

          {/* Second line: Categories scrolling selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider shrink-0 font-mono">
              {getTranslation("catPrefixLabel", language)}
            </span>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-pink-600 border-pink-500 text-white font-semibold shadow-sm"
                      : "bg-[#050510] border-gray-850 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{getCategoryName(cat, language)}</span>
                </button>
              );
            })}
          </div>

          {/* Third line: Quantity selector & Add Button */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-850/30">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                {getTranslation("qtyPrefixLabel", language)}
              </span>
              <div className="flex items-center bg-[#050510] border border-gray-850 rounded-lg px-1.5 py-0.5 gap-2">
                <button
                  type="button"
                  onClick={() => setInputQuantity((q) => Math.max(1, q - 1))}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold font-mono text-pink-400 w-4 text-center">{inputQuantity}</span>
                <button
                  type="button"
                  onClick={() => setInputQuantity((q) => q + 1)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              ref={submitButtonRef}
              type="submit"
              className="bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-bold rounded-lg px-3.5 py-1.5 text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> {getTranslation("addToList", language)}
            </button>
          </div>
        </form>

        {/* Lists Content */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5">
          
          {/* TO BUY SECTION */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {getTranslation("toBuyUpper", language)} ({pendingItems.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold font-mono text-gray-400">
                {symbol}{convertToActive(pendingTotal).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="text-center py-4 bg-[#080814]/40 border border-gray-900/60 rounded-xl text-[11px] text-gray-500 italic flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                <span>{getTranslation("noPendingItems", language)}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingItems.map((item) => {
                  const cat = getCategoryDetails(item.category);
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between bg-[#080814]/80 border border-gray-850 py-1.5 px-2.5 rounded-lg hover:border-pink-500/20 hover:bg-[#0C0C22]/80 transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Custom checkbox */}
                        <button 
                          onClick={() => handleToggleBought(item.id)}
                          className="text-gray-600 hover:text-pink-400 shrink-0 transition-colors cursor-pointer"
                        >
                          <Square className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-gray-100 truncate">{item.name}</span>
                          <span className="text-[10px] shrink-0" title={getCategoryName(cat, language)}>{cat.icon}</span>
                        </div>
                      </div>

                      {/* Controls Area */}
                      <div className="flex items-center gap-2.5 shrink-0 pl-1.5">
                        {/* Qty controller inline */}
                        <div className="flex items-center bg-[#05050A] rounded-md border border-gray-850 px-1 py-0.5 gap-1 scale-90">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="text-gray-500 hover:text-white cursor-pointer"
                          >
                            <MinusCircle className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-gray-300 w-3 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="text-gray-500 hover:text-white cursor-pointer"
                          >
                            <PlusCircle className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-[11px] font-bold font-mono text-gray-300 text-right min-w-[50px]">
                          {symbol}{convertToActive(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                        </span>

                        {/* Delete */}
                        <button 
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-gray-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOUGHT SECTION */}
          <div className="space-y-1.5 pt-1.5 border-t border-gray-900/60">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {getTranslation("boughtUpper", language)} ({boughtItems.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold font-mono text-gray-500">
                {symbol}{convertToActive(boughtTotal).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </span>
            </div>

            {boughtItems.length === 0 ? (
              <div className="text-center py-2 text-[10px] text-gray-600 italic">
                {getTranslation("noItemsMarkedBought", language)}
              </div>
            ) : (
              <div className="space-y-1.5 opacity-65">
                {boughtItems.map((item) => {
                  const cat = getCategoryDetails(item.category);
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between bg-[#04040E]/60 border border-gray-900 py-1.5 px-2.5 rounded-lg hover:opacity-100 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Checked checkbox */}
                        <button 
                          onClick={() => handleToggleBought(item.id)}
                          className="text-pink-500 shrink-0 cursor-pointer"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-gray-400 line-through truncate">{item.name}</span>
                          <span className="text-[10px] shrink-0 opacity-50">{cat.icon}</span>
                          {item.quantity > 1 && (
                            <span className="text-[8px] bg-gray-900 border border-gray-800 text-gray-500 px-1 py-0.5 rounded font-mono">
                              ×{item.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prices & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0 pl-1.5">
                        <span className="text-[11px] font-bold font-mono text-gray-500 line-through text-right min-w-[50px]">
                          {symbol}{convertToActive(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                        </span>

                        <button 
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-gray-600 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SECURE DELETE CONFIRMATION MODAL DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#12122A] border border-gray-800 rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {language === "hi" ? "आइटम हटाएं?" : "Delete Item?"}
              </h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {language === "hi" ? "क्या आप वाकई इस आइटम को सूची से हटाना चाहते हैं?" : "Are you sure you want to remove this item from your shopping list?"}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                {getTranslation("cancel", language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteItem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                {getTranslation("delete", language)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
