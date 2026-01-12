import React from 'react';
import { LucideIcon, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  return (
    <div className={`rich-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom overrides can be added here if CSS class based styling in index.html isn't enough
          // Currently, index.html defines .rich-text styles for h3, h4, p, etc.
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
};