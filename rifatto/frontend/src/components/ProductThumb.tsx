import { useState } from 'react';
import type { Product } from '../types';

// Immagine del prodotto. Se manca, o non si carica (link rotto, niente internet),
// mostro un riquadro grigio con l'icona: la card non resta mai vuota.
export default function ProductThumb({ product, small = false }: { product: Product; small?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showImage = product.image && !broken;

  return (
    <div className={`thumb ${small ? 'thumb--small' : ''}`}>
      {showImage ? (
        <img src={product.image} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden>{product.icon ?? '🛍️'}</span>
      )}
    </div>
  );
}
