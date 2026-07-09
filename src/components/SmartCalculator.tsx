import { useState, useEffect } from "react";
import { Calculator, Sparkles, RotateCcw, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getTranslation } from "../translations";

interface SmartCalculatorProps {
  onBack: () => void;
  language: string;
}

export default function SmartCalculator({ onBack, language }: SmartCalculatorProps) {
  const [expression, setExpression] = useState<string>(() => {
    return localStorage.getItem("shop_calc_expr") || "";
  });
  const [equation, setEquation] = useState<string>(() => {
    return localStorage.getItem("shop_calc_eq") || "";
  });
  const [isFinished, setIsFinished] = useState<boolean>(() => {
    return localStorage.getItem("shop_calc_finished") === "true";
  });
  const [isDegreeMode, setIsDegreeMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("shop_calc_deg_mode");
    return saved !== "false"; // default to true (DEG mode)
  });
  const [memory, setMemory] = useState<number>(() => {
    const saved = localStorage.getItem("shop_calc_memory");
    return saved ? parseFloat(saved) : 0;
  });
  const [history, setHistory] = useState<Array<{ eq: string; res: string }>>(() => {
    const saved = localStorage.getItem("shop_calc_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse shop_calc_history from localStorage", e);
      }
    }
    return [];
  });
  const [showHistoryPage, setShowHistoryPage] = useState<boolean>(false);

  // Persist states locally
  useEffect(() => {
    localStorage.setItem("shop_calc_expr", expression);
    localStorage.setItem("shop_calc_eq", equation);
    localStorage.setItem("shop_calc_finished", isFinished.toString());
    localStorage.setItem("shop_calc_deg_mode", isDegreeMode.toString());
    localStorage.setItem("shop_calc_memory", memory.toString());
    localStorage.setItem("shop_calc_history", JSON.stringify(history));
  }, [expression, equation, isFinished, isDegreeMode, memory, history]);

  // Safe Math Parser and Evaluator
  const cleanAndEvaluate = (expr: string): string => {
    if (!expr || expr.trim() === "") return "0";

    let sanitized = expr.trim();

    // Loop to remove trailing operators or incomplete parentheses/functions
    let prevLength = 0;
    while (sanitized.length !== prevLength) {
      prevLength = sanitized.length;
      
      // Remove trailing operators
      sanitized = sanitized.replace(/[\+\-\*\/×÷\^−]\s*$/, "");
      
      // Remove trailing incomplete functions
      sanitized = sanitized.replace(/(sin|cos|tan|log|ln|√)\s*\(\s*$/, "");
      
      // Strip trailing whitespace
      sanitized = sanitized.trim();
    }

    if (sanitized === "" || sanitized === "-") return "0";

    // Translate mathematical symbols to JavaScript equivalents
    let jsExpr = sanitized
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-") // normalize typography minus sign to standard hyphen
      .replace(/π/g, "PI")
      .replace(/e/g, "e")
      .replace(/%/g, "*0.01")
      .replace(/\^/g, "**");

    // Replace mathematical functions with localized degree/radian-aware variants
    jsExpr = jsExpr
      .replace(/sin\(/g, "local_sin(")
      .replace(/cos\(/g, "local_cos(")
      .replace(/tan\(/g, "local_tan(")
      .replace(/log\(/g, "local_log(")
      .replace(/ln\(/g, "local_ln(")
      .replace(/√\(/g, "local_sqrt(");

    // Automatically balance unclosed parentheses
    const openCount = (jsExpr.match(/\(/g) || []).length;
    const closeCount = (jsExpr.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      jsExpr += ")".repeat(openCount - closeCount);
    }

    // Local function definitions
    const local_sin = (x: number) => {
      const angle = isDegreeMode ? (x * Math.PI) / 180 : x;
      const res = Math.sin(angle);
      return Math.abs(res) < 1e-14 ? 0 : res;
    };
    const local_cos = (x: number) => {
      const angle = isDegreeMode ? (x * Math.PI) / 180 : x;
      const res = Math.cos(angle);
      return Math.abs(res) < 1e-14 ? 0 : res;
    };
    const local_tan = (x: number) => {
      const angle = isDegreeMode ? (x * Math.PI) / 180 : x;
      if (Math.abs(Math.cos(angle)) < 1e-14) return NaN;
      const res = Math.tan(angle);
      return Math.abs(res) < 1e-14 ? 0 : res;
    };
    const local_log = (x: number) => Math.log10(x);
    const local_ln = (x: number) => Math.log(x);
    const local_sqrt = (x: number) => Math.sqrt(x);
    const PI = Math.PI;
    const e = Math.E;

    try {
      // Validate string to prevent unsafe execution
      const validationStr = jsExpr
        .replace(/(local_sin|local_cos|local_tan|local_log|local_ln|local_sqrt|PI|e|\*\*)/g, "")
        .replace(/[\d.+\-*/() ]/g, "");

      if (validationStr.trim() !== "") {
        return "Error";
      }

      const evaluator = new Function(
        "local_sin", "local_cos", "local_tan", "local_log", "local_ln", "local_sqrt", "PI", "e",
        `return (${jsExpr})`
      );
      const result = evaluator(local_sin, local_cos, local_tan, local_log, local_ln, local_sqrt, PI, e);

      if (typeof result === "number") {
        if (!isFinite(result) || isNaN(result)) return "Error";
        // Handle floating point precision errors nicely
        if (result % 1 !== 0) {
          const rounded = Number(result.toFixed(10));
          return rounded.toString();
        }
        return result.toString();
      }
      return "Error";
    } catch (err) {
      return "Error";
    }
  };

  // Get current Live Auto-calculated result
  const liveResult = cleanAndEvaluate(expression);

  // Toggle negative/positive sign of the last active numeric token
  const toggleLastNumberSign = (expr: string): string => {
    if (!expr || expr === "0") return "−";
    if (expr === "−" || expr === "-") return "";

    // Match the last numerical constant (or pi/e)
    const lastNumRegex = /(?:(?:\s*([\+\-\*\/×÷\^−])\s*)||^)(-)?(\d+(?:\.\d+)?|e|π)$/;
    const match = expr.match(lastNumRegex);
    if (match) {
      const fullMatch = match[0];
      const operator = match[1] || "";
      const sign = match[2] || "";
      const num = match[3] || "";

      // If it has a minus sign, strip it. Otherwise, add a mathematical minus sign
      const newSegment = operator 
        ? `${operator} ${sign ? "" : "−"}${num}` 
        : `${sign ? "" : "−"}${num}`;
      
      return expr.slice(0, expr.length - fullMatch.length) + newSegment;
    }

    return expr + " −";
  };

  const handleKeyPress = (val: string) => {
    if (val === "C") {
      setExpression("");
      setEquation("");
      setIsFinished(false);
    } else if (val === "DEL") {
      if (isFinished) {
        setEquation("");
        setIsFinished(false);
      } else {
        if (expression.length <= 1) {
          setExpression("");
        } else {
          // Smart delete for scientific functions to keep UX gorgeous
          if (expression.endsWith("sin(") || expression.endsWith("cos(") || expression.endsWith("tan(") || expression.endsWith("log(")) {
            setExpression((prev) => prev.slice(0, -4));
          } else if (expression.endsWith("ln(") || expression.endsWith("√(")) {
            setExpression((prev) => prev.slice(0, -3));
          } else if (expression.endsWith(" ")) {
            setExpression((prev) => prev.slice(0, -3));
          } else {
            setExpression((prev) => prev.slice(0, -1));
          }
        }
      }
    } else if (val === "=") {
      if (!expression || isFinished) return;
      const finalResult = cleanAndEvaluate(expression);
      if (finalResult !== "Error") {
        setHistory((prev) => [{ eq: expression, res: finalResult }, ...prev.slice(0, 19)]);
        setEquation(expression + " =");
        setExpression(finalResult);
        setIsFinished(true);
      } else {
        setExpression("Error");
        setIsFinished(true);
      }
    } else if (val === "%") {
      if (isFinished) {
        setEquation("");
        setIsFinished(false);
      }
      setExpression((prev) => {
        if (!prev) return "";
        return prev + "%";
      });
    } else if (val === "+/-") {
      if (isFinished) {
        setEquation("");
        setIsFinished(false);
      }
      setExpression((prev) => toggleLastNumberSign(prev));
    } else if (["+", "−", "×", "÷"].map(op => op === "−" ? "-" : op).includes(val) || ["+", "−", "×", "÷"].includes(val)) {
      const displaySymbol = val === "-" ? "−" : val;
      
      if (isFinished) {
        setEquation("");
        setExpression(liveResult + " " + displaySymbol + " ");
        setIsFinished(false);
        return;
      }

      if (!expression) {
        if (displaySymbol === "−") {
          setExpression("−");
        }
        return;
      }

      const trimmed = expression.trim();
      const lastChar = trimmed.slice(-1);

      if (["+", "−", "×", "÷"].includes(lastChar)) {
        // Replace last operator
        setExpression((prev) => prev.trim().slice(0, -1) + displaySymbol + " ");
      } else {
        setExpression((prev) => prev + " " + displaySymbol + " ");
      }
    } else {
      // Numbers and Decimals
      if (isFinished) {
        setEquation("");
        setExpression(val === "." ? "0." : val);
        setIsFinished(false);
        return;
      }

      if (expression === "0" && val !== ".") {
        setExpression(val);
      } else {
        // Prevent double decimals in the active numerical block
        if (val === ".") {
          const parts = expression.split(/[\+\-\*\/×÷\^− ]/);
          const activePart = parts[parts.length - 1];
          if (activePart.includes(".")) return;
        }
        setExpression((prev) => prev + val);
      }
    }
  };

  const handleSciPress = (sci: string) => {
    if (isFinished) {
      setEquation("");
      setIsFinished(false);
    }

    if (sci === "π") {
      setExpression((prev) => {
        if (!prev || prev === "0") return "π";
        const lastChar = prev.slice(-1);
        if (/[\d.eπ)]/.test(lastChar)) return prev + " × π";
        return prev + " π";
      });
    } else if (sci === "e") {
      setExpression((prev) => {
        if (!prev || prev === "0") return "e";
        const lastChar = prev.slice(-1);
        if (/[\d.eπ)]/.test(lastChar)) return prev + " × e";
        return prev + " e";
      });
    } else if (sci === "DEG" || sci === "RAD") {
      setIsDegreeMode((prev) => !prev);
    } else if (sci === "^") {
      setExpression((prev) => {
        if (!prev) return "";
        return prev + " ^ ";
      });
    } else {
      // Trigonometric & Logarithm Functions
      const funcMap: Record<string, string> = {
        sin: "sin(",
        cos: "cos(",
        tan: "tan(",
        ln: "ln(",
        log: "log(",
        "√": "√(",
      };
      const insert = funcMap[sci];
      setExpression((prev) => {
        if (!prev || prev === "0") return insert;
        const lastChar = prev.slice(-1);
        if (/[\d.eπ)]/.test(lastChar)) return prev + " × " + insert;
        return prev + insert;
      });
    }
  };

  const handleMemory = (action: string) => {
    const numVal = parseFloat(liveResult) || 0;

    if (action === "MC") {
      setMemory(0);
    } else if (action === "MR") {
      if (isFinished) {
        setEquation("");
        setIsFinished(false);
      }
      setExpression((prev) => {
        if (!prev || prev === "0") return memory.toString();
        const lastChar = prev.slice(-1);
        if (/[\d.eπ)]/.test(lastChar)) return prev + " × " + memory;
        return prev + " " + memory;
      });
    } else if (action === "M-") {
      setMemory((prev) => prev - numVal);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const buttons = [
    ["C", "DEL", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["+/-", "0", ".", "="],
  ];

  return (
    <div className="text-gray-100 p-1 sm:p-2 md:p-3 max-w-md mx-auto flex flex-col justify-between select-none h-full">
      <AnimatePresence mode="wait">
        {showHistoryPage ? (
          /* ================== DETACHED HISTORY VIEW ================== */
          <motion.div
            key="history-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col h-full justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800/60">
                <button
                  onClick={() => setShowHistoryPage(false)}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer bg-gray-900 border border-gray-800 px-2 py-1 rounded"
                >
                  <ArrowLeft className="w-4 h-4" /> {getTranslation("backToCalc", language)}
                </button>
                <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5 uppercase">
                  {getTranslation("tapeHistory", language)} ({history.length})
                </span>
                {history.length > 0 ? (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {getTranslation("clearAll", language)}
                  </button>
                ) : (
                  <div className="w-12" />
                )}
              </div>

              {/* History List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {history.length > 0 ? (
                  history.map((h, i) => (
                    <div
                      key={i}
                      className="bg-[#0A0A16] border border-gray-900/80 rounded-xl p-3 flex flex-col items-end text-right font-mono"
                    >
                      <div className="text-xs text-gray-500 mb-1 max-w-full truncate">{h.eq}</div>
                      <div className="text-base text-violet-400 font-bold">= {h.res}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 text-xs italic">
                    {getTranslation("noCalculations", language)}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Tip */}
            <div className="mt-4 p-2.5 bg-gray-950/40 border border-gray-850/30 rounded-xl text-[10px] text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>{getTranslation("calcStorageTip", language)}</span>
            </div>
          </motion.div>
        ) : (
          /* ================== MAIN CALCULATOR VIEW ================== */
          <motion.div
            key="calculator-page"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header Ribbon with ← Back + Title + History Icon */}
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-gray-800/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-[#1C1C3F] border border-gray-800/80 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  {getTranslation("backBtn", language)}
                </button>
                <div className="h-5 w-px bg-gray-800/80" />
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{getTranslation("module1Name", language)}</h3>
                  <p className="text-[8px] text-gray-500 font-mono tracking-wider">REALTIME MATH</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Clock button to access history */}
                <button
                  id="calc-history-btn"
                  onClick={() => setShowHistoryPage(true)}
                  className="w-7 h-7 rounded-lg bg-gray-900 hover:bg-[#1C1C3F] border border-gray-800/80 flex items-center justify-center text-violet-400 transition-colors cursor-pointer relative"
                  title={getTranslation("tapeHistory", language)}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full border border-[#0B0B16] animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Display Panel */}
            <div id="calc-display" className="bg-[#0A0A16] border border-gray-850/70 rounded-xl p-2.5 mb-2 text-right shadow-2xl relative group overflow-hidden">
              {/* Subtle Ambient Light Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Top Line: Expression Tape */}
              <div className="text-xs text-gray-400 font-mono tracking-wide h-5 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth flex items-center justify-end">
                {equation ? (
                  <span className="text-gray-500">{equation}</span>
                ) : expression ? (
                  <span>{expression}</span>
                ) : (
                  <span className="opacity-25 italic text-[10px]">{getTranslation("typeEquation", language)}</span>
                )}
              </div>

              {/* Bottom Line: Live computed result */}
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight mt-1 overflow-x-auto scrollbar-none whitespace-nowrap">
                {isFinished ? (
                  <span className="text-violet-400 font-mono">{expression || "0"}</span>
                ) : (
                  <span className="text-violet-300 font-mono">{liveResult}</span>
                )}
              </div>

              {/* Secondary Status Badges */}
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-900/50">
                {memory !== 0 ? (
                  <span className="text-[9px] font-mono text-violet-400 bg-violet-400/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
                    M: {memory}
                  </span>
                ) : (
                  <span />
                )}
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold tracking-widest ${isDegreeMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                  {isDegreeMode ? getTranslation("degMode", language) : getTranslation("radMode", language)}
                </span>
              </div>
            </div>

            {/* Memory Command Bar */}
            <div className="grid grid-cols-4 gap-1 mb-1.5">
              {["MC", "MR", "M+", "M-"].map((action) => (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.02, backgroundColor: "#1C1C3F" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMemory(action)}
                  className="h-7 sm:h-8 flex items-center justify-center rounded-lg bg-[#121226] text-[9px] sm:text-[10px] font-bold font-mono text-violet-300 border border-violet-500/10 cursor-pointer shadow-md"
                >
                  {action}
                </motion.button>
              ))}
            </div>

            {/* Scientific / Function Grid */}
            <div className="grid grid-cols-5 gap-1 mb-1.5">
              {["sin", "cos", "tan", "ln", "log", "π", "e", "^", "√", isDegreeMode ? "DEG" : "RAD"].map((sci) => {
                const isAngleToggle = sci === "DEG" || sci === "RAD";
                return (
                  <motion.button
                    key={sci}
                    whileHover={{ scale: 1.03, backgroundColor: isAngleToggle ? "#312E81" : "#111827" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSciPress(isAngleToggle ? "DEG" : sci)}
                    className={`h-7 sm:h-8 flex items-center justify-center rounded-lg text-[9px] font-bold border cursor-pointer text-center shadow-sm ${
                      isAngleToggle 
                        ? "bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border-amber-500/20" 
                        : "bg-gray-950/80 hover:bg-gray-900 text-violet-400 border-violet-500/5"
                    }`}
                  >
                    {sci}
                  </motion.button>
                );
              })}
            </div>

            {/* Chunky Main Tap-Pad */}
            <div className="grid grid-cols-4 gap-1.5">
              {buttons.flat().map((btn) => {
                const isOperator = ["÷", "×", "−", "+", "="].includes(btn);
                const isClear = ["C", "DEL", "%"].includes(btn);
                const displayChar = btn === "*" ? "×" : btn === "/" ? "÷" : btn;

                return (
                  <motion.button
                    key={btn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeyPress(btn)}
                    className={`h-13 sm:h-14 md:h-15 rounded-2xl flex items-center justify-center font-mono text-lg sm:text-xl md:text-2xl font-bold transition-colors cursor-pointer shadow-lg relative overflow-hidden ${
                      btn === "="
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xl border border-violet-500/30"
                        : isOperator
                        ? "bg-[#180F2B] hover:bg-[#251642] text-violet-400 border border-violet-500/15"
                        : isClear
                        ? "bg-[#1B1B26] hover:bg-[#252535] text-amber-400 border border-gray-800/40"
                        : "bg-[#1F1F2E] hover:bg-[#29293D] text-gray-100 border border-gray-800/20"
                    }`}
                  >
                    {/* Active pressed glossy accent */}
                    <span className="absolute inset-0 bg-white/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {btn === "+/-" ? "±" : displayChar}
                  </motion.button>
                );
              })}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
