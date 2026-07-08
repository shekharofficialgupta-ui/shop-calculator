import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Notebook, Plus, Trash2, Edit2, Search, Copy, Check, X, AlertTriangle } from "lucide-react";
import { getTranslation, translations } from "../translations";

interface Memo {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
}

interface NotebookScreenProps {
  language: string;
}

export default function NotebookScreen({ language }: NotebookScreenProps) {
  const [memos, setMemos] = useState<Memo[]>(() => {
    const saved = localStorage.getItem("shop_notebook_memos");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Expanded status for compact/truncated memo view
  const [expandedMemoIds, setExpandedMemoIds] = useState<Record<string, boolean>>({});

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTag, setFormTag] = useState("GENERAL");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-grow ref for Textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("shop_notebook_memos", JSON.stringify(memos));
  }, [memos]);

  // Adjust textarea height dynamically and keep active cursor visible
  useLayoutEffect(() => {
    const target = textareaRef.current;
    if (target) {
      target.style.height = "auto";
      const scrollHeight = target.scrollHeight;
      // Grows up to 380px before showing internal scroll
      const maxHeight = 380;
      target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;

      // Auto-scroll logic: keep typing cursor visible inside viewport
      const selectionEnd = target.selectionEnd;
      if (selectionEnd !== null) {
        if (target.scrollHeight > target.clientHeight) {
          if (selectionEnd >= target.value.length - 15) {
            target.scrollTop = target.scrollHeight;
          }
        }
      }
    }
  }, [formContent, isAdding]);

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    if (editingMemoId) {
      // Edit mode
      setMemos((prev) =>
        prev.map((m) =>
          m.id === editingMemoId
            ? {
                ...m,
                title: formTitle.trim(),
                content: formContent.trim(),
                tag: formTag.toUpperCase(),
              }
            : m
        )
      );
      setEditingMemoId(null);
    } else {
      // Add mode
      const newMemo: Memo = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        content: formContent.trim(),
        tag: formTag.toUpperCase() || "GENERAL",
        createdAt: (() => {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, "0");
          const monthsEn = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
                    const monthsHi = [
            "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
            "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
          ];
          const monthsMr = [
            "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
            "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
          ];
          const monthsGu = [
            "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
            "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
          ];
          const monthsTa = [
            "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
            "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
          ];
          const monthsTe = [
            "జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్",
            "జూలై", "ఆగస్టు", "సెప్టెంబరు", "అక్టోబరు", "నవంబరు", "డిసెంబరు"
          ];

          let monthName = monthsEn[now.getMonth()];
          let prefix = "Created: ";
          let localeCode = "en-US";

          if (language === "hi") {
            monthName = monthsHi[now.getMonth()];
            prefix = "बनाया गया: ";
            localeCode = "hi-IN";
          } else if (language === "mr") {
            monthName = monthsMr[now.getMonth()];
            prefix = "तयार केले: ";
            localeCode = "mr-IN";
          } else if (language === "gu") {
            monthName = monthsGu[now.getMonth()];
            prefix = "બનાવ્યું: ";
            localeCode = "gu-IN";
          } else if (language === "ta") {
            monthName = monthsTa[now.getMonth()];
            prefix = "உருவாக்கப்பட்டது: ";
            localeCode = "ta-IN";
          } else if (language === "te") {
            monthName = monthsTe[now.getMonth()];
            prefix = "సృష్టించబడింది: ";
            localeCode = "te-IN";
          }

          const year = now.getFullYear();
          const timeStr = now.toLocaleTimeString(localeCode, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          return `${prefix}${day} ${monthName} ${year}, ${timeStr}`;
        })(),
      };
      setMemos((prev) => [newMemo, ...prev]);
    }

    // Reset Form
    setFormTitle("");
    setFormContent("");
    setFormTag("GENERAL");
    setIsAdding(false);
  };

  const handleEditInit = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setFormTitle(memo.title);
    setFormContent(memo.content);
    setFormTag(memo.tag);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
    if (editingMemoId === id) {
      setIsAdding(false);
      setEditingMemoId(null);
      setFormTitle("");
      setFormContent("");
      setFormTag("GENERAL");
    }
  };

  const handleCopy = (memo: Memo) => {
    const fullText = `*${memo.title}*\n${memo.content}\n[Tag: ${memo.tag}]`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(memo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedMemoIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Tag color styles
  const getTagStyles = (tag: string) => {
    const upper = tag.toUpperCase();
    switch (upper) {
      case "GENERAL":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "UDHAAR LOG":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "INVENTORY":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "TAX FILING":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "REMINDER":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
  };

  // Tag translations helper
  const getTagTranslation = (tag: string) => {
    const upper = tag.toUpperCase();
    switch (upper) {
      case "GENERAL": return getTranslation("general", language);
      case "UDHAAR LOG": return getTranslation("udhaarLog", language);
      case "INVENTORY": return getTranslation("inventory", language);
      case "TAX FILING": return getTranslation("taxFiling", language);
      case "REMINDER": return getTranslation("reminder", language);
      default: return tag;
    }
  };

  // Word & character counters for active content
  const charCount = formContent.length;
  const wordCount = formContent.trim() === "" ? 0 : formContent.trim().split(/\s+/).length;

  const filteredMemos = memos.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tag.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "ALL" || m.tag.toUpperCase() === selectedCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="text-gray-100 p-1 sm:p-2 min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        {/* Module Header - 35% more compact layout */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-900/40">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-rose-600/10 border border-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
              <Notebook className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-white tracking-tight leading-tight">{getTranslation("module7Name", language)}</h3>
              <p className="text-[7px] text-gray-500 font-mono scale-95 origin-left">{getTranslation("module07", language)} • STORE MEMOS</p>
            </div>
          </div>
          <span className="text-[7.5px] font-mono bg-rose-400/10 text-rose-400 px-1.5 py-0.2 rounded font-bold">
            {getTranslation("autoSaved", language)}
          </span>
        </div>

        {/* Form panel for adding/editing memos (FULL SCREEN VIEW) */}
        {isAdding ? (
          <div className="fixed inset-0 z-50 bg-[#0A0A14] flex flex-col h-screen overflow-hidden animate-fadeIn text-gray-100">
            {/* Full screen editor header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-900/60 bg-[#0F0F23]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingMemoId(null);
                    setFormTitle("");
                    setFormContent("");
                    setFormTag("GENERAL");
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {editingMemoId 
                    ? getTranslation("editMemo", language) 
                    : getTranslation("createNewMemo", language)}
                </h4>
              </div>
              <span className="text-[9px] font-mono bg-rose-400/10 text-rose-400 px-2.5 py-0.5 rounded font-bold">
                {getTranslation("autoSavingDraft", language)}
              </span>
            </div>

            {/* Scrollable Form body - full screen content comfort */}
            <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto p-4 pb-36 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{getTranslation("memoTitle", language)}</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={getTranslation("memoTitlePlaceholder", language)}
                  className="w-full bg-[#0F0F23] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/30 font-medium placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{getTranslation("memoCategory", language)}</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-[#0F0F23] border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/30"
                  >
                    <option value="GENERAL">{getTranslation("generalMemoOpt", language)}</option>
                    <option value="UDHAAR LOG">{getTranslation("udhaarLogOpt", language)}</option>
                    <option value="INVENTORY">{getTranslation("inventoryOpt", language)}</option>
                    <option value="TAX FILING">{getTranslation("taxFilingOpt", language)}</option>
                    <option value="REMINDER">{getTranslation("reminderOpt", language)}</option>
                  </select>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-mono pt-4">
                  <span>{wordCount} {getTranslation("wordCount", language)} • {charCount} {getTranslation("charCount", language)}</span>
                </div>
              </div>

              <div className="flex flex-col flex-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{getTranslation("memoDetails", language)} (Full View)</label>
                <textarea
                  ref={textareaRef}
                  required
                  maxLength={2000}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={getTranslation("memoDetailsPlaceholder", language)}
                  className="w-full bg-[#0F0F23] border border-gray-800 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-rose-500/30 leading-relaxed resize-none overflow-y-auto placeholder:text-gray-600 min-h-[300px]"
                ></textarea>
              </div>
            </form>

            {/* Fixed bottom action buttons at screen bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F0F23]/95 backdrop-blur-md border-t border-gray-800/60 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] flex gap-3 max-w-md mx-auto rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.6)]">
              <button
                type="submit"
                onClick={handleCreateOrUpdate}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl py-3 text-xs tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-950/20"
              >
                {editingMemoId ? getTranslation("saveChanges", language) : getTranslation("createMemo", language)}
              </button>
              {editingMemoId ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(editingMemoId)}
                  className="bg-red-950/40 hover:bg-red-900/30 border border-red-800/40 text-red-300 font-bold rounded-xl px-5 py-3 text-xs tracking-wider uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{getTranslation("delete", language)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingMemoId(null);
                    setFormTitle("");
                    setFormContent("");
                    setFormTag("GENERAL");
                  }}
                  className="bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold rounded-xl px-5 py-3 text-xs tracking-wider uppercase transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {getTranslation("cancel", language)}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Notebook search/add actions and dynamic filter pills */}
            <div className="space-y-2.5 mb-2.5">
              <div id="notebook-search-row" className="flex gap-2">
                <div className="flex-1 bg-[#0F0F23] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={getTranslation("searchMemosPlaceholder", language)}
                    className="bg-transparent border-none w-full focus:outline-none text-xs text-gray-200"
                  />
                </div>
                <button
                  onClick={() => setIsAdding(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg px-3 py-1.5 text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> {getTranslation("newMemoBtn", language)}
                </button>
              </div>

              {/* Category horizontal scrolling pills filter */}
              <div id="notebook-tags-row" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {["ALL", "GENERAL", "UDHAAR LOG", "INVENTORY", "TAX FILING", "REMINDER"].map((cat) => {
                  const isActive = selectedCategory === cat;
                  let displayCat = cat;
                  if (cat === "ALL") displayCat = getTranslation("allNotesFilter", language);
                  else if (cat === "GENERAL") displayCat = getTranslation("general", language);
                  else if (cat === "UDHAAR LOG") displayCat = getTranslation("udhaarLog", language);
                  else if (cat === "INVENTORY") displayCat = getTranslation("inventory", language);
                  else if (cat === "TAX FILING") displayCat = getTranslation("taxFiling", language);
                  else if (cat === "REMINDER") displayCat = getTranslation("reminder", language);

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all border cursor-pointer ${
                        isActive
                          ? "bg-rose-600/25 text-rose-300 border-rose-500/40 shadow-sm"
                          : "bg-[#0F0F23]/40 text-gray-400 border-gray-850 hover:text-white"
                      }`}
                    >
                      {displayCat}
                    </button>
                  );
                })}
              </div>

              {/* Notes Count & Active Category Header */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono px-1 py-0.5 border-t border-gray-900/40 pt-2">
                <span className="font-bold text-gray-400">
                  {filteredMemos.length} {filteredMemos.length === 1 ? getTranslation("noteLabel", language) : getTranslation("notesLabel", language)}
                </span>
                <span>{getTranslation("activeCategory", language)}: {selectedCategory === "ALL" ? getTranslation("all", language) : getTagTranslation(selectedCategory)}</span>
              </div>
            </div>

            {/* List of Memos - responsive max height to prevent page scrolling */}
            <div className="space-y-3 overflow-y-auto pr-1">
              {filteredMemos.length === 0 ? (
                <div className="text-center py-16 px-4 bg-[#0F0F23]/40 rounded-2xl border border-gray-900/60 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500">
                    <Notebook className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{getTranslation("noNotesYet", language)}</p>
                </div>
              ) : (
                filteredMemos.map((memo) => {
                  const isExpanded = !!expandedMemoIds[memo.id];
                  return (
                    <div 
                      key={memo.id} 
                      onClick={() => toggleExpand(memo.id)}
                      className={`bg-[#0F0F23] border border-gray-800/50 rounded-xl p-3 hover:border-rose-500/20 transition-all relative group cursor-pointer ${
                        isExpanded ? "ring-1 ring-rose-500/15" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-white tracking-tight">{memo.title}</span>
                        
                        {/* Action triggers (Copy, Edit, Delete with proper Modal) */}
                        <div 
                          className="flex items-center gap-2 text-gray-500 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCopy(memo)}
                            className="hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Copy content"
                          >
                            {copiedId === memo.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => handleEditInit(memo)}
                            className="hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Edit note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(memo.id)}
                            className="hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Truncated line preview or expanded content */}
                      <p className={`text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}>
                        {memo.content}
                      </p>
                      
                      {!isExpanded && (memo.content.split("\n").length > 2 || memo.content.length > 80) && (
                        <div className="text-[9px] text-rose-400/80 font-medium mt-1">{getTranslation("tapToReadFull", language)}</div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-gray-900/60 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                        <span>{memo.createdAt}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider ${getTagStyles(memo.tag)}`}>
                          {getTagTranslation(memo.tag)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* SECURE DELETE CONFIRMATION MODAL DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#12122A] border border-gray-800 rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{getTranslation("deleteMemoConfirm", language)}</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {getTranslation("deleteMemoDesc", language)}
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
                  handleDelete(deleteConfirmId);
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
