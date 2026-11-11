import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { lineColor } from '../lineColors';
import type { Product } from '../types';

// Immagine del prodotto. Se manca o non si carica, mostro un quadrato
// col colore della "linea" (categoria) e l'icona: la riga non resta mai vuota.
export default function ProductThumb({ product, small = false }: { product: Product; small?: boolean }) {
  const { categories } = useStore().config;
  const [broken, setBroken] = useState(false);
  const showImage = product.image && !broken;

  return (
    <div className={`thumb ${small ? 'thumb--small' : ''}`}
      style={{ '--c': lineColor(categories, product.category) } as React.CSSProperties}>
      {showImage ? (
        <img src={product.image} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden>{product.icon ?? product.name.charAt(0)}</span>
      )}
    </div>
  );
}
