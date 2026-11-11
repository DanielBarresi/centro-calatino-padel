import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductThumb from '../components/ProductThumb';
import { useStore } from '../context/StoreContext';
import { lineColor } from '../lineColors';
import { formatPrice } from '../utils';

// Req. 1: catalogo con filtro per categoria (+ ricerca testuale come extra)
export default function Catalog() {
  const { products, loading, cart, addToCart, maxQuantity, cartCount, cartTotal, config } = useStore();
  const { labels, categories, rules } = config;
  const [category, setCategory] = useState<string>(''); // '' = tutte
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)),
  );

  const inCart = (id: string) => cart.find((i) => i.productId === id)?.quantity ?? 0;

  return (
    <section>
      <div className="page-head">
        <h1>{labels.catalogTitle}</h1>
        <p className="muted">
          {labels.tagline}
          {rules.MIN_TOTAL > 0 && ` Ordine minimo ${formatPrice(rules.MIN_TOTAL)}.`}
        </p>
      </div>

      <div className="filters">
        <input type="search" placeholder={labels.searchPlaceholder} value={search}
          onChange={(e) => setSearch(e.target.value)} aria-label={labels.searchPlaceholder} />
        <div className="chips" role="group" aria-label="Filtra per categoria">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} className={`chip ${category === c ? 'chip--on' : ''}`}
              onClick={() => setCategory(c)} aria-pressed={category === c}>
              {c && <span className="dot" style={{ background: lineColor(categories, c) }} aria-hidden />}
              {c || labels.allCategories}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="empty">Caricamento…</p>
      ) : visible.length === 0 ? (
        <p className="empty">{labels.noProducts}</p>
      ) : (
        <ul className="menu">
          {visible.map((p) => {
            const qty = inCart(p.id);
            const max = maxQuantity(p.id);
            const soldOut = p.stock === 0;
            return (
              <li key={p.id} className={`item ${soldOut ? 'item--off' : ''}`}
                style={{ '--c': lineColor(categories, p.category) } as React.CSSProperties}>
                <ProductThumb product={p} />
                <div className="item__body">
                  <h3>{p.name}</h3>
                  {p.description && <p className="muted small">{p.description}</p>}
                  <p className="item__meta">
                    <span className="item__cat">{p.category}</span>
                    <span className={`stock ${p.stock > 0 && p.stock <= 3 ? 'stock--low' : ''}`}>
                      {soldOut ? 'Esaurito' : p.stock <= 3 ? `Solo ${p.stock} ${p.stock === 1 ? 'disponibile' : 'disponibili'}` : `Disponibili: ${p.stock}`}
                    </span>
                  </p>
                </div>
                <strong className="price">{formatPrice(p.price)}</strong>
                <button className="btn" disabled={soldOut || qty >= max} onClick={() => addToCart(p.id)}>
                  {soldOut ? 'Esaurito' : qty >= max ? 'Massimo' : qty ? `Aggiungi · ${qty}` : 'Aggiungi'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {cartCount > 0 && (
        <Link to="/carrello" className="floating-cart">
          <span className="container floating-cart__inner">
            <span><strong>{cartCount}</strong> {cartCount === 1 ? 'prodotto' : 'prodotti'} · {formatPrice(cartTotal)}</span>
            <span className="floating-cart__go">Vai al carrello →</span>
          </span>
        </Link>
      )}
    </section>
  );
}
