import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductThumb from '../components/ProductThumb';
import SlotPicker from '../components/SlotPicker';
import { useStore } from '../context/StoreContext';
import { formatPrice, formatSlot } from '../utils';

// Req. 2 (carrello), 3 (slot e conferma), 4 (slot pieni), 5 (minimo), 6 (limiti di quantità)
export default function Cart() {
  // Leggo dalla lavagna
  const { cart, products, slots, config, cartTotal, setQuantity, removeFromCart, maxQuantity, confirmOrder, refreshAll } = useStore();
  const { labels, rules } = config;
  const navigate = useNavigate();

  // Le memorie della cassa
  const [name, setName] = useState('');
  const [slot, setSlot] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Appena si apre il carrello ricarico scorte e slot
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshAll(); }, []);

  // Stato DERIVATO: se lo slot scelto nel frattempo si riempie o inizia, non vale più
  const chosenSlot = slots.find((s) => s.id === slot)?.available ? slot : '';

  // Unisco ogni riga del carrello con i dati del suo prodotto
  const items = cart.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });

  // Quanto manca al minimo (mai negativo)
  const missing = Math.max(0, rules.MIN_TOTAL - cartTotal);

  // Il motivo per cui non si può ancora confermare (stringa vuota = si può)
  const blocker =
    missing > 0 ? `Aggiungi ancora ${formatPrice(missing)} per raggiungere il minimo`
    : !chosenSlot ? `Scegli: ${labels.slotTitle.toLowerCase()}`
    : name.trim().length < 2 ? 'Inserisci il tuo nome'
    : '';

  // Quando premo "Conferma"
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();                      // il form NON ricarica la pagina
    if (blocker) return setError(blocker);
    setError('');
    setSending(true);
    try {
      const order = await confirmOrder(name.trim(), chosenSlot);
      navigate('/ordini', { state: { justCreated: order.id } });
    } catch (err) {
      setError((err as Error).message);      // es. "Questo orario è pieno" dal server
    } finally {
      setSending(false);
    }
  };

    // Carrello vuoto
  if (items.length === 0) {
    return (
      <section className="empty-state">
        <h1>Il carrello è vuoto</h1>
        <Link to="/" className="btn">Vai a: {labels.catalogTitle}</Link>
      </section>
    );
  }

  return (
    <section className="cart">
      <h1>Carrello</h1>

      <div className="cart__layout">
        <div>
          <ul className="cart__list">
            {items.map(({ product, quantity }) => {
              const max = maxQuantity(product.id);
              return (
                <li key={product.id} className="cart__row">
                  <ProductThumb product={product} small />
                  <div className="cart__info">
                    <strong>{product.name}</strong>
                    <span className="muted small">{formatPrice(product.price)} cad.</span>
                    {quantity >= max && <span className="hint">Disponibili: {product.stock}</span>}
                  </div>
                  <div className="qty">
                    <button onClick={() => setQuantity(product.id, quantity - 1)}>−</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(product.id, quantity + 1)} disabled={quantity >= max}>+</button>
                  </div>
                  <strong className="cart__sub">{formatPrice(product.price * quantity)}</strong>
                  <button className="link-btn" onClick={() => removeFromCart(product.id)}>✕</button>
                </li>
              );
            })}
          </ul>

          <div className="cart__total">
            <span>Totale</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          {/* Req. 5: barra dell'ordine minimo */}
          <div className="minbar">
            <div className="minbar__fill" style={{ width: `${Math.min(100, (cartTotal / rules.MIN_TOTAL) * 100)}%` }} />
          </div>
          <p className={`small ${missing > 0 ? 'warn' : 'ok'}`}>
            {missing > 0 ? `Mancano ${formatPrice(missing)} al minimo` : 'Minimo raggiunto ✓'}
          </p>
        </div>

        <form className="panel form" onSubmit={handleSubmit}>
          <SlotPicker title={labels.slotTitle} slots={slots} value={chosenSlot} onChange={setSlot} />

          <label>
            Nome per il ritiro
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Giulia" />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn--big" disabled={!!blocker || sending}>
            {sending ? 'Invio…' : `${labels.confirmButton} · ${formatPrice(cartTotal)}`}
          </button>
          <p className="muted small center">{blocker || `Ritiro ${formatSlot(chosenSlot)}`}</p>
        </form>
      </div>
    </section>
  );
}