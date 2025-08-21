import React, { useEffect, useMemo, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "../../helpers/localStorageUtils";
import { currency } from "../../helpers/currency";
import coffeeLogo from "../../assets/coffee-logo.png";
import mastercardLogo from "../../assets/logos/mastercard-logo.png";
import cashLogo from "../../assets/logos/cash-logo.png";
import eWalletLogo from "../../assets/logos/e-wallet-logo.png";

function newOrderId() {
  return "#T" + String(Math.floor(10000 + Math.random() * 90000));
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('POS Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">The POS system encountered an error.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function POS({ branch }) {
  const [view, setView] = useState("pos");
  const [lastTx, setLastTx] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderId, setOrderId] = useState(newOrderId());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQty, setProductQty] = useState(1);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);

  // Safe localStorage operations with error handling
  const safeReadLS = (key, defaultValue) => {
    try {
      return readLS(key, defaultValue);
    } catch (error) {
      console.error(`Error reading localStorage key ${key}:`, error);
      return defaultValue;
    }
  };

  const safeWriteLS = (key, value) => {
    try {
      writeLS(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error);
      setError(`Failed to save data: ${error?.message || String(error)}`);
      return false;
    }
  };

  const settings = safeReadLS(LS_KEYS.settings, { taxRate: 0.12, discountRate: 0 });
  const TX_KEY = LS_KEYS.transactions;

  // Safe number conversion
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Load products with error handling
  const loadProducts = () => {
    try {
      if (!branch?.code) {
        setProducts([]);
        return;
      }

      const allInventory = safeReadLS(LS_KEYS.inventory, []);
      if (!Array.isArray(allInventory)) {
        console.warn('Inventory data is not an array');
        setProducts([]);
        return;
      }

      const processedProducts = allInventory
        .map((p) => {
          if (!p || typeof p !== 'object') return null;
          return {
            ...p,
            stock: safeNumber(p.stock, 0),
            price: safeNumber(p.price, 0),
          };
        })
        .filter(Boolean);

      const branchProducts = processedProducts.filter((p) => p.branchCode === branch.code);
      
      const finalProducts = branchProducts.map((p) => ({
        ...p,
        image: p.image ? p.image.replace(/^\/*/, "/") : "/placeholder.png",
      }));

      setProducts(finalProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(`Failed to load products:${error?.message || String(error)}`);
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
    const handleStorage = (e) => {
      try {
        if (e.key === LS_KEYS.inventory) loadProducts();
      } catch (error) {
        console.error('Storage event error:', error);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [branch]);

  // Safe cart operations
  const addToCart = (p, qty = 1) => {
    try {
      if (!p || typeof p !== 'object') {
        setError('Invalid product data');
        return;
      }

      if (safeNumber(p.stock) <= 0) {
        setError('Product is out of stock');
        return;
      }

      const safeQty = Math.max(1, safeNumber(qty, 1));

      setCart((c) => {
        if (!Array.isArray(c)) return [{ ...p, qty: safeQty }];
        
        const idx = c.findIndex((x) => x.id === p.id);
        if (idx >= 0) {
          const copy = [...c];
          const newQty = Math.min(copy[idx].qty + safeQty, safeNumber(p.stock));
          copy[idx].qty = newQty;
          return copy;
        }
        return [...c, { ...p, qty: safeQty }];
      });

      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(`Failed to add item to cart:  ${error?.message || String(error)}`);
    }
  };

  const incQty = (idx) => {
    try {
      setCart((c) =>
        c.map((item, i) =>
          i === idx ? { 
            ...item, 
            qty: Math.min(item.qty + 1, safeNumber(item.stock, 0)) 
          } : item
        )
      );
    } catch (error) {
      console.error('Error increasing quantity:', error);
      setError('Failed to update quantity');
    }
  };

  const decQty = (idx) => {
    try {
      setCart((c) =>
        c
          .map((item, i) =>
            i === idx ? { ...item, qty: Math.max(item.qty - 1, 0) } : item
          )
          .filter((item) => item.qty > 0)
      );
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      setError('Failed to update quantity');
    }
  };

  const removeLine = (idx) => {
    try {
      setCart((c) => c.filter((_, i) => i !== idx));
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    }
  };

  const resetCart = () => {
    try {
      setCart([]);
      setPaymentMethod(null);
      setOrderId(newOrderId());
      setLastTx(null);
      setError(null);
    } catch (error) {
      console.error('Error resetting cart:', error);
      setError('Failed to reset cart');
    }
  };

  // Safe totals calculation
  const subtotal = useMemo(() => {
    try {
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((s, i) => {
        const price = safeNumber(i?.price, 0);
        const qty = safeNumber(i?.qty, 1);
        return s + (price * qty);
      }, 0);
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return 0;
    }
  }, [cart]);

  const discount = useMemo(() => {
    try {
      const rate = safeNumber(settings?.discountRate, 0);
      return subtotal * rate;
    } catch (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }
  }, [subtotal, settings]);

  const taxedBase = subtotal - discount;
  const tax = useMemo(() => {
    try {
      const rate = safeNumber(settings?.taxRate, 0);
      return taxedBase * rate;
    } catch (error) {
      console.error('Error calculating tax:', error);
      return 0;
    }
  }, [taxedBase, settings]);

  const total = taxedBase + tax;

  // Safe product filtering
  const categories = useMemo(() => {
    try {
      if (!Array.isArray(products)) return ["All"];
      const uniqueCategories = Array.from(
        new Set(products.map((p) => p?.category).filter(Boolean))
      );
      return ["All", ...uniqueCategories];
    } catch (error) {
      console.error('Error processing categories:', error);
      return ["All"];
    }
  }, [products]);

  const filteredProducts = useMemo(() => {
    try {
      if (!Array.isArray(products)) return [];
      
      return products.filter((p) => {
        if (!p) return false;
        
        const okCat = category === "All" || 
          (p.category || "").toLowerCase() === category.toLowerCase();
        const okSearch = (p.name || "").toLowerCase()
          .includes((search || "").toLowerCase());
        return okCat && okSearch;
      });
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  }, [products, category, search]);

  // Safe checkout process
  const checkout = () => {
    try {
      if (!Array.isArray(cart) || cart.length === 0) {
        setError('Cart is empty');
        return;
      }
      
      if (!paymentMethod) {
        setError('Please select a payment method');
        return;
      }
      
      if (!branch?.code) {
        setError('No branch selected');
        return;
      }

      // Update inventory
      const inv = safeReadLS(LS_KEYS.inventory, []);
      if (!Array.isArray(inv)) {
        setError('Invalid inventory data');
        return;
      }

      const updatedInventory = inv.map((p) => ({ ...p }));
      cart.forEach((item) => {
        const i = updatedInventory.find((x) => x.id === item.id);
        if (i) {
          const currentStock = safeNumber(i.stock, 0);
          const itemQty = safeNumber(item.qty, 1);
          i.stock = Math.max(0, currentStock - itemQty);
        }
      });

      if (!safeWriteLS(LS_KEYS.inventory, updatedInventory)) return;

      // Update products display
      const branchProducts = updatedInventory.filter((p) => p.branchCode === branch.code);
      setProducts(branchProducts);

      // Create transaction
      const now = new Date().toISOString();
      const tx = {
        id: crypto.randomUUID(),
        orderId,
        branchCode: branch.code,
        items: cart.map((c) => ({
          id: c.id,
          name: c.name || 'Unknown Item',
          price: safeNumber(c.price),
          qty: safeNumber(c.qty, 1),
          sku: c.sku || '',
        })),
        summary: { subtotal, discount, tax, total },
        paymentMethod,
        ts: now,
      };

      // Save transaction
      const txList = safeReadLS(TX_KEY, []);
      if (!safeWriteLS(TX_KEY, [tx, ...txList])) return;

      // Save sales records
      const sales = safeReadLS(LS_KEYS.sales, []);
      const cartRecords = cart.map((c) => ({
        id: crypto.randomUUID(),
        productId: c.id,
        name: c.name || 'Unknown Item',
        price: safeNumber(c.price),
        qty: safeNumber(c.qty, 1),
        ts: now,
        method: paymentMethod,
        orderId,
        transactionId: tx.id,
        branchCode: branch.code,
      }));

      if (!safeWriteLS(LS_KEYS.sales, [...sales, ...cartRecords])) return;

      setLastTx(tx);
      setView("receipt");
      setError(null);
    } catch (error) {
      console.error('Checkout error:', error);
      setError(`Checkout failed: ${error?.message || String(error)}`);
    }
  };

  const closeModal = () => {
    try {
      setIsClosing(true);
      setTimeout(() => {
        setSelectedProduct(null);
        setProductQty(1);
        setIsClosing(false);
      }, 250);
    } catch (error) {
      console.error('Error closing modal:', error);
      setSelectedProduct(null);
      setProductQty(1);
      setIsClosing(false);
    }
  };

  // Safe print receipt
  const printReceipt = (tx) => {
    try {
      if (!tx) return;
      
      const printWindow = window.open("", "PRINT", "height=600,width=400");
      if (!printWindow) {
        setError('Could not open print window');
        return;
      }

      const receiptHTML = `
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              .center { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              .item { display: flex; justify-content: space-between; }
              .total { font-weight: bold; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="center"><b>My Store</b><br/>Branch: ${branch?.name || "Unknown"}<br/>${new Date(tx.ts).toLocaleString()}</div>
            <div class="divider"></div>
            ${tx.items.map((i) => `<div class="item">${i.name} x${i.qty} ${currency(i.price * i.qty)}</div>`).join('')}
            <div class="divider"></div>
            <div class="item">Subtotal: ${currency(tx.summary.subtotal)}</div>
            <div class="item">Discount: -${currency(tx.summary.discount)}</div>
            <div class="item">Tax: ${currency(tx.summary.tax)}</div>
            <div class="item total">Total: ${currency(tx.summary.total)}</div>
            <div class="item">Payment: ${tx.paymentMethod}</div>
            <div class="item">Order ID: ${tx.orderId}</div>
            <div class="divider"></div>
            <div class="center">Thank you!</div>
          </body>
        </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Print error:', error);
      setError(`Failed to print receipt: ${error?.message || String(error)}`);
    }
  };

  // Safe transaction history
  const txList = useMemo(() => {
    try {
      const transactions = safeReadLS(TX_KEY, []);
      if (!Array.isArray(transactions)) return [];
      return transactions.filter((tx) => tx?.branchCode === branch?.code);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      return [];
    }
  }, [TX_KEY, branch?.code]);

  // Error display component
  const ErrorDisplay = error ? (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <span className="block sm:inline">{String(error)}</span>
      <button 
        onClick={() => setError(null)}
        className="float-right text-red-700 hover:text-red-900"
      >
        x
      </button>
    </div>
  ) : null; 

  // POS Screen with error handling
  const PosScreen = (
    <div className="flex gap-0 h-full bg-amber-100">
      {/* LEFT: Products */}
      <div className="flex-1 p-4 border-r bg-amber-100 overflow-auto">
        {ErrorDisplay}
        
        <div className="flex items-center mb-4 gap-2">
          <img 
            src={coffeeLogo} 
            alt="Coffee Logo" 
            className="w-[60px]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <input
            type="text"
            placeholder="Search menu"
            className="flex-1 border bg-white rounded-full pl-4 pr-9 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value || "")}
          />
        </div>

        <div className="mb-4">
          <div className="font-medium mb-2">Categories</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full border ${
                  category === cat ? "bg-green-500 text-black" : "bg-gray-200 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id || Math.random()}
              className="flex flex-col border rounded-2xl p-3 hover:shadow-md transition cursor-pointer"
            >
              <div className="h-24 bg-white rounded-t-2xl mb-2">
                <img
                  src={p.image || "/placeholder.png"}
                  alt={p.name || "Product"}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                />
              </div>
              <div className="font-bold mb-2 mt-2">
                <span className="pl-4 pr-3 pt-2 pb-2 w-full bg-amber-950 text-white rounded-tr-2xl rounded-br-2xl">
                  {p.name || "Unknown Product"}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2 mt-2">
              {currency(p.price)} • Stock: {safeNumber(p.stock)}
              </div>
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => addToCart(p, 1)}
                  className="flex-1 py-1 bg-green-500 text-green-700 rounded-xl hover:bg-green-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={safeNumber(p.stock) <= 0}
                >
                  Add to Cart +
                </button>
                <button
                  onClick={() => setSelectedProduct(p)}
                  className="flex-1 py-1 border rounded-xl text-sm"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500">
              No products match your search.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-96 p-4 flex flex-col bg-gray-100">
        <div className="space-y-2 max-h-[60%] overflow rounded-2xl mb-4">
          {cart.length === 0 && <div className="text-sm text-gray-500">No items yet.</div>}
          {Array.isArray(cart) && cart.map((c, idx) => (
            <div key={`${c.id}-${idx}`} className="flex items-center justify-between bg-amber-100 gap-1 border rounded-xl p-3">
              <div>
                <div className="font-medium">{c.name || "Unnamed"}</div>
                <div className="text-sm text-gray-600">
                  {safeNumber(c.qty)} × {currency(c.price || 0)} = {currency(safeNumber(c.qty) * safeNumber(c.price))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 rounded-lg border" onClick={() => decQty(idx)}>-</button>
                <div className="w-6 text-center font-bold">{safeNumber(c.qty)}</div>
                <button className="px-2 rounded-lg border" onClick={() => incQty(idx)}>+</button>
                <button className="px-2 py-1 rounded bg-red-500 text-red-600" onClick={() => removeLine(idx)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Discount ({Math.round(safeNumber(settings?.discountRate) * 100)}%)</span>
            <span>-{currency(discount)}</span>
          </div>
          <div className="flex justify-between"><span>Tax ({Math.round(safeNumber(settings?.taxRate) * 100)}%)</span><span>{currency(tax)}</span></div>
          <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{currency(total)}</span></div>
        </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { 
              name: "Credit Card", 
              logo: mastercardLogo,
              bgColor: "bg-blue-50",
              selectedBg: "bg-blue-600"
            },
            { 
              name: "Cash", 
              logo: cashLogo,
              bgColor: "bg-green-50", 
              selectedBg: "bg-green-600"
            },
            { 
              name: "E-wallet", 
              logo: eWalletLogo,
              bgColor: "bg-purple-50",
              selectedBg: "bg-purple-600"
            }
          ].map((method) => (
            <button
              key={method.name}
              className={`py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 ${
                paymentMethod === method.name 
                  ? `${method.selectedBg} text-white shadow-lg` 
                  : `${method.bgColor} hover:shadow-md border-gray-200`
              }`}
              onClick={() => setPaymentMethod(method.name)}
            >
              <img 
                src={method.logo} 
                alt={method.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  console.error(`Failed to load ${method.name} logo`);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-xs font-medium">{method.name}</span>
            </button>
          ))}
        </div>


        <div className="mt-4">
          <button
            className="w-full bg-gray-900 text-black rounded-xl py-2.5 hover:bg-gray-700 disabled:opacity-50"
            disabled={cart.length === 0}
            onClick={checkout}
          >
            Checkout
          </button>
          <div className="text-xs text-gray-500 mt-2 text-center">⬇ Download invoice and receipt (on next page)</div>
          <div className="flex justify-between mt-3 text-xs">
            <button className="underline text-gray-500" onClick={() => setView("history")}>View Transaction History</button>
            <button className="underline text-gray-500" onClick={resetCart}>New Order</button>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`}
          onClick={closeModal}
        >
          <div
            className={`bg-white rounded-2xl p-6 w-full max-w-md transform transition-transform duration-200 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✕
            </button>
            <div className="h-48 mb-4">
              <img
                src={selectedProduct.image || "/placeholder.png"}
                alt={selectedProduct.name || "Product"}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
              />
            </div>
            <div className="font-bold text-amber-950 text-lg">{selectedProduct.name || "Unknown Product"}</div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-bold text-black">{currency(selectedProduct.price)}</span> • Stock: {safeNumber(selectedProduct.stock)}
            </div>
            <div className="text-sm text-gray-800 mb-4">{selectedProduct.description || "No description available"}</div>

            <div className="flex items-center gap-2 mb-3">
              <button
                className="px-2 py-1 border rounded-lg"
                onClick={() => setProductQty(Math.max(1, productQty - 1))}
              >-</button>
              <div className="w-10 text-center font-bold">{productQty}</div>
              <button
                className="px-2 py-1 border rounded-lg"
                onClick={() => setProductQty(Math.min(productQty + 1, safeNumber(selectedProduct.stock)))}
              >+</button>
            </div>

            <button
              onClick={() => {
                addToCart(selectedProduct, productQty);
                closeModal();
              }}
              className="w-full py-2.5 bg-green-500 text-green-700 rounded-xl hover:bg-green-600 disabled:opacity-50"
              disabled={safeNumber(selectedProduct.stock) <= 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const ReceiptPage = lastTx ? (
    <div className="p-4 rounded-2xl border bg-white max-w-md mx-auto font-mono text-sm">
      <div className="text-center font-bold text-lg mb-2">My Store</div>
      <div className="text-center mb-2">Branch: {branch?.name || "Unknown"}</div>
      <div className="text-center mb-2">{new Date(lastTx.ts).toLocaleString()}</div>
      <div className="border-t my-2"></div>

      <div className="space-y-1">
        {Array.isArray(lastTx.items) && lastTx.items.map((i, idx) => (
          <div key={i.id || idx} className="flex justify-between">
            <div>{i.name || 'Unknown'} x{safeNumber(i.qty, 1)}</div>
            <div>{currency(safeNumber(i.price) * safeNumber(i.qty, 1))}</div>
          </div>
        ))}
      </div>

      <div className="border-t my-2"></div>
      <div className="flex justify-between"><span>Subtotal</span><span>{currency(lastTx.summary?.subtotal || 0)}</span></div>
      <div className="flex justify-between"><span>Discount ({Math.round(safeNumber(settings?.discountRate) * 100)}%)</span><span>-{currency(lastTx.summary?.discount || 0)}</span></div>
      <div className="flex justify-between"><span>Tax ({Math.round(safeNumber(settings?.taxRate) * 100)}%)</span><span>{currency(lastTx.summary?.tax || 0)}</span></div>
      <div className="flex justify-between font-bold mt-1"><span>Total</span><span>{currency(lastTx.summary?.total || 0)}</span></div>

      <div className="mt-2 text-sm">Payment Method: {lastTx.paymentMethod || 'Unknown'}</div>
      <div className="mt-1 text-sm">Order ID: {lastTx.orderId || 'Unknown'}</div>
      <div className="border-t my-2"></div>
      <div className="text-center text-xs text-gray-500">Thank you for your purchase!</div>

      <div className="mt-4 flex flex-col gap-2">
        <button onClick={() => setView("pos")} className="underline text-blue-500">
          Back to POS
        </button>
        <button
          onClick={() => printReceipt(lastTx)}
          className="underline text-green-500"
        >
          Print Receipt
        </button>
      </div>
    </div>
  ) : (
    <div className="text-sm text-gray-500 p-4">No receipt available.</div>
  );

  const HistoryPage = (
  <div className="p-4 rounded-2xl border bg-white">
    <div className="text-lg font-semibold mb-4">Transaction History</div>
    {txList.length === 0 && <div className="text-sm text-gray-500">No transactions yet.</div>}
    {txList.map((tx, idx) => {
      // Debug log each transaction
      console.log('Rendering tx:', tx);
      return (
        <div key={tx?.id || idx} className="border rounded-lg p-2 mb-2">
          <div className="flex justify-between text-sm">
            <span>{String(tx?.orderId || 'Unknown')}</span>
            <span>{tx?.ts ? new Date(tx.ts).toLocaleString() : 'No date'}</span>
          </div>
          <div className="text-xs mt-1">
            {Array.isArray(tx?.items) && tx.items.map((i, itemIdx) => (
              <div key={i?.id || itemIdx}>
                {String(i?.name || 'Unknown')} x{safeNumber(i?.qty, 1)} = {currency(safeNumber(i?.price) * safeNumber(i?.qty, 1))}
              </div>
            ))}
          </div>
          <div className="text-sm mt-1 font-semibold">
            Total: {currency(tx?.summary?.total || 0)}
          </div>
        </div>
      );
    })}
    <button onClick={() => setView("pos")} className="underline text-blue-500 mt-2">Back to POS</button>
  </div>
);
  if (view === "receipt") return ReceiptPage;
  if (view === "history") return HistoryPage;
  return PosScreen;
}

// Export wrapped with Error Boundary
export default function POSWithErrorHandling(props) {
  return (
    <ErrorBoundary>
      <POS {...props} />
    </ErrorBoundary>
  );
}