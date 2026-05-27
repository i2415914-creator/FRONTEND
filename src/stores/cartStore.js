import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const createCartId = () => `temp_${Math.random().toString(36).slice(2, 11)}`;
const createLineId = () => `line_${Math.random().toString(36).slice(2, 11)}`;

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const normalizeCartItem = (item) => ({
  ...item,
  item_uid: item?.item_uid || createLineId(),
  subtotal: roundMoney(item?.subtotal || 0),
  precio_unitario: roundMoney(item?.precio_unitario || 0),
});

const getSessionStorage = () => {
  if (typeof window === 'undefined') return undefined;
  return window.sessionStorage;
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      ensureCartId: () => {
        const existing = get().cartId || createCartId();
        set({ cartId: existing });
        return existing;
      },
      setItems: (items) => {
        set({ items: Array.isArray(items) ? items.map(normalizeCartItem) : [] });
      },
      addOrMergePlancha: (producto, cantidad) => {
        const productoId = producto?.id_producto || producto?.id;
        const cant = Number(cantidad || 0);
        if (!productoId || cant <= 0) return;

        const precio = Number(producto?.precio_unitario || 0);
        const currentItems = get().items || [];
        const idx = currentItems.findIndex(
          (item) => (item.id_producto || item.id) === productoId && item.tipo_venta === 'plancha'
        );

        let nextItems = [];
        if (idx !== -1) {
          nextItems = [...currentItems];
          const merged = { ...nextItems[idx] };
          merged.cantidad = Number(merged.cantidad || 0) + cant;
          merged.subtotal = roundMoney(merged.cantidad * precio);
          nextItems[idx] = normalizeCartItem(merged);
        } else {
          const item = {
            ...producto,
            item_uid: createLineId(),
            tipo_venta: 'plancha',
            cantidad: cant,
            precio_unitario: roundMoney(precio),
            subtotal: roundMoney(cant * precio),
          };
          nextItems = [...currentItems, normalizeCartItem(item)];
        }

        set({ items: nextItems });
      },
      addCorte: (producto, cortes, total) => {
        if (!producto) return;
        const precioM2 = roundMoney(Number(producto?.precio_unitario || 0));
        const item = normalizeCartItem({
          ...producto,
          item_uid: createLineId(),
          tipo_venta: 'corte',
          cortes: cortes || [],
          precio_m2: precioM2,
          precio_unitario: roundMoney(total || 0),
          subtotal: roundMoney(total || 0),
          cantidad: 1,
          descripcion: 'Cortes personalizados',
        });
        set({ items: [...(get().items || []), item] });
      },
      updateQuantity: (itemKey, nuevaCantidad) => {
        const cantidad = Number(nuevaCantidad || 0);
        if (cantidad <= 0) {
          get().removeItem(itemKey);
          return;
        }
        const nextItems = (get().items || []).map((item) => {
          const matches = item.item_uid === itemKey || item.id_producto === itemKey;
          if (!matches) return normalizeCartItem(item);
          return normalizeCartItem({
            ...item,
            cantidad,
            subtotal: roundMoney(cantidad * Number(item.precio_unitario || 0)),
          });
        });
        set({ items: nextItems });
      },
      updateCorteItem: (itemKey, cortes, total, precioM2) => {
        const nextItems = (get().items || []).map((item) => {
          const matches = item.item_uid === itemKey || item.id_producto === itemKey;
          if (!matches) return normalizeCartItem(item);
          return normalizeCartItem({
            ...item,
            cortes: Array.isArray(cortes) ? cortes : [],
            precio_unitario: roundMoney(total || 0),
            subtotal: roundMoney(total || 0),
            cantidad: 1,
            ...(precioM2 != null ? { precio_m2: precioM2 } : {}),
          });
        });
        set({ items: nextItems });
      },
      removeItem: (itemKey) => {
        const nextItems = (get().items || []).filter((item) => item.item_uid !== itemKey && item.id_producto !== itemKey);
        set({ items: nextItems });
      },
      clearCart: () => {
        set({ items: [], cartId: null });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(getSessionStorage),
    }
  )
);
