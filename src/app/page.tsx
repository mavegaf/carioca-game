'use client';

import { DeckProvider } from '@/contexts/DeckContext';
import CariocaGame from './CariocaGame';

export default function Page() {
    return (
        <DeckProvider>
            <CariocaGame />
        </DeckProvider>
    );
}
