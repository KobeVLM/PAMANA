import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WordTile {
  id: string
  word: string
}

export interface WordTilesProps {
  items: WordTile[]
  onReorder: (items: WordTile[]) => void
  disabled?: boolean
  /** Highlights the tile awaiting a click-swap partner. */
  selectedIndex?: number | null
  /** Enables click/tap-to-swap on focusable tiles. */
  onSelectIndex?: (index: number) => void
  ariaLabel?: string
  className?: string
}

interface SortableTileProps {
  item: WordTile
  index: number
  isSelected: boolean
  disabled: boolean
  onSelectIndex?: (index: number) => void
}

function SortableTile({
  item,
  index,
  isSelected,
  disabled,
  onSelectIndex,
}: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled })

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!disabled && onSelectIndex) onSelectIndex(index)
      }}
      disabled={disabled}
      className={cn(
        "game-tile flex min-h-[56px] items-center gap-2.5 rounded-2xl border-2 px-5 py-3.5 font-heading text-base font-bold shadow-md transition-all duration-200 select-none sm:text-lg",
        disabled
          ? "cursor-default opacity-85"
          : "cursor-grab hover:scale-105 hover:border-pamana-gold/70 active:cursor-grabbing active:scale-95",
        isDragging && "z-10 scale-105 border-pamana-gold opacity-80",
        isSelected
          ? "animate-pulse border-pamana-gold bg-pamana-gold/30 text-amber-200 shadow-lg shadow-amber-500/20 ring-2 ring-pamana-gold"
          : "border-white/20 bg-white/10 text-white"
      )}
    >
      <GripVertical
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isSelected ? "text-amber-300" : "text-white/40"
        )}
        aria-hidden="true"
      />
      <span>{item.word}</span>
    </button>
  )
}

/**
 * Reorderable word tiles with pointer, touch and keyboard drag support,
 * plus optional click/tap-to-swap. Shared by the sentence module and practice.
 */
export function WordTiles({
  items,
  onReorder,
  disabled = false,
  selectedIndex = null,
  onSelectIndex,
  ariaLabel = "Mga salita",
  className,
}: WordTilesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from === -1 || to === -1) return
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div
          role="group"
          aria-label={ariaLabel}
          className={cn(
            "flex min-h-[76px] flex-wrap items-center gap-2.5 rounded-xl bg-black/20 p-3 sm:gap-3",
            className
          )}
        >
          {items.map((item, idx) => (
            <SortableTile
              key={item.id}
              item={item}
              index={idx}
              isSelected={selectedIndex === idx}
              disabled={disabled}
              onSelectIndex={onSelectIndex}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
