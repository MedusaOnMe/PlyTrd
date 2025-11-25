'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GripVertical, X, Maximize2, Minimize2, Save, RotateCcw } from 'lucide-react';

export interface LayoutComponent {
  id: string;
  title: string;
  content: React.ReactNode;
  fixedWidth?: number; // Fixed column width (out of 12), defaults to flexible
}

// Position in the layout - column-based with optional vertical stacking
export interface LayoutPosition {
  row: 'top' | 'bottom';
  order: number; // Column position: 0, 1, 2
  stack?: 'full' | 'top' | 'bottom'; // Vertical position within column (default: 'full')
}

// Maps component IDs to their positions
export type LayoutAssignment = Record<string, LayoutPosition>;

interface SlotBasedLayoutProps {
  components: LayoutComponent[];
  defaultAssignment: LayoutAssignment;
  savedAssignment?: LayoutAssignment;
  onSave?: (assignment: LayoutAssignment) => void;
  onReset?: () => void;
  onClose?: () => void;
  editable?: boolean;
  className?: string;
}

export function SlotBasedLayout({
  components,
  defaultAssignment,
  savedAssignment,
  onSave,
  onReset,
  onClose,
  editable = true,
  className,
}: SlotBasedLayoutProps) {
  const [assignment, setAssignment] = useState<LayoutAssignment>(
    savedAssignment || defaultAssignment
  );
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ row: 'top' | 'bottom'; order: number; stack: 'full' | 'top' | 'bottom' } | null>(null);
  const [maximizedComponent, setMaximizedComponent] = useState<string | null>(null);
  const [hiddenComponents, setHiddenComponents] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (savedAssignment) {
      setAssignment(savedAssignment);
      setHasChanges(false);
    }
  }, [savedAssignment]);

  // Get columns in top row - group components by order, then by stack position
  const topRowColumns = useMemo(() => {
    const columnsMap = new Map<number, { top?: LayoutComponent; bottom?: LayoutComponent; full?: LayoutComponent }>();

    components
      .filter((c) => assignment[c.id]?.row === 'top' && !hiddenComponents.has(c.id))
      .forEach((c) => {
        const pos = assignment[c.id];
        const order = pos.order;
        const stack = pos.stack || 'full';

        if (!columnsMap.has(order)) {
          columnsMap.set(order, {});
        }
        const col = columnsMap.get(order)!;
        col[stack] = c;
      });

    // Convert to sorted array
    return Array.from(columnsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([order, col]) => ({ order, ...col }));
  }, [components, assignment, hiddenComponents]);

  // Get bottom row components
  const bottomRowComponents = useMemo(() => {
    return components
      .filter((c) => assignment[c.id]?.row === 'bottom' && !hiddenComponents.has(c.id))
      .sort((a, b) => (assignment[a.id]?.order ?? 0) - (assignment[b.id]?.order ?? 0));
  }, [components, assignment, hiddenComponents]);

  // Calculate column width
  const getColumnWidth = useCallback(
    (column: { order: number; top?: LayoutComponent; bottom?: LayoutComponent; full?: LayoutComponent }) => {
      // Use fixed width from any component in the column
      const comp = column.full || column.top || column.bottom;
      if (comp?.fixedWidth) return comp.fixedWidth;

      // Distribute remaining space
      const fixedTotal = topRowColumns
        .filter((c) => (c.full?.fixedWidth || c.top?.fixedWidth || c.bottom?.fixedWidth))
        .reduce((sum, c) => sum + ((c.full?.fixedWidth || c.top?.fixedWidth || c.bottom?.fixedWidth) || 0), 0);
      const flexCount = topRowColumns.filter((c) => !(c.full?.fixedWidth || c.top?.fixedWidth || c.bottom?.fixedWidth)).length;

      if (flexCount === 0) return 12;
      return Math.floor((12 - fixedTotal) / flexCount);
    },
    [topRowColumns]
  );

  // Handle drag start
  const handleDragStart = useCallback((componentId: string) => {
    setDraggedComponent(componentId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, row: 'top' | 'bottom', order: number, stack: 'full' | 'top' | 'bottom') => {
      e.preventDefault();
      if (draggedComponent) {
        setDragOverTarget({ row, order, stack });
      }
    },
    [draggedComponent]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // Handle drop - swap or move to target position
  const handleDrop = useCallback(
    (targetRow: 'top' | 'bottom', targetOrder: number, targetStack: 'full' | 'top' | 'bottom') => {
      if (!draggedComponent) return;

      const draggedPos = assignment[draggedComponent];

      // Find component at target position
      const targetComponentId = Object.entries(assignment).find(
        ([id, pos]) => pos.row === targetRow && pos.order === targetOrder && (pos.stack || 'full') === targetStack
      )?.[0];

      const newAssignment = { ...assignment };

      // Move dragged component to target position
      newAssignment[draggedComponent] = { row: targetRow, order: targetOrder, stack: targetStack };

      // If there was a component at target, move it to dragged's original position
      if (targetComponentId && targetComponentId !== draggedComponent) {
        newAssignment[targetComponentId] = {
          row: draggedPos.row,
          order: draggedPos.order,
          stack: draggedPos.stack || 'full'
        };
      }

      setAssignment(newAssignment);
      setHasChanges(true);
      setDraggedComponent(null);
      setDragOverTarget(null);
    },
    [draggedComponent, assignment]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedComponent(null);
    setDragOverTarget(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(assignment);
    setHasChanges(false);
    onClose?.();
  }, [assignment, onSave, onClose]);

  const handleReset = useCallback(() => {
    setAssignment(defaultAssignment);
    setHasChanges(true);
    onReset?.();
  }, [defaultAssignment, onReset]);

  const toggleMaximize = useCallback((componentId: string) => {
    setMaximizedComponent((prev) => (prev === componentId ? null : componentId));
  }, []);

  const toggleHide = useCallback((componentId: string) => {
    setHiddenComponents((prev) => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  }, []);

  // Maximized view
  if (maximizedComponent) {
    const component = components.find((c) => c.id === maximizedComponent);
    if (component) {
      return (
        <div className={`relative ${className || ''}`}>
          <div className="panel h-[calc(100vh-200px)] flex flex-col">
            <PanelHeader
              title={component.title}
              isMaximized={true}
              editable={editable}
              onMaximize={() => toggleMaximize(component.id)}
              onHide={() => toggleHide(component.id)}
            />
            <div className="flex-1 overflow-auto">{component.content}</div>
          </div>
        </div>
      );
    }
  }

  const topRowHeight = 'h-[calc(100vh-380px)]';
  const halfHeight = 'h-[calc((100vh-380px)/2-6px)]'; // Half height minus gap

  return (
    <div className={`relative ${className || ''}`}>
      {/* Toolbar - only show when editable */}
      {editable && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {hiddenComponents.size > 0 && (
              <>
                <span className="text-xs text-muted-foreground">Hidden:</span>
                {components
                  .filter((c) => hiddenComponents.has(c.id))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleHide(c.id)}
                      className="px-2 py-1 text-xs glass glass-hover rounded"
                    >
                      {c.title}
                    </button>
                  ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-warning">Unsaved changes</span>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-xs glass glass-hover rounded"
              title="Reset to default layout"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
              title="Save layout and exit"
            >
              <Save className="w-3 h-3" />
              Save & Close
            </button>
          </div>
        </div>
      )}

      {/* Top Row */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {topRowColumns.map((column) => {
          const width = getColumnWidth(column);
          const hasStacked = (column.top && column.bottom) || (!column.full && (column.top || column.bottom));

          return (
            <div
              key={column.order}
              className={`${topRowHeight}`}
              style={{ gridColumn: `span ${width}` }}
            >
              {column.full ? (
                // Single full-height component
                <ComponentPanel
                  component={column.full}
                  position={{ row: 'top', order: column.order, stack: 'full' }}
                  height="h-full"
                  editable={editable}
                  isDragging={draggedComponent === column.full.id}
                  isDragOver={dragOverTarget?.row === 'top' && dragOverTarget?.order === column.order && dragOverTarget?.stack === 'full'}
                  onDragStart={() => handleDragStart(column.full!.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 'top', column.order, 'full')}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop('top', column.order, 'full')}
                  onMaximize={() => toggleMaximize(column.full!.id)}
                  onHide={() => toggleHide(column.full!.id)}
                />
              ) : (
                // Stacked components
                <div className="flex flex-col gap-3 h-full">
                  {column.top ? (
                    <ComponentPanel
                      component={column.top}
                      position={{ row: 'top', order: column.order, stack: 'top' }}
                      height="flex-1"
                      editable={editable}
                      isDragging={draggedComponent === column.top.id}
                      isDragOver={dragOverTarget?.row === 'top' && dragOverTarget?.order === column.order && dragOverTarget?.stack === 'top'}
                      onDragStart={() => handleDragStart(column.top!.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, 'top', column.order, 'top')}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop('top', column.order, 'top')}
                      onMaximize={() => toggleMaximize(column.top!.id)}
                      onHide={() => toggleHide(column.top!.id)}
                    />
                  ) : (
                    // Empty top slot for dropping
                    editable && (
                      <div
                        className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground transition-all ${
                          dragOverTarget?.row === 'top' && dragOverTarget?.order === column.order && dragOverTarget?.stack === 'top'
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'top', column.order, 'top')}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop('top', column.order, 'top')}
                      >
                        Drop here (top)
                      </div>
                    )
                  )}
                  {column.bottom ? (
                    <ComponentPanel
                      component={column.bottom}
                      position={{ row: 'top', order: column.order, stack: 'bottom' }}
                      height="flex-1"
                      editable={editable}
                      isDragging={draggedComponent === column.bottom.id}
                      isDragOver={dragOverTarget?.row === 'top' && dragOverTarget?.order === column.order && dragOverTarget?.stack === 'bottom'}
                      onDragStart={() => handleDragStart(column.bottom!.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, 'top', column.order, 'bottom')}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop('top', column.order, 'bottom')}
                      onMaximize={() => toggleMaximize(column.bottom!.id)}
                      onHide={() => toggleHide(column.bottom!.id)}
                    />
                  ) : (
                    // Empty bottom slot for dropping
                    editable && (
                      <div
                        className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground transition-all ${
                          dragOverTarget?.row === 'top' && dragOverTarget?.order === column.order && dragOverTarget?.stack === 'bottom'
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'top', column.order, 'bottom')}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop('top', column.order, 'bottom')}
                      >
                        Drop here (bottom)
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-3">
        {bottomRowComponents.map((component) => {
          const pos = assignment[component.id];
          const isDragOver = editable && dragOverTarget?.row === 'bottom' && dragOverTarget?.order === pos.order;
          const isDragging = editable && draggedComponent === component.id;
          const bottomCount = bottomRowComponents.length;
          const colSpan = bottomCount === 1 ? 12 : Math.floor(12 / bottomCount);
          // Generous heights for bottom row panels
          const height = bottomCount === 1 ? 'h-[280px]' : 'h-[300px]';

          return (
            <div
              key={component.id}
              className={`${height}`}
              style={{ gridColumn: `span ${colSpan}` }}
            >
              <ComponentPanel
                component={component}
                position={pos}
                height="h-full"
                editable={editable}
                isDragging={isDragging}
                isDragOver={isDragOver}
                onDragStart={() => handleDragStart(component.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, 'bottom', pos.order, 'full')}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop('bottom', pos.order, 'full')}
                onMaximize={() => toggleMaximize(component.id)}
                onHide={() => toggleHide(component.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ComponentPanelProps {
  component: LayoutComponent;
  position: LayoutPosition;
  height: string;
  editable: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onMaximize: () => void;
  onHide: () => void;
}

function ComponentPanel({
  component,
  height,
  editable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMaximize,
  onHide,
}: ComponentPanelProps) {
  return (
    <div
      className={`${height}`}
      onDragOver={editable ? onDragOver : undefined}
      onDragLeave={editable ? onDragLeave : undefined}
      onDrop={editable ? onDrop : undefined}
    >
      <div
        className={`panel h-full flex flex-col transition-all ${
          isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
      >
        <PanelHeader
          title={component.title}
          isMaximized={false}
          isDragging={isDragging}
          editable={editable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onMaximize={onMaximize}
          onHide={onHide}
        />
        <div className="flex-1 overflow-auto">{component.content}</div>
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  isMaximized: boolean;
  isDragging?: boolean;
  editable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMaximize: () => void;
  onHide: () => void;
}

function PanelHeader({
  title,
  isMaximized,
  isDragging,
  editable = true,
  onDragStart,
  onDragEnd,
  onMaximize,
  onHide,
}: PanelHeaderProps) {
  const canDrag = editable && !isMaximized;

  return (
    <div
      className={`panel-header flex items-center justify-between border-b border-white/5 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
    >
      <div className="flex items-center gap-2">
        {canDrag && (
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        )}
        <span className="panel-title">{title}</span>
      </div>
      {editable && (
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
              onHide();
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Hide panel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// Re-export types for backwards compatibility
export type { LayoutAssignment as SlotAssignment };
