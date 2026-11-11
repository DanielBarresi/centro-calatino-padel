import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductThumb from '../components/ProductThumb';
import { useStore } from '../context/StoreContext';
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
        <div className="grid">
          {visible.map((p) => {
            const qty = inCart(p.id);
            const max = maxQuantity(p.id);
            const soldOut = p.stock === 0;
            return (
              <article key={p.id} className={`card ${soldOut ? 'card--off' : ''}`}>
                <ProductThumb product={p} />
                <div className="card__body">
                  <span className="card__cat">{p.category}</span>
                  <h3>{p.name}</h3>
                  {p.description && <p className="muted small">{p.description}</p>}
                  <p className={`stock ${p.stock > 0 && p.stock <= 3 ? 'stock--low' : ''}`}>
                    {soldOut ? 'Esaurito' : p.stock <= 3 ? `Solo ${p.stock} ${p.stock === 1 ? 'disponibile' : 'disponibili'}` : `Disponibili: ${p.stock}`}
                  </p>
                  <div className="card__foot">
                    <strong className="price">{formatPrice(p.price)}</strong>
                    <button className="btn" disabled={soldOut || qty >= max} onClick={() => addToCart(p.id)}>
                      {soldOut ? 'Esaurito' : qty >= max ? 'Massimo raggiunto' : qty ? `Aggiungi (${qty})` : 'Aggiungi'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <Link to="/carrello" className="floating-cart">
          Vai al carrello ({cartCount}) · {formatPrice(cartTotal)}
        </Link>
      )}
    </section>
  );
}
