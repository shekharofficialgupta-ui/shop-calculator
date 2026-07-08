import { useState, useEffect, useRef } from "react";
import { Tag, RefreshCw } from "lucide-react";
import { useCurrency } from "../CurrencyContext";
import { getTranslation } from "../translations";

interface DiscountCalculatorProps {
  language: string;
}

export default function DiscountCalculator({ language }: DiscountCalculatorProps) {
  const { currency, symbol, rates } = useCurrency();
  const [mrpStr, setMrpStr] = useState("2500");
  const [discountPercentStr, setDiscountPercentStr] = useState("15");
  const [discountAmountStr, setDiscountAmountStr] = useState("375");

  const prevCurrencyRef = useRef(currency);

  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      // Convert MRP
      const oldMrp = parseFloat(mrpStr) || 0;
      const baseInrMrp = oldMrp * rates[prevCurrencyRef.current];
      const newMrp = baseInrMrp / rates[currency];
      setMrpStr(newMrp ? (Math.round(newMrp * 100) / 100).toString() : "");

      // Convert Discount Amount (savings)
      const oldAmt = parseFloat(discountAmountStr) || 0;
      const baseInrAmt = oldAmt * rates[prevCurrencyRef.current];
      const newAmt = baseInrAmt / rates[currency];
      setDiscountAmountStr(newAmt ? (Math.round(newAmt * 100) / 100).toString() : "");

      prevCurrencyRef.current = currency;
    }
  }, [currency, rates, mrpStr, discountAmountStr]);

  const mrp = parseFloat(mrpStr) || 0;

  const handleMrpChange = (val: string) => {
    setMrpStr(val);
    const newMrp = parseFloat(val) || 0;
    const p = parseFloat(discountPercentStr) || 0;
    const newAmt = (newMrp * p) / 100;
    setDiscountAmountStr(newAmt === 0 ? "" : newAmt.toFixed(2).replace(/\.00$/, ""));
  };

  const handlePercentChange = (val: string) => {
    setDiscountPercentStr(val);
    const p = parseFloat(val) || 0;
    if (mrp > 0) {
      const amt = (mrp * p) / 100;
      setDiscountAmountStr(amt === 0 ? "" : amt.toFixed(2).replace(/\.00$/, ""));
    } else {
      setDiscountAmountStr("");
    }
  };

  const handleAmountChange = (val: string) => {
    setDiscountAmountStr(val);
    const amt = parseFloat(val) || 0;
    if (mrp > 0) {
      const p = (amt / mrp) * 100;
      setDiscountPercentStr(p === 0 ? "" : p.toFixed(2).replace(/\.00$/, ""));
    } else {
      setDiscountPercentStr("");
    }
  };

  const handleReset = () => {
    setMrpStr("");
    setDiscountPercentStr("");
    setDiscountAmountStr("");
  };

  const finalDiscountAmount = parseFloat(discountAmountStr) || 0;
  const finalDiscountPercent = parseFloat(discountPercentStr) || 0;
  const finalPrice = Math.max(0, mrp - finalDiscountAmount);

  return (
    <div className="text-gray-100 p-1" id="discount-calculator-module">
      <div className="max-w-md mx-auto">
        
        {/* Module Header */}
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-gray-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{getTranslation("module4Name", language)}</h3>
              <p className="text-[9px] text-gray-500 font-mono">{getTranslation("module04", language)} • MRP BARGAIN &amp; SAVINGS SYNC</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="text-[9px] font-mono text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> {getTranslation("resetInputs", language)}
          </button>
        </div>

        {/* Input Parameters */}
        <div className="space-y-3 mb-4">
          {/* MRP */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {getTranslation("mrp", language)} ({symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                value={mrpStr === "0" ? "" : mrpStr}
                onChange={(e) => handleMrpChange(e.target.value)}
                placeholder={getTranslation("enterOriginalPrice", language)}
                className="w-full bg-[#07070F] border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500/40"
              />
              <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-mono">{symbol}</span>
            </div>
          </div>

          {/* Sync block */}
          <div className="grid grid-cols-2 gap-3">
            {/* Discount Percentage */}
            <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                {getTranslation("discountPercent", language)}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountPercentStr}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#07070F] border border-gray-800 rounded-lg pr-8 pl-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500/40"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-mono">%</span>
              </div>
            </div>

            {/* Discount Amount */}
            <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                {getTranslation("youSave", language)} ({symbol})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountAmountStr}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#07070F] border border-gray-800 rounded-lg pr-3 pl-8 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500/40"
                />
                <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-mono">{symbol}</span>
              </div>
            </div>
          </div>

          {/* Savings breakdown display panel */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{getTranslation("mrp", language)}:</span>
              <span className="font-mono text-white">{symbol}{mrp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-400/80">
              <span>{getTranslation("youSave", language)} ({finalDiscountPercent.toFixed(1)}%):</span>
              <span className="font-mono font-bold">- {symbol}{finalDiscountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-sm font-bold text-white">
              <span>{getTranslation("finalPrice", language)}:</span>
              <span className="font-mono text-emerald-400">{symbol}{finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
