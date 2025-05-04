
  import {
    useSortable,
  } from '@dnd-kit/sortable';
  import { CSS } from '@dnd-kit/utilities';
  import Card from '@/components/Card';
  import { Card as CardType } from '@/lib/deck';


export default function SortableCard({ card, id }: { card: CardType; id: string }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card card={card} />
      </div>
    );
  }