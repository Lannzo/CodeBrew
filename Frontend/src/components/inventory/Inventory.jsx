import { useEffect, useState, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import {
  getInventory,
  getBranches,
  getSelectedBranch,
  updateInventoryItem,
  saveInventory,
} from "../../helpers/localStorageUtils";
import { useSeedData } from "../../helpers/useSeedData";

const ROW_HEIGHT = 80;

export default function Inventory() {
  const ready = useSeedData();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState({ Coffee: "", Bread: "", Dessert: "" });
  const [branches, setBranches] = useState([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState(null);

  const [transferModal, setTransferModal] = useState({
    open: false,
    item: null,
    targetBranch: "",
    qty: 0,
  });

  const selectedBranch = getSelectedBranch();

  // Keep selectedBranchCode in state for transfer consistency
  useEffect(() => {
    if (selectedBranch) setSelectedBranchCode(selectedBranch.code);
  }, [selectedBranch]);

  // Load branch-specific inventory and branches
  useEffect(() => {
    if (!ready || !selectedBranchCode) return;
    setItems(getInventory(selectedBranchCode));
    setBranches(getBranches());
  }, [ready, selectedBranchCode]);

  // Filtered items by category & search
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((i) => {
      const term = search[i.category] || "";
      return i.name.toLowerCase().includes(term.toLowerCase());
    });
  }, [items, search]);

  const handleStockChange = (id, newStock) => {
    const updatedItem = items.find((i) => i.id === id);
    if (!updatedItem) return;

    updatedItem.stock = Number(newStock);
    updateInventoryItem(updatedItem, selectedBranchCode);
    setItems(getInventory(selectedBranchCode));
  };

  const openTransfer = (item) => {
    setTransferModal({ open: true, item, targetBranch: "", qty: 0 });
  };

  const handleTransferConfirm = () => {
    const { item, targetBranch, qty } = transferModal;
    const quantity = Number(qty);

    if (!targetBranch || quantity <= 0 || quantity > item.stock) {
      alert("Invalid transfer quantity or target branch.");
      return;
    }

    const sourceBranchCode = selectedBranchCode;
    if (!sourceBranchCode) return;

    // Update source branch stock
    const updatedSourceItem = { ...item, stock: item.stock - quantity };
    updateInventoryItem(updatedSourceItem, sourceBranchCode);

    // Update target branch stock
    const targetItems = getInventory(targetBranch);
    const targetItem = targetItems.find((i) => i.sku === item.sku);

    if (targetItem) {
      const updatedTargetItem = { ...targetItem, stock: targetItem.stock + quantity };
      updateInventoryItem(updatedTargetItem, targetBranch);
    } else {
      const newItem = { ...item, id: crypto.randomUUID(), branchCode: targetBranch, stock: quantity };
      saveInventory([...targetItems, newItem], targetBranch);
    }

    // Refresh UI
    setItems(getInventory(sourceBranchCode));
    setTransferModal({ open: false, item: null, targetBranch: "", qty: 0 });
  };

  const Row = ({ index, style }) => {
    const item = filteredItems[index];
    return (
      <div
        style={style}
        className={`flex items-center border-b px-4 ${
          item.stock <= 10 ? "bg-red-100" : "bg-white"
        } rounded-lg mb-2`}
      >
        <img
          src={item.image}
          alt={item.name}
          className="h-12 w-12 object-cover rounded mr-4"
        />
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-500">{item.category}</div>
        </div>
        <div className="w-20 text-right">Price: ₱<span className="font-bold">{item.price}</span></div><div className="ml-3"><span> Stocks: </span></div>
        <div className="w-24 px-2">
            <input
            type="number"
            value={item.stock}
            min={0}
            className="w-full border rounded-lg px-2 py-1"
            onChange={(e) => handleStockChange(item.id, e.target.value)}
          />
          {item.stock <= 10 && (
            <div className="text-red-600 font-semibold text-sm">Low</div>
          )}
        </div>
        <button
          onClick={() => openTransfer(item)}
          className="ml-4 bg-blue-500 text-black px-3 py-1 rounded hover:bg-yellow-600"
        >
          Transfer
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-amber-100 ">
      <h2 className="text-2xl font-bold mb-6"><span className="text-amber-950">{selectedBranch?.name} -  Inventory</span></h2>

      {/* Search per category */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {["Coffee", "Bread", "Dessert"].map((cat) => (
          <input
            key={cat}
            placeholder={`Search ${cat}`}
            value={search[cat]}
            onChange={(e) =>
              setSearch((prev) => ({ ...prev, [cat]: e.target.value }))
            }
            className="border bg-white rounded-2xl px-3 py-2 w-full"
          />
        ))}
      </div>

      <div className="overflow-y-auto">
        <List
          height={500}
          itemCount={filteredItems.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {Row}
        </List>
      </div>

      {/* Transfer Modal */}
      {transferModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 border-r-10 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg text-amber-950 font-bold mb-4">
              Transfer - {transferModal.item.name}
            </h2>
            <div className="mb-2">
              <label className="block mb-1 font-semibold">Target Branch</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={transferModal.targetBranch}
                onChange={(e) =>
                  setTransferModal({ ...transferModal, targetBranch: e.target.value })
                }
              >
                <option value="">Select branch</option>
                {branches
                  .filter((b) => b.code !== selectedBranchCode)
                  .map((b) => (
                    <option key={b.id} value={b.code}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Quantity</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={transferModal.qty}
                onChange={(e) =>
                  setTransferModal({ ...transferModal, qty: e.target.value })
                }
                min={1}
                max={transferModal.item.stock}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() =>
                  setTransferModal({ open: false, item: null, targetBranch: "", qty: 0 })
                }
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-500 text-black hover:bg-blue-600"
                onClick={handleTransferConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
