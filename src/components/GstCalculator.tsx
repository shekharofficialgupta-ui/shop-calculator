import { useState } from "react";
import { Percent, RefreshCw } from "lucide-react";
import { getTranslation } from "../translations";

interface GstCalculatorProps {
  language: string;
}

export default function GstCalculator({ language }: GstCalculatorProps) {
  const [amountStr, setAmountStr] = useState("10000");
  const [selectedSlab, setSelectedSlab] = useState<number>(18);
  const [isCustomSlab, setIsCustomSlab] = useState<boolean>(false);
  const [customSlabPercent, setCustomSlabPercent] = useState<string>("18");
  const [customSlabInputValue, setCustomSlabInputValue] = useState<string>("18");
  const [calcMode, setCalcMode] = useState<"exclusive" | "inclusive">("exclusive");

  const amount = parseFloat(amountStr) || 0;
  const symbol = "₹";
  const locale = "en-IN";

  const activeSlab = isCustomSlab ? (parseFloat(customSlabPercent) || 0) : selectedSlab;

  // Real-time calculations
  let baseAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let finalBillAmount = 0;

  if (calcMode === "exclusive") {
    // Add GST (Amount is exclusive of tax)
    baseAmount = amount;
    igst = baseAmount * (activeSlab / 100);
    cgst = igst / 2;
    sgst = igst / 2;
    finalBillAmount = baseAmount + igst;
  } else {
    // Remove GST (Amount is inclusive of tax)
    finalBillAmount = amount;
    baseAmount = finalBillAmount / (1 + activeSlab / 100);
    igst = finalBillAmount - baseAmount;
    cgst = igst / 2;
    sgst = igst / 2;
  }

  const slabs = [5, 12, 18, 28];

  const formatGstPart = (totalPct: number) => {
    const part = totalPct / 2;
    return part % 1 === 0 ? part.toString() : Number(part.toFixed(3)).toString();
  };

  const handleReset = () => {
    setAmountStr("");
    if (isCustomSlab) {
      setCustomSlabPercent("18");
      setCustomSlabInputValue("18");
    }
  };

  return (
    <div className="text-gray-100 p-1 animate-fadeIn" id="gst-calculator-module">
      <div className="max-w-md mx-auto">
        
        {/* Module Header */}
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-b-gray-900/60" id="gst-calc-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{getTranslation("module3Name", language)}</h3>
              <p className="text-[9px] text-gray-500 font-mono">{getTranslation("module03", language)} • OFFLINE TAX SPLITTER</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            id="gst-reset-btn"
            className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> {getTranslation("resetInput", language)}
          </button>
        </div>

        {/* Exclusive vs Inclusive Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-3" id="gst-mode-toggle">
          <button
            onClick={() => setCalcMode("exclusive")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              calcMode === "exclusive"
                ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/40"
                : "bg-gray-900 border-gray-850 text-gray-400 hover:text-white"
            }`}
          >
            {getTranslation("amountExcludesGst", language)}
          </button>
          <button
            onClick={() => setCalcMode("inclusive")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              calcMode === "inclusive"
                ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/40"
                : "bg-gray-900 border-gray-850 text-gray-400 hover:text-white"
            }`}
          >
            {getTranslation("amountIncludesGst", language)}
          </button>
        </div>

        {/* Input Parameters */}
        <div className="space-y-3 mb-4" id="gst-input-params">
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {calcMode === "exclusive" 
                ? getTranslation("amount", language) 
                : getTranslation("totalInclusiveAmount", language)} ({symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder={getTranslation("enterAmount", language)}
                className="w-full bg-[#07070F] border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/40"
              />
              <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-mono">{symbol}</span>
            </div>
          </div>

          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {getTranslation("gstRate", language)}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {slabs.map((rate) => {
                const isActive = !isCustomSlab && selectedSlab === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setIsCustomSlab(false);
                      setSelectedSlab(rate);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : "bg-gray-900 border-gray-850 text-gray-400 hover:text-white"
                    }`}
                  >
                    {rate}%
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsCustomSlab(true);
                }}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                  isCustomSlab
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-gray-900 border-gray-850 text-gray-400 hover:text-white"
                }`}
              >
                {getTranslation("custom", language)}
              </button>
            </div>

            {isCustomSlab && (
              <div className="mt-2.5 flex items-center gap-2 animate-fadeIn">
                <span className="text-[10px] font-bold text-gray-400 font-mono shrink-0">{getTranslation("customGstPercent", language)}</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={customSlabInputValue}
                    onChange={(e) => {
                      setCustomSlabInputValue(e.target.value);
                      setCustomSlabPercent(e.target.value);
                    }}
                    placeholder="GST %"
                    className="w-full bg-[#07070F] border border-gray-800 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/40 text-center"
                  />
                  <span className="absolute right-3 top-1 text-[10px] text-gray-500 font-mono">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Slabs breakdown display panel */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3.5 space-y-2" id="gst-breakdown-panel">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{getTranslation("baseExcludingGst", language)}</span>
              <span className="font-mono text-white">
                {symbol}{baseAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400/80">
              <span>{getTranslation("cgst", language)} ({formatGstPart(activeSlab)}%):</span>
              <span className="font-mono">
                {symbol}{cgst.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400/80">
              <span>{getTranslation("sgst", language)} ({formatGstPart(activeSlab)}%):</span>
              <span className="font-mono">
                {symbol}{sgst.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-1.5 border-t border-dashed border-gray-800 flex items-center justify-between text-xs font-bold text-white">
              <span>{getTranslation("totalTax", language)} ({activeSlab}%):</span>
              <span className="font-mono text-emerald-400">
                + {symbol}{igst.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-sm font-bold text-white">
              <span>{getTranslation("finalBillAmount", language)}</span>
              <span className="font-mono text-white">
                {symbol}{finalBillAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
