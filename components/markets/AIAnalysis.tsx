'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Brain, Zap } from 'lucide-react';

interface AIAnalysisProps {
  question: string;
  description?: string;
  currentPrice?: number;
}

export function AIAnalysis({ question, description, currentPrice }: AIAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { mutate, data, isPending, error, reset } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, description, currentPrice }),
      });
      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }
      const json = await response.json();
      return json.analysis as string;
    },
  });

  const handleAnalyze = () => {
    reset();
    mutate();
    if (!isExpanded) setIsExpanded(true);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold flex items-center gap-2">
              AI Analysis
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-[hsl(200,95%,50%)]/20 text-primary font-medium">
                Live Search
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time web search powered insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!data && !isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyze();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[hsl(200,95%,50%)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Analyze
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {/* Loading State */}
          {isPending && (
            <div className="p-6">
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="relative">
                  <Zap className="w-8 h-8 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Searching the web...</p>
                  <p className="text-sm text-muted-foreground">
                    Finding latest news and data for analysis
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded shimmer" style={{ width: `${80 - i * 15}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6">
              <div className="flex items-center gap-3 text-destructive mb-4">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to generate analysis</span>
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Analysis Content */}
          {data && (
            <div className="p-6">
              <div className="prose prose-sm prose-invert max-w-none">
                <div
                  className="text-sm leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: formatAnalysis(data) }}
                />
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Live web search analysis. Not financial advice.
                </p>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isPending && !error && !data && (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Get Live AI Insights</h4>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Our AI searches the web in real-time for the latest news and data
                to provide you with up-to-date market analysis.
              </p>
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-[hsl(200,95%,50%)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity glow"
              >
                <Sparkles className="w-5 h-5" />
                Generate Analysis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatAnalysis(markdown: string): string {
  // Convert markdown to HTML
  let html = markdown
    // Remove markdown links but keep text: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove any remaining raw URLs
    .replace(/https?:\/\/[^\s)]+/g, '')
    // Color-coded section headers
    .replace(/\*\*Latest News\*\*:?/g, '<span class="inline-flex items-center gap-1.5 text-primary font-semibold"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Latest</span><br/>')
    .replace(/\*\*Bull Case\*\*:?/g, '<span class="inline-flex items-center gap-1.5 text-success font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>Bull Case</span><br/>')
    .replace(/\*\*Bear Case\*\*:?/g, '<span class="inline-flex items-center gap-1.5 text-destructive font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>Bear Case</span><br/>')
    .replace(/\*\*Verdict\*\*:?\s*(Overvalued)/gi, '<span class="inline-flex items-center gap-1.5 text-destructive font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>Overvalued</span><br/>')
    .replace(/\*\*Verdict\*\*:?\s*(Undervalued)/gi, '<span class="inline-flex items-center gap-1.5 text-success font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Undervalued</span><br/>')
    .replace(/\*\*Verdict\*\*:?\s*(Fairly [Pp]riced)/gi, '<span class="inline-flex items-center gap-1.5 text-yellow-500 font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Fairly Priced</span><br/>')
    // Generic verdict fallback
    .replace(/\*\*Verdict\*\*:?/g, '<span class="inline-flex items-center gap-1.5 text-yellow-500 font-semibold mt-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>Verdict</span><br/>')
    // Other bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
    // Wrap lists
    .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul class="space-y-1 my-2">$&</ul>');

  return `<div class="space-y-1">${html}</div>`;
}
