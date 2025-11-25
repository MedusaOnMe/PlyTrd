'use client';

import { useCallback, useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultLayout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

interface DraggableGridProps {
  items: GridItem[];
  onLayoutChange?: (layouts: Layouts) => void;
  savedLayouts?: Layouts;
  cols?: { lg: number; md: number; sm: number; xs: number };
  rowHeight?: number;
  maxRows?: number;
  className?: string;
}

export function DraggableGrid({
  items,
  onLayoutChange,
  savedLayouts,
  cols = { lg: 12, md: 12, sm: 6, xs: 4 },
  rowHeight = 80,
  maxRows = 8,
  className,
}: DraggableGridProps) {
  const [hiddenPanels, setHiddenPanels] = useState<Set<string>>(new Set());
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);

  // Generate default layouts from items
  const generateDefaultLayouts = useCallback((): Layouts => {
    const layout: Layout[] = items.map((item) => ({
      i: item.id,
      x: item.defaultLayout.x,
      y: item.defaultLayout.y,
      w: item.defaultLayout.w,
      h: item.defaultLayout.h,
      minW: item.defaultLayout.minW || 2,
      minH: item.defaultLayout.minH || 2,
      maxW: item.defaultLayout.maxW || 12,
      maxH: item.defaultLayout.maxH || maxRows,
    }));

    return {
      lg: layout,
      md: layout.map((l) => ({ ...l })),
      sm: layout.map((l) => ({ ...l, w: Math.min(l.w, 6), x: 0 })),
      xs: layout.map((l) => ({ ...l, w: 4, x: 0 })),
    };
  }, [items, maxRows]);

  // Use controlled state for layouts
  const [currentLayouts, setCurrentLayouts] = useState<Layouts>(() => {
    return savedLayouts || generateDefaultLayouts();
  });

  // Update layouts when savedLayouts prop changes
  useEffect(() => {
    if (savedLayouts) {
      setCurrentLayouts(savedLayouts);
    }
  }, [savedLayouts]);

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      // Update local state immediately
      setCurrentLayouts(allLayouts);
      // Notify parent
      onLayoutChange?.(allLayouts);
    },
    [onLayoutChange]
  );

  const togglePanel = useCallback((id: string) => {
    setHiddenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setMaximizedPanel((prev) => (prev === id ? null : id));
  }, []);

  // Filter visible items
  const visibleItems = items.filter((item) => !hiddenPanels.has(item.id));

  // If a panel is maximized, show only that panel
  if (maximizedPanel) {
    const item = items.find((i) => i.id === maximizedPanel);
    if (item) {
      return (
        <div className={`relative ${className || ''}`}>
          <div className="panel h-[calc(100vh-200px)] flex flex-col">
            <PanelHeader
              title={item.title}
              id={item.id}
              isMaximized={true}
              onClose={() => togglePanel(item.id)}
              onMaximize={() => toggleMaximize(item.id)}
            />
            <div className="flex-1 overflow-auto p-3">{item.content}</div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Hidden panels bar */}
      {hiddenPanels.size > 0 && (
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Hidden:</span>
          {items
            .filter((item) => hiddenPanels.has(item.id))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => togglePanel(item.id)}
                className="px-2 py-1 text-xs glass glass-hover rounded"
              >
                {item.title}
              </button>
            ))}
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={currentLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={cols}
        rowHeight={rowHeight}
        maxRows={maxRows}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={true}
        isBounded={true}
        isResizable={true}
        isDraggable={true}
        useCSSTransforms={true}
      >
        {visibleItems.map((item) => (
          <div key={item.id} className="panel flex flex-col overflow-hidden">
            <PanelHeader
              title={item.title}
              id={item.id}
              isMaximized={false}
              onClose={() => togglePanel(item.id)}
              onMaximize={() => toggleMaximize(item.id)}
            />
            <div className="flex-1 overflow-auto">{item.content}</div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  id: string;
  isMaximized: boolean;
  onClose: () => void;
  onMaximize: () => void;
}

function PanelHeader({ title, isMaximized, onClose, onMaximize }: PanelHeaderProps) {
  return (
    <div className="panel-header flex items-center justify-between border-b border-white/5 cursor-move drag-handle">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
        <span className="panel-title">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Minimize2 className="w-3 h-3" />
          ) : (
            <Maximize2 className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Hide panel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
