'use client';

import { useMutation } from '@tanstack/react-query';
import { Sparkles, RefreshCw, AlertCircle, Brain, Zap } from 'lucide-react';

interface AIAnalysisProps {
  question: string;
  description?: string;
  currentPrice?: number;
}

export function AIAnalysis({ question, description, currentPrice }: AIAnalysisProps) {
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
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              AI Analysis
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-[hsl(200,95%,50%)]/20 text-primary font-medium">
                Live
              </span>
            </h3>
          </div>
        </div>
        {!data && !isPending && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-[hsl(200,95%,50%)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3 h-3" />
            Analyze
          </button>
        )}
      </div>

      {/* Content - always visible */}
      <div className="flex-1 overflow-hidden">
          {/* Loading State */}
          {isPending && (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <div className="relative mb-3">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse" />
              </div>
              <p className="text-sm font-medium">Searching the web...</p>
              <p className="text-xs text-muted-foreground">
                Finding latest news and data
              </p>
              <div className="space-y-2 mt-4 w-full max-w-xs">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 bg-muted rounded shimmer" style={{ width: `${90 - i * 20}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <div className="flex items-center gap-2 text-destructive mb-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Failed to generate analysis</span>
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            </div>
          )}

          {/* Analysis Content */}
          {data && (
            <div className="h-full flex flex-col p-3">
              <div className="flex-1 overflow-auto prose prose-sm prose-invert max-w-none">
                <div
                  className="text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatAnalysis(data) }}
                />
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between mt-2">
                <p className="text-[10px] text-muted-foreground">
                  Not financial advice
                </p>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isPending && !error && !data && (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">Get Live AI Insights</h4>
              <p className="text-xs text-muted-foreground mb-3 max-w-xs">
                Click Analyze for real-time web search powered insights
              </p>
            </div>
          )}
      </div>
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
