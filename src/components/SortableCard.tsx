import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from '@/components/Card';
import { Card as CardType } from '@/lib/deck';

export default function SortableCard({
  card,
  id,
  onDoubleClick,
  highlight = false,
}: {
  card: CardType;
  id: string;
  onDoubleClick: () => void;
  highlight: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer"
    >
      <Card card={card} highlight={highlight} />
    </div>
  );
}
