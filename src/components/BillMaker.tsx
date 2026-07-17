import { useState, useEffect, useRef } from "react";
import { Receipt, Plus, Trash2, Printer, CheckCircle, Share2, RefreshCw, AlertTriangle } from "lucide-react";
import { useCurrency } from "../CurrencyContext";
import { jsPDF } from "jspdf";
import { getTranslation } from "../translations";

interface BillItem {
  id: string;
  name: string;
  qty: string | number;
  unit: string;
  rate: string | number;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  time: string;
  items: BillItem[];
  subtotal: number;
  isGstEnabled: boolean;
  gstPercent: number;
  totalGstAmount: number;
  grandTotal: number;
  currency: string;
  symbol: string;
}

interface BillMakerProps {
  shopName?: string;
  onHistoryChanged?: () => void;
  language: string;
}

export default function BillMaker({ shopName = "", onHistoryChanged, language }: BillMakerProps) {
  const { symbol } = useCurrency();
  
  // Load invoice history from localStorage
  const [history, setHistory] = useState<SavedInvoice[]>(() => {
    const saved = localStorage.getItem("bill_invoice_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse bill_invoice_history from localStorage", e);
      }
    }
    return [];
  });

  const onHistoryChangedRef = useRef(onHistoryChanged);
  useEffect(() => {
    onHistoryChangedRef.current = onHistoryChanged;
  }, [onHistoryChanged]);

  useEffect(() => {
    onHistoryChangedRef.current?.();
  }, [history]);

  const [showHistory, setShowHistory] = useState(false);
  const [liveDateTime, setLiveDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Automatically generate unique invoice number if empty
  useEffect(() => {
    if (!invoiceNumber) {
      const nextNum = 101 + history.length;
      setInvoiceNumber(`GGS-${nextNum}`);
    }
  }, [history, invoiceNumber]);
  
  const [items, setItems] = useState<BillItem[]>([]);

  const receiptRef = useRef<HTMLDivElement>(null);

  const [gstPercent, setGstPercent] = useState<number>(() => {
    const saved = localStorage.getItem("bill_gst_percent");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 18;
  });

  const [isCustomGst, setIsCustomGst] = useState<boolean>(() => {
    const saved = localStorage.getItem("bill_gst_is_custom");
    return saved ? saved === "true" : false;
  });

  const [customGstPercent, setCustomGstPercent] = useState<string>(() => {
    return localStorage.getItem("bill_custom_gst_percent") || "18";
  });

  const [customGstInputValue, setCustomGstInputValue] = useState<string>(() => {
    return localStorage.getItem("bill_custom_gst_percent") || "18";
  });

  useEffect(() => {
    setCustomGstInputValue(customGstPercent);
  }, [customGstPercent]);

  const activeTaxPercent = isCustomGst ? (parseFloat(customGstPercent) || 0) : gstPercent;

  const formatGstPart = (totalPct: number) => {
    const part = totalPct / 2;
    return part % 1 === 0 ? part.toString() : Number(part.toFixed(3)).toString();
  };

  const [isGstEnabled, setIsGstEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("bill_gst_enabled");
    return saved ? saved === "true" : true;
  });

  const [printStatus, setPrintStatus] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("bill_gst_percent", gstPercent.toString());
    localStorage.setItem("bill_gst_enabled", isGstEnabled.toString());
    localStorage.setItem("bill_gst_is_custom", isCustomGst.toString());
    localStorage.setItem("bill_custom_gst_percent", customGstPercent);
  }, [gstPercent, isGstEnabled, isCustomGst, customGstPercent]);

  const handleAddItem = () => {
    const nextId = Date.now().toString();
    const newItem: BillItem = {
      id: nextId,
      name: "",
      qty: "",
      unit: "pcs",
      rate: "",
    };
    setItems((prev) => [...prev, newItem]);
    
    setTimeout(() => {
      const nameInput = document.getElementById(`name-input-${nextId}`);
      if (nameInput) {
        nameInput.focus();
      }
    }, 120);
  };

  const handleUpdateItem = (id: string, key: keyof BillItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let parsedVal = value;
          if (key === "qty" || key === "rate") {
            parsedVal = value;
          }
          return { ...item, [key]: parsedVal };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetBill = () => {
    setCustomerName("");
    const nextNum = 101 + history.length + Math.floor(Math.random() * 5); // ensure random offset for next if they want new
    setInvoiceNumber(`GGS-${nextNum}`);
    setItems([]);
  };

  // Calculations (Safely fallback to 0 when rate/qty are empty/null/NaN)
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.qty as string) || 0) * (parseFloat(item.rate as string) || 0), 0);
  const gstRate = isGstEnabled ? activeTaxPercent : 0;
  const totalGstAmount = subtotal * (gstRate / 100);
  const cgst = totalGstAmount / 2;
  const sgst = totalGstAmount / 2;
  const grandTotal = subtotal + totalGstAmount;

  // Save the current bill dynamically to the persistent invoice history
  const saveToHistory = () => {
    const newInvoice: SavedInvoice = {
      id: Date.now().toString(),
      invoiceNumber: invoiceNumber || `GGS-${101 + history.length}`,
      customerName: customerName || "Walk-in Customer",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
      isGstEnabled,
      gstPercent: activeTaxPercent,
      totalGstAmount,
      grandTotal,
      currency: "INR",
      symbol: "₹",
    };

    setHistory((prev) => {
      // Avoid exact invoice duplication, replace if matching invoiceNumber, otherwise prepend
      const filtered = prev.filter((inv) => inv.invoiceNumber !== newInvoice.invoiceNumber);
      const updated = [newInvoice, ...filtered];
      localStorage.setItem("bill_invoice_history", JSON.stringify(updated));
      return updated;
    });
  };

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // We'll use "helvetica" which is standard in jsPDF and highly compatible
    doc.setFont("helvetica", "bold");
    
    // Title / Shop Name
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39); // deep slate / gray-900
    doc.text(shopName, 105, 20, { align: "center" });

    // Subtitle/Tagline (GST Tax Invoice)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text("GST Tax Invoice / Retail Bill", 105, 26, { align: "center" });

    // Elegant dividing line
    doc.setDrawColor(209, 213, 219); // gray-300
    doc.setLineWidth(0.5);
    doc.line(15, 32, 195, 32);

    // Invoice Meta Section
    // Left side: Invoice details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81); // gray-700
    doc.text("Invoice Details", 15, 40);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Invoice No: ", 15, 46);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(invoiceNumber || "N/A", 40, 46);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Date: ", 15, 52);
    doc.setTextColor(17, 24, 39);
    
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    doc.text(`${currentDate} ${currentTime}`, 40, 52);

    // Right side: Customer details
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text("Billed To", 120, 40);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Customer: ", 120, 46);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(customerName || "Walk-in Customer", 142, 46);

    // Another dividing line
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(15, 58, 195, 58);

    // Table Headers
    let y = 66;
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(15, y - 5, 180, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text("S.No.", 18, y);
    doc.text("Item Name", 32, y);
    doc.text("Qty / Unit", 110, y, { align: "right" });
    doc.text("Rate", 145, y, { align: "right" });
    doc.text("Amount", 190, y, { align: "right" });

    y += 8;

    // Table Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);

    const displaySymbol = symbol === "₹" ? "Rs." : symbol;

    if (items.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(156, 163, 175);
      doc.text("No Items added to the bill", 105, y + 4, { align: "center" });
      y += 12;
    } else {
      items.forEach((item, index) => {
        // Check page overflow
        if (y > 270) {
          doc.addPage();
          y = 20;
          
          // Print Headers on new page
          doc.setFillColor(243, 244, 246);
          doc.rect(15, y - 5, 180, 8, "F");
          doc.setFont("helvetica", "bold");
          doc.text("S.No.", 18, y);
          doc.text("Item Name", 32, y);
          doc.text("Qty / Unit", 110, y, { align: "right" });
          doc.text("Rate", 145, y, { align: "right" });
          doc.text("Amount", 190, y, { align: "right" });
          y += 8;
          doc.setFont("helvetica", "normal");
        }

        const q = parseFloat(item.qty as string) || 0;
        const r = parseFloat(item.rate as string) || 0;
        const itemAmount = q * r;

        doc.text((index + 1).toString(), 18, y);
        
        // Support multi-line/truncated item name
        const maxNameWidth = 70;
        const splitName = doc.splitTextToSize(item.name || "Unnamed Item", maxNameWidth);
        doc.text(splitName, 32, y);

        const qtyText = `${item.qty} ${item.unit || "pcs"}`;
        doc.text(qtyText, 110, y, { align: "right" });
        doc.text(`${displaySymbol}${r.toFixed(2)}`, 145, y, { align: "right" });
        doc.text(`${displaySymbol}${itemAmount.toFixed(2)}`, 190, y, { align: "right" });

        // Handle vertical spacing based on name text height
        const linesCount = splitName.length;
        y += 5 + (linesCount - 1) * 4;

        // Draw thin line under item row
        doc.setDrawColor(243, 244, 246);
        doc.line(15, y - 3, 195, y - 3);
      });
    }

    y += 5;

    // Check page overflow for totals
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    // Totals Area
    const totalX = 130;
    const valX = 190;

    doc.setDrawColor(209, 213, 219);
    doc.line(15, y, 195, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Subtotal:", totalX, y);
    doc.setTextColor(17, 24, 39);
    doc.text(`${displaySymbol}${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valX, y, { align: "right" });

    if (isGstEnabled) {
      y += 6;
      doc.setTextColor(107, 114, 128);
      doc.text(`CGST (${formatGstPart(activeTaxPercent)}%):`, totalX, y);
      doc.setTextColor(17, 24, 39);
      doc.text(`${displaySymbol}${cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valX, y, { align: "right" });

      y += 6;
      doc.setTextColor(107, 114, 128);
      doc.text(`SGST (${formatGstPart(activeTaxPercent)}%):`, totalX, y);
      doc.setTextColor(17, 24, 39);
      doc.text(`${displaySymbol}${sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valX, y, { align: "right" });

      y += 6;
      doc.setDrawColor(229, 231, 235);
      doc.line(totalX, y - 3, 195, y - 3);
      doc.setTextColor(107, 114, 128);
      doc.text("Total GST:", totalX, y);
      doc.setTextColor(17, 24, 39);
      doc.text(`${displaySymbol}${totalGstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valX, y, { align: "right" });
    }

    y += 8;
    doc.setFillColor(243, 244, 246);
    doc.rect(totalX - 5, y - 5, 70, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Grand Total:", totalX, y);
    doc.setFontSize(11);
    doc.text(`${displaySymbol}${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valX, y, { align: "right" });

    // Terms and Greeting at bottom
    y += 20;
    if (y > 275) {
      doc.addPage();
      y = 25;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text("Terms & Conditions:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("1. All sales are final.", 15, y + 4);
    doc.text("2. Please retain this receipt for any reference.", 15, y + 8);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Thank you for your business!", 105, y + 18, { align: "center" });

    return doc;
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    // Save to local invoice history
    saveToHistory();
    setPrintStatus("Invoice Saved! Downloading PDF...");
    
    try {
      const doc = generatePDF();
      const fileName = `Invoice_${invoiceNumber || "Bill"}.pdf`;
      doc.save(fileName);
      setPrintStatus("PDF saved successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPrintStatus("Failed to generate PDF.");
    }
    
    setTimeout(() => {
      setPrintStatus("");
    }, 4000);
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    
    setPrintStatus("Generating PDF for sharing...");
    
    try {
      const doc = generatePDF();
      const pdfBlob = doc.output("blob");
      const fileName = `Invoice_${invoiceNumber || "Bill"}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoiceNumber}`,
          text: `Invoice from ${shopName}`,
        });
        setPrintStatus("Shared successfully!");
      } else {
        doc.save(fileName);
        setPrintStatus("Web Share not supported. PDF downloaded!");
      }
    } catch (error: any) {
      const isCancel = error && (
        error.name === "AbortError" || 
        String(error).toLowerCase().includes("cancel") || 
        String(error).toLowerCase().includes("abort") ||
        (error.message && String(error.message).toLowerCase().includes("cancel")) ||
        (error.message && String(error.message).toLowerCase().includes("abort"))
      );

      if (isCancel) {
        console.warn("PDF sharing was canceled by the user:", error);
        setPrintStatus("Share canceled");
      } else {
        console.error("Error sharing PDF:", error);
        try {
          const doc = generatePDF();
          doc.save(`Invoice_${invoiceNumber || "Bill"}.pdf`);
          setPrintStatus("PDF downloaded!");
        } catch (e) {
          setPrintStatus("Failed to generate PDF.");
        }
      }
    }
    
    setTimeout(() => {
      setPrintStatus("");
    }, 4000);
  };

  return (
    <div className="text-gray-100 p-1.5 pb-28">
      {/* CSS style block for printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide the main app root */
          #root {
            display: none !important;
          }
          /* Render the temp cloned container beautifully */
          #temp-print-container {
            display: block !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            background: #FCFBF4 !important;
            color: #111827 !important;
          }
        }
      `}</style>
      <div className="w-full max-w-md mx-auto">
        {/* Invoice input form */}
        <div className="space-y-3.5 mb-6">
          {/* Metadata Grid */}
          <div id="bill-customer-info" className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {getTranslation("clientName", language)}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={getTranslation("walkInCustomer", language)}
                className="w-full bg-[#07070F] border border-gray-800/80 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {getTranslation("invoiceNumber", language)}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={getTranslation("invoiceNo", language)}
                className="w-full bg-[#07070F] border border-gray-800/80 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-cyan-500/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Product Items Block */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-gray-900/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {getTranslation("productItems", language)}
                </span>
                <button
                  onClick={handleResetBill}
                  className="text-[8px] font-mono text-gray-400 hover:text-red-400 bg-gray-900/50 hover:bg-red-500/10 border border-gray-850 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
                  title="Clear all fields and reset"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> {getTranslation("clearBill", language)}
                </button>
              </div>
              <button 
                id="bill-add-item-btn"
                onClick={handleAddItem}
                className="text-[10px] text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" /> {getTranslation("addItem", language)}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                {getTranslation("noItemsAddedYet", language)}
              </div>
            ) : (
              <div>
                {/* Pinned Column Header Row */}
                <div className="grid grid-cols-12 gap-1.5 mb-1.5 px-1 text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                  <div className="col-span-5">{getTranslation("itemName", language)}</div>
                  <div className="col-span-2 text-center">{getTranslation("qty", language)}</div>
                  <div className="col-span-2 text-center">{getTranslation("unit", language)}</div>
                  <div className="col-span-2 text-right">{getTranslation("rate", language)}</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Scrollable inputs */}
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-1.5 items-center border-b border-gray-900/20 pb-1.5 last:border-0 last:pb-0">
                      <div className="col-span-5">
                        <input 
                          id={`name-input-${item.id}`}
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const qtyInput = document.getElementById(`qty-input-${item.id}`);
                              if (qtyInput) {
                                qtyInput.focus();
                              }
                            }
                          }}
                          placeholder="Item name"
                          className="w-full bg-[#07070F] border border-gray-850 rounded px-2 py-1 text-[11px] text-white focus:border-cyan-500/30 focus:outline-none placeholder-gray-600" 
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          id={`qty-input-${item.id}`}
                          type="number" 
                          inputMode="decimal"
                          step="any"
                          value={item.qty} 
                          onChange={(e) => handleUpdateItem(item.id, "qty", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const unitSelect = document.getElementById(`unit-select-${item.id}`);
                              if (unitSelect) {
                                unitSelect.focus();
                              }
                            }
                          }}
                          placeholder="Qty"
                          className="w-full text-center bg-[#07070F] border border-gray-850 rounded px-1 py-1 text-[11px] text-white focus:border-cyan-500/30 focus:outline-none placeholder-gray-600 font-mono" 
                        />
                      </div>
                      <div className="col-span-2">
                        <select 
                          id={`unit-select-${item.id}`}
                          value={item.unit} 
                          onChange={(e) => {
                            handleUpdateItem(item.id, "unit", e.target.value);
                            setTimeout(() => {
                              const rateInput = document.getElementById(`rate-input-${item.id}`);
                              if (rateInput) {
                                rateInput.focus();
                                (rateInput as HTMLInputElement).select();
                              }
                            }, 80);
                          }}
                          className="w-full text-center bg-[#07070F] border border-gray-850 rounded px-1 py-1 text-[11px] text-white focus:border-cyan-500/30 focus:outline-none cursor-pointer font-mono" 
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="gram">gram</option>
                          <option value="litre">litre</option>
                          <option value="box">box</option>
                          <option value="dozen">dozen</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input 
                          id={`rate-input-${item.id}`}
                          type="number" 
                          inputMode="decimal"
                          step="any"
                          value={item.rate} 
                          onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                          placeholder="Rate"
                          className="w-full text-right bg-[#07070F] border border-gray-850 rounded px-1.5 py-1 text-[11px] font-mono text-white focus:border-cyan-500/30 focus:outline-none placeholder-gray-600" 
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GST/Tax Toggles and Calculations */}
          <div className="bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300">
                {getTranslation("gstApplied", language)}
              </span>
              <div className="flex items-center gap-3">
                {isGstEnabled && (
                  <div className="flex items-center gap-1.5">
                    <select 
                      value={isCustomGst ? "custom" : gstPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setIsCustomGst(true);
                        } else {
                          setIsCustomGst(false);
                          setGstPercent(parseInt(val, 10));
                        }
                      }}
                      className="bg-gray-900 border border-gray-800 text-cyan-400 text-[10px] font-bold font-mono rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                      <option value="custom">{getTranslation("custom", language)}</option>
                    </select>

                    {isCustomGst && (
                      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5">
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          inputMode="decimal"
                          value={customGstInputValue}
                          onChange={(e) => setCustomGstInputValue(e.target.value)}
                          onBlur={() => {
                            setCustomGstPercent(customGstInputValue);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setCustomGstPercent(customGstInputValue);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="GST %"
                          className="w-12 bg-transparent text-cyan-400 text-[10px] font-bold font-mono text-center focus:outline-none placeholder-cyan-800/60"
                        />
                        <span className="text-[10px] text-cyan-400/50 font-mono">%</span>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={() => setIsGstEnabled(!isGstEnabled)}
                  className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${isGstEnabled ? "bg-cyan-600 justify-end" : "bg-gray-800 justify-start"}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-900/60 text-xs text-gray-400 font-mono">
              <div className="flex justify-between">
                <span>{getTranslation("subTotal", language)}</span>
                <span>{symbol}{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {isGstEnabled && (
                <>
                  <div className="flex justify-between text-cyan-400/80 text-[11px]">
                    <span>CGST ({formatGstPart(activeTaxPercent)}%)</span>
                    <span>{symbol}{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-cyan-400/80 text-[11px]">
                    <span>SGST ({formatGstPart(activeTaxPercent)}%)</span>
                    <span>{symbol}{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-dashed border-gray-800/80">
                <span>{getTranslation("grandTotal", language)}</span>
                <span>{symbol}{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RECEIPT STYLE PREVIEW BOX */}
        <div className="mb-4">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 text-center">Your Bill</p>
          
          <div id="print-receipt-area" ref={receiptRef} className="bg-[#FCFBF4] text-gray-900 rounded-xl p-4 shadow-xl border border-[#ECEAD9] font-mono relative overflow-hidden max-w-[280px] sm:max-w-[300px] mx-auto">
            {/* Soft decorative punched paper border simulation */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-300/40 via-transparent to-gray-300/40"></div>
            
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h4 className="text-sm font-bold tracking-tight uppercase">{shopName}</h4>
              <p className="text-[9px] text-gray-500">Invoice #{invoiceNumber}</p>
              <p className="text-[8px] text-gray-400 mt-0.5">Date: {liveDateTime.toLocaleDateString()} • {liveDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</p>
            </div>

            {/* Customer */}
            <div className="py-2 text-[9px] border-b border-dashed border-gray-200 text-gray-700">
              <span className="font-bold">Customer:</span> {customerName || "Walk-in Customer"}
            </div>

            {/* List items (Using beautiful wrapped layout for perfect multi-line wrapping and aligned details) */}
            <div className="space-y-2 py-2 text-[10px] text-gray-850 border-b border-dashed border-gray-200">
              {items.length === 0 ? (
                <div className="text-center text-gray-400 py-1 italic text-[9px]">No Items</div>
              ) : (
                items.map((item) => {
                  const q = parseFloat(item.qty as string) || 0;
                  const r = parseFloat(item.rate as string) || 0;
                  return (
                    <div key={item.id} className="border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                      {/* Item name - wrapped fully, never cut */}
                      <div className="font-bold text-gray-900 text-left leading-tight break-words text-[9.5px]">
                        {item.name || "Unnamed Item"}
                      </div>
                      {/* Item arithmetic details row */}
                      <div className="flex justify-between items-center text-[8.5px] text-gray-500 font-mono mt-0.5">
                        <span>
                          {q} {item.unit || "Pcs"} × {symbol}{r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="font-bold text-gray-900 font-mono text-right">
                          {symbol}{(q * r).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary */}
            <div className="pt-2 space-y-1 text-[9px] text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{symbol}{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
               {isGstEnabled && (
                <>
                  <div className="flex justify-between text-[8px] text-gray-500">
                    <span>CGST ({formatGstPart(activeTaxPercent)}%):</span>
                    <span className="font-mono">{symbol}{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-500">
                    <span>SGST ({formatGstPart(activeTaxPercent)}%):</span>
                    <span className="font-mono">{symbol}{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-[10px] pt-1.5 border-t border-dashed border-gray-300">
                <span className="uppercase tracking-wider">Grand Total:</span>
                <span className="text-xs font-bold font-mono text-black">{symbol}{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div id="bill-action-row" className="grid grid-cols-2 gap-2">
          <button 
            onClick={handlePrint}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs shadow-[0_4px_12px_rgba(14,116,144,0.3)] cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" /> {getTranslation("saveAsPdf", language)}
          </button>
          
          <button 
            onClick={handleShare}
            className="bg-gray-900 hover:bg-gray-850 border border-gray-850 text-cyan-400 font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs cursor-pointer transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" /> {getTranslation("sharePdf", language)}
          </button>
        </div>

        {/* Printing Status Message */}
        {printStatus && (
          <div className="mt-3.5 p-3 bg-cyan-950/40 border border-cyan-800/30 rounded-xl text-xs text-cyan-400 flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{printStatus}</span>
          </div>
        )}

        {/* Collapsible Invoice History Manager */}
        <div className="mt-4 border-t border-gray-800/40 pt-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between bg-[#0F0F23] hover:bg-[#12122A] border border-gray-800/50 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-300 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>{getTranslation("invoiceHistory", language)} ({history.length})</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              {showHistory 
                ? `${getTranslation("collapse", language)} ▲` 
                : `${getTranslation("expand", language)} ▼`}
            </span>
          </button>
          
          {showHistory && (
            <div className="mt-2.5 space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 bg-[#07070F] rounded-xl border border-gray-900/40">
                  {getTranslation("noSavedInvoicesYet", language)}
                </div>
              ) : (
                history.map((inv) => (
                  <div key={inv.id} className="bg-[#07070F] border border-gray-900/80 rounded-xl p-3 flex flex-col gap-1.5 hover:border-cyan-500/20 transition-all">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-gray-900/40 pb-1.5">
                      <span className="font-bold text-white">{inv.invoiceNumber}</span>
                      <span className="text-gray-500 text-[9px]">{inv.date} • {inv.time}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span className="truncate max-w-[150px]">
                        {getTranslation("custPrefix", language)} <strong className="text-gray-200">{inv.customerName}</strong>
                      </span>
                      <span className="font-bold text-cyan-400 font-mono">{inv.symbol}{inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-1 border-t border-gray-900/30">
                      <button 
                        onClick={() => {
                          setInvoiceNumber(inv.invoiceNumber);
                          setCustomerName(inv.customerName);
                          setItems(inv.items);
                          setIsGstEnabled(inv.isGstEnabled);
                          if ([5, 12, 18, 28].includes(inv.gstPercent)) {
                            setGstPercent(inv.gstPercent);
                            setIsCustomGst(false);
                          } else {
                            setIsCustomGst(true);
                            setCustomGstPercent(inv.gstPercent.toString());
                          }
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        {getTranslation("loadToEditor", language)}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(inv.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        {getTranslation("delete", language)}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
                {language === "hi" ? "बिल हटाएं?" : "Delete Invoice?"}
              </h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {language === "hi" ? "क्या आप वाकई इस बिल को इतिहास से हटाना चाहते हैं?" : "Are you sure you want to remove this invoice from your history?"}
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
                  setHistory((prev) => {
                    const updated = prev.filter((x) => x.id !== deleteConfirmId);
                    localStorage.setItem("bill_invoice_history", JSON.stringify(updated));
                    return updated;
                  });
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
