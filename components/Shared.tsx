import React, { useEffect, useRef } from 'react';
import { LucideIcon, Check } from 'lucide-react';
import katex from 'katex';

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        active 
          ? 'bg-white text-purple-900 font-medium shadow-lg' 
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow';
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-400 to-orange-500'
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4 shadow-inner`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-purple-300 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

interface StepProps {
  num: number;
  label: string;
  active: boolean;
  completed: boolean;
}

export const Step: React.FC<StepProps> = ({ num, label, active, completed }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition duration-300 ${
        completed 
          ? 'bg-green-500 text-white' 
          : active 
          ? 'bg-white text-purple-900 scale-110 shadow-lg' 
          : 'bg-white/20 text-white'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : num}
      </div>
      <span className={`font-medium transition-colors duration-300 ${active || completed ? 'text-white' : 'text-purple-300'}`}>
        {label}
      </span>
    </div>
  );
};

// --- Rich Text & LaTeX Renderer ---

export const RichTextRenderer: React.FC<{ content: string, className?: string }> = ({ content, className = "" }) => {
  // 1. Process Markdown-like syntax
  const processMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let listItems: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        if (listItems.length > 0) { elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>); listItems = []; }
        elements.push(<h3 key={index} className="text-lg font-bold text-yellow-400 mt-6 mb-2">{renderContentWithLatex(line.replace('### ', ''))}</h3>);
      } 
      else if (line.startsWith('## ')) {
        if (listItems.length > 0) { elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>); listItems = []; }
        elements.push(<h4 key={index} className="text-md font-bold text-blue-300 mt-4 mb-2">{renderContentWithLatex(line.replace('## ', ''))}</h4>);
      }
      // Lists
      else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        listItems.push(<li key={`li-${index}`} className="text-white/90 leading-relaxed pl-1">{renderContentWithLatex(content)}</li>);
      }
      // Standard Paragraphs
      else if (line.trim().length > 0) {
        if (listItems.length > 0) { elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>); listItems = []; }
        elements.push(<p key={index} className="mb-3 text-white/90 leading-relaxed">{renderContentWithLatex(line)}</p>);
      }
    });
    
    if (listItems.length > 0) { elements.push(<ul key={`ul-end`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>); }

    return elements;
  };

  // 2. Tokenize logic to separate raw text from LaTeX math blocks
  const renderContentWithLatex = (text: string): React.ReactNode => {
    // Regex matches $$...$$ OR $...$
    // Using a capture group to include the delimiter in the split results for easier processing
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\n$]+?\$)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math
        return <LatexSpan key={i} latex={part.slice(2, -2)} display={true} />;
      } 
      else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline math
        return <LatexSpan key={i} latex={part.slice(1, -1)} display={false} />;
      } 
      else {
        // Text segment: Process markdown styles (bold)
        return <span key={i}>{processBold(part)}</span>;
      }
    });
  };

  const processBold = (text: string): React.ReactNode => {
    // Split by bold syntax **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className={`rich-text ${className}`}>{processMarkdown(content || "")}</div>;
};

// Isolated component for KaTeX to ensure precision and prevent re-render duplication issues
const LatexSpan: React.FC<{ latex: string, display: boolean }> = ({ latex, display }) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    
    useEffect(() => {
        if (spanRef.current) {
            try {
                katex.render(latex, spanRef.current, {
                    throwOnError: false,
                    displayMode: display,
                    output: 'mathml', // Better for accessibility and performance usually
                });
            } catch (e) {
                console.error("KaTeX Error:", e);
                spanRef.current.innerText = latex; // Fallback to raw tex
            }
        }
    }, [latex, display]);

    return <span ref={spanRef} />;
}