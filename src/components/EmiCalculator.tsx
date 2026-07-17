import React, { useState, useEffect, useRef } from "react";
import { CreditCard, RefreshCw, ChevronLeft } from "lucide-react";
import { useCurrency } from "../CurrencyContext";
import { getTranslation } from "../translations";

interface EmiCalculatorProps {
  onBack: () => void;
  language: string;
}

export default function EmiCalculator({ onBack, language }: EmiCalculatorProps) {
  const { currency, symbol, rates } = useCurrency();
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(12);
  const [tenure, setTenure] = useState<number>(2);
  const [tenureType, setTenureType] = useState<"years" | "months">("years");

  const prevCurrencyRef = useRef(currency);
  
  // Backup refs to keep calculations and sliders stable when inputs are focused and cleared
  const backupLoanAmount = useRef<number>(100000);
  const backupInterestRate = useRef<number>(12);
  const backupTenure = useRef<number>(2);

  // Refs for focusing inputs sequentially
  const amountInputRef = useRef<HTMLInputElement>(null);
  const interestInputRef = useRef<HTMLInputElement>(null);
  const tenureInputRef = useRef<HTMLInputElement>(null);

  // Keyboard-to-slider transition guard to prevent layout shift jumping
  const isTransitioningKeyboard = useRef(false);

  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      const baseInr = loanAmount * rates[prevCurrencyRef.current];
      const newAmount = baseInr / rates[currency];
      const roundedAmount = newAmount ? Math.round(newAmount) : 0;
      setLoanAmount(roundedAmount);
      backupLoanAmount.current = roundedAmount;
      prevCurrencyRef.current = currency;
    }
  }, [currency, rates, loanAmount]);

  const handleReset = () => {
    const initialAmount = Math.round(100000 / rates[currency]);
    setLoanAmount(initialAmount);
    backupLoanAmount.current = initialAmount;
    setInterestRate(12);
    backupInterestRate.current = 12;
    setTenure(2);
    backupTenure.current = 2;
    setTenureType("years");
  };

  // Focus & Blur UX Helpers to avoid copy/paste popups on mobile
  const handleAmountFocus = () => {
    backupLoanAmount.current = loanAmount || backupLoanAmount.current;
    setLoanAmount(0); // clear input so user can type fresh immediately
  };

  const handleAmountBlur = () => {
    if (!loanAmount) {
      setLoanAmount(backupLoanAmount.current);
    } else {
      backupLoanAmount.current = loanAmount;
    }
  };

  const handleInterestFocus = () => {
    backupInterestRate.current = interestRate || backupInterestRate.current;
    setInterestRate(0); // clear input so user can type fresh immediately
  };

  const handleInterestBlur = () => {
    if (!interestRate) {
      setInterestRate(backupInterestRate.current);
    } else {
      backupInterestRate.current = interestRate;
    }
  };

  const handleTenureFocus = () => {
    backupTenure.current = tenure || backupTenure.current;
    setTenure(0); // clear input so user can type fresh immediately
  };

  const handleTenureBlur = () => {
    if (!tenure) {
      setTenure(backupTenure.current);
    } else {
      backupTenure.current = tenure;
    }
  };

  // Keyboard and slider helpers
  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      interestInputRef.current?.focus();
    }
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tenureInputRef.current?.focus();
    }
  };

  const handleTenureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tenureInputRef.current?.blur();
    }
  };

  const handleSliderPointerDown = () => {
    if (document.activeElement instanceof HTMLElement && document.activeElement.tagName === "INPUT") {
      isTransitioningKeyboard.current = true;
      document.activeElement.blur();
      setTimeout(() => {
        isTransitioningKeyboard.current = false;
      }, 300); // Wait 300ms for mobile keyboard collapse reflow to complete
    }
  };

  // Quadratic/Non-linear Slider Helpers for Loan Amount
  const minAmount = Math.round(10000 / rates[currency]);
  const maxAmount = Math.round(2000000 / rates[currency]);
  const stepAmount = Math.round(5000 / rates[currency]) || 1;

  const amountToSlider = (amt: number): number => {
    if (amt <= minAmount) return 0;
    if (amt >= maxAmount) return 100;
    const ratio = (amt - minAmount) / (maxAmount - minAmount);
    return Math.sqrt(Math.max(0, ratio)) * 100;
  };

  const sliderToAmount = (sVal: number): number => {
    const ratio = Math.pow(sVal / 100, 2);
    const rawAmt = minAmount + (maxAmount - minAmount) * ratio;
    return Math.round(rawAmt / stepAmount) * stepAmount;
  };

  // Calculations using state fallbacks to backups so the card numbers are rock-solid and stable
  const P = loanAmount || backupLoanAmount.current || 0;
  const currentInterestRate = interestRate || backupInterestRate.current || 0;
  const r = currentInterestRate / 12 / 100; // Monthly interest rate
  const currentTenure = tenure || backupTenure.current || 1;
  const n = tenureType === "years" ? currentTenure * 12 : currentTenure; // Total months

  let emi = 0;
  if (n > 0) {
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
  }

  const totalPayment = emi * n;
  const totalInterest = Math.max(0, totalPayment - P);

  return (
    <div className="text-gray-100 p-1">
      <div className="w-full max-w-md mx-auto">
        {/* Compact Integrated Module Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-900/60">
          <button 
            onClick={onBack}
            className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1 font-bold py-1 px-2.5 rounded-lg bg-gray-900 border border-gray-800 transition-all hover:border-gray-700 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {getTranslation("back", language)}
          </button>
          
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white tracking-tight">{getTranslation("module6Name", language)}</span>
          </div>

          <button 
            onClick={handleReset}
            className="text-[10px] font-mono text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> {getTranslation("reset", language)}
          </button>
        </div>

        {/* Input Parameters Form */}
        <div className="space-y-2.5">
          {/* Loan Amount Card */}
          <div id="emi-loan-card" className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {getTranslation("loanAmount", language)}
              </label>
              <div className="flex items-center bg-[#07070F] border border-gray-800 focus-within:border-blue-500/50 rounded-lg px-2.5 py-1 transition-all">
                <span className="text-sm text-gray-500 font-mono mr-1 font-bold">{symbol}</span>
                <input 
                  ref={amountInputRef}
                  type="number" 
                  value={loanAmount || ""} 
                  onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={handleAmountKeyDown}
                  onFocus={handleAmountFocus}
                  onBlur={handleAmountBlur}
                  className="bg-transparent text-base sm:text-lg font-mono text-blue-400 font-black w-24 sm:w-28 text-right focus:outline-none"
                />
              </div>
            </div>
            <div className="px-1 py-2">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={amountToSlider(loanAmount || backupLoanAmount.current)}
                onChange={(e) => {
                  if (isTransitioningKeyboard.current) return;
                  const sVal = parseFloat(e.target.value);
                  setLoanAmount(sliderToAmount(sVal));
                }}
                onPointerDown={handleSliderPointerDown}
                tabIndex={-1}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-blue-500/50 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
              />
            </div>
          </div>

          {/* Interest Rate Card */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {getTranslation("interestRate", language)}
              </label>
              <div className="flex items-center bg-[#07070F] border border-gray-800 focus-within:border-blue-500/50 rounded-lg px-2.5 py-1 transition-all">
                <input 
                  ref={interestInputRef}
                  type="number" 
                  step="0.1"
                  value={interestRate || ""} 
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  onKeyDown={handleInterestKeyDown}
                  onFocus={handleInterestFocus}
                  onBlur={handleInterestBlur}
                  className="bg-transparent text-base sm:text-lg font-mono text-blue-400 font-black w-14 sm:w-16 text-right focus:outline-none"
                />
                <span className="text-sm text-gray-500 font-mono ml-1 font-bold">%</span>
              </div>
            </div>
            <div className="px-1 py-2">
              <input
                type="range"
                min="1"
                max="30"
                step="0.1"
                value={interestRate || backupInterestRate.current}
                onChange={(e) => {
                  if (isTransitioningKeyboard.current) return;
                  setInterestRate(parseFloat(e.target.value));
                }}
                onPointerDown={handleSliderPointerDown}
                tabIndex={-1}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-blue-500/50 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
              />
            </div>
          </div>

          {/* Loan Tenure Card */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {getTranslation("tenure", language)} ({tenureType === "years" ? getTranslation("years", language) : getTranslation("months", language)})
              </label>
              <div className="flex items-center gap-3">
                {/* Years / Months Switcher */}
                <div className="flex bg-[#07070F] border border-gray-800 rounded-lg p-0.5 text-[10px] font-bold uppercase font-mono">
                  <button 
                    onClick={() => { setTenureType("years"); setTenure(Math.max(1, Math.round(tenure / 12) || 2)); }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${tenureType === "years" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {getTranslation("years", language)}
                  </button>
                  <button 
                    onClick={() => { setTenureType("months"); setTenure(tenure * 12); }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${tenureType === "months" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {getTranslation("months", language)}
                  </button>
                </div>
                <div className="flex items-center bg-[#07070F] border border-gray-800 focus-within:border-blue-500/50 rounded-lg px-2.5 py-1 transition-all">
                  <input 
                    ref={tenureInputRef}
                    type="number" 
                    value={tenure || ""} 
                    onChange={(e) => setTenure(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    onKeyDown={handleTenureKeyDown}
                    onFocus={handleTenureFocus}
                    onBlur={handleTenureBlur}
                    className="bg-transparent text-base sm:text-lg font-mono text-blue-400 font-black w-10 sm:w-12 text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-1 py-2">
              <input
                type="range"
                min="1"
                max={tenureType === "years" ? 30 : 360}
                step="1"
                value={tenure || backupTenure.current}
                onChange={(e) => {
                  if (isTransitioningKeyboard.current) return;
                  setTenure(parseInt(e.target.value, 10));
                }}
                onPointerDown={handleSliderPointerDown}
                tabIndex={-1}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-blue-500/50 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
              />
            </div>
          </div>

          {/* Results Block */}
          <div id="emi-results-card" className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3.5 space-y-3 shadow-xl">
            <div className="text-center pb-2.5 border-b border-gray-900/40">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-0.5">
                {getTranslation("monthlyEmi", language)}
              </span>
              <div className="inline-block relative">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  {symbol}{emi.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-0.5 text-xs">
              <div className="bg-[#07070F] p-2 rounded-lg text-center shadow-inner border border-gray-900/40">
                <span className="text-[9px] text-gray-500 uppercase block mb-0.5 font-bold">{getTranslation("totalInterest", language)}</span>
                <span className="font-mono text-xs sm:text-sm font-black text-blue-400">
                  {symbol}{totalInterest.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#07070F] p-2 rounded-lg text-center shadow-inner border border-gray-900/40">
                <span className="text-[9px] text-gray-500 uppercase block mb-0.5 font-bold">{getTranslation("totalPayment", language)}</span>
                <span className="font-mono text-xs sm:text-sm font-black text-white">
                  {symbol}{totalPayment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
