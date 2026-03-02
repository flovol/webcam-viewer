"use client";

import { useState } from "react";

interface NonPrintableChar {
  char: string;
  position: number;
  unicode: string;
  description: string;
}

export default function RemoveAIWatermarkPage() {
  const [inputText, setInputText] = useState("");
  const [nonPrintableChars, setNonPrintableChars] = useState<NonPrintableChar[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const detectNonPrintableChars = () => {
    const found: NonPrintableChar[] = [];
    
    for (let i = 0; i < inputText.length; i++) {
      const char = inputText[i];
      const code = char.charCodeAt(0);
      
      // Check for various non-printable and special characters
      // Common AI watermark characters include zero-width characters and other invisible Unicode
      const isNonPrintable = 
        code < 32 && code !== 10 && code !== 13 && code !== 9 || // Control characters (except newline, carriage return, tab)
        code === 127 || // DEL
        (code >= 0x200B && code <= 0x200F) || // Zero-width characters
        (code >= 0x202A && code <= 0x202E) || // Text direction marks
        code === 0x202F || // Narrow No-Break Space (Hauptverdächtiger bei GPT-4o)
        code === 0x00A0 || // No-Break Space (HTML: &nbsp;)
        code === 0xFEFF || // Zero-width no-break space (BOM)
        code === 0x00AD || // Soft hyphen
        (code >= 0x2060 && code <= 0x2064) || // Word joiner and invisible operators/function separators
        (code >= 0xFFF0 && code <= 0xFFFF); // Specials

      if (isNonPrintable) {
        let description = "";
        
        if (code === 0x202F) description = "Narrow No-Break Space (⚠️ GPT-4o Hauptverdächtiger)";
        else if (code === 0x200B) description = "Zero-Width Space";
        else if (code === 0x2060) description = "Word Joiner";
        else if (code === 0x00A0) description = "No-Break Space (HTML: &nbsp;)";
        else if (code === 0x200C) description = "Zero-Width Non-Joiner";
        else if (code === 0x200D) description = "Zero-Width Joiner";
        else if (code === 0x2061) description = "Function Application (unsichtbar)";
        else if (code === 0x2062) description = "Invisible Times (unsichtbar)";
        else if (code === 0x2063) description = "Invisible Separator (unsichtbar)";
        else if (code === 0x2064) description = "Invisible Plus (unsichtbar)";
        else if (code === 0x200E) description = "Left-to-Right Mark";
        else if (code === 0x200F) description = "Right-to-Left Mark";
        else if (code === 0x202A) description = "Left-to-Right Embedding";
        else if (code === 0x202B) description = "Right-to-Left Embedding";
        else if (code === 0x202C) description = "Pop Directional Formatting";
        else if (code === 0x202D) description = "Left-to-Right Override";
        else if (code === 0x202E) description = "Right-to-Left Override";
        else if (code === 0xFEFF) description = "Zero-Width No-Break Space (BOM)";
        else if (code === 0x00AD) description = "Soft Hyphen";
        else if (code < 32) description = `Control Character (${code})`;
        else if (code === 127) description = "Delete Character";
        else description = "Non-Printable Character";

        found.push({
          char: char,
          position: i,
          unicode: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
          description: description
        });
      }
    }
    
    setNonPrintableChars(found);
    setHasChecked(true);
  };

  const removeNonPrintableChars = () => {
    const cleaned = inputText.replace(/[\u200B-\u200F\u202A-\u202F\u00A0\uFEFF\u00AD\u2060-\u2064]/g, '');
    setInputText(cleaned);
    detectNonPrintableChars();
  };

  const copyCleanedText = () => {
    const cleaned = inputText.replace(/[\u200B-\u200F\u202A-\u202F\u00A0\uFEFF\u00AD\u2060-\u2064]/g, '');
    navigator.clipboard.writeText(cleaned);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">AI Watermark Detector</h1>
        <p className="text-gray-300 mb-8">
          Erkennt versteckte, nicht-druckbare Zeichen die oft von AI-Tools als Wasserzeichen verwendet werden
        </p>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <label htmlFor="textInput" className="block text-white font-semibold mb-2">
            Text eingeben:
          </label>
          <textarea
            id="textInput"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setHasChecked(false);
            }}
            className="w-full h-64 p-4 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            placeholder="Füge hier deinen Text ein..."
          />
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={detectNonPrintableChars}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Check starten
            </button>
            
            {nonPrintableChars.length > 0 && (
              <>
                <button
                  onClick={removeNonPrintableChars}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Alle entfernen
                </button>
                <button
                  onClick={copyCleanedText}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Bereinigten Text kopieren
                </button>
              </>
            )}
          </div>
        </div>

        {hasChecked && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ergebnis: {nonPrintableChars.length} nicht-druckbare Zeichen gefunden
            </h2>
            
            {nonPrintableChars.length === 0 ? (
              <p className="text-green-400 text-lg">
                ✓ Keine versteckten Zeichen gefunden! Der Text ist sauber.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-yellow-400 mb-4">
                  ⚠ Folgende nicht-druckbare Zeichen wurden erkannt:
                </p>
                <div className="max-h-96 overflow-y-auto">
                  {nonPrintableChars.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/20 rounded p-3 mb-2"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Position:</span>
                          <span className="text-white ml-2 font-mono">{item.position}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Unicode:</span>
                          <span className="text-white ml-2 font-mono">{item.unicode}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Typ:</span>
                          <span className="text-white ml-2">{item.description}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white/5 backdrop-blur-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-3">Häufige AI Wasserzeichen:</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• <span className="font-mono text-red-400">U+202F</span> - Narrow No-Break Space <span className="text-red-400 font-semibold">(⚠️ Hauptverdächtiger bei GPT-4o)</span></li>
            <li>• <span className="font-mono text-purple-400">U+200B</span> - Zero-Width Space</li>
            <li>• <span className="font-mono text-purple-400">U+2060</span> - Word Joiner</li>
            <li>• <span className="font-mono text-yellow-400">U+00A0</span> - No-Break Space (HTML: &amp;nbsp;)</li>
            <li>• <span className="font-mono text-purple-400">U+200C</span> - Zero-Width Non-Joiner</li>
            <li>• <span className="font-mono text-purple-400">U+200D</span> - Zero-Width Joiner</li>
            <li>• <span className="font-mono text-purple-400">U+2061-2064</span> - Unsichtbare Funktionstrenner</li>
            <li>• <span className="font-mono text-purple-400">U+FEFF</span> - Byte Order Mark (BOM)</li>
            <li>• Verschiedene Text-Richtungsmarker (U+202A - U+202E)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
