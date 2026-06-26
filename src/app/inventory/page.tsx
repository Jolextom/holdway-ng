'use client';

import { useState, useRef } from 'react';
import { Plus, X, Pencil, Trash2, Check, Copy, Package } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import copy from '@/lib/content/copy.json';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MOCK_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Ankara fabric (per yard)', description: 'Premium Dutch wax print', price: 1000.0 },
  { id: '2', name: 'Plain cotton (per yard)', description: 'Soft, breathable cotton', price: 1100.0 },
  { id: '3', name: 'Aso-oke headtie', description: 'Traditional woven fabric', price: 4500.0 },
  { id: '4', name: 'Lace fabric (per yard)', description: 'French lace, assorted', price: 3200.0 },
  { id: '5', name: 'Adire tie-dye cloth', description: 'Hand-dyed, unique prints', price: 2800.0 },
];

const BUSINESS_NAME = "Zara's Ankara Fabrics";

// ─── Sub‑components ──────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-ink-muted hover:text-ink transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-border rounded-md"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-5 h-5 text-trust" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  );
}

function ProductThumbnail({ name, imageUrl }: { name: string; imageUrl?: string }) {
  // Deterministic avatar color using semantic theme tokens
  const avatarColors = [
    'bg-error-light text-error',
    'bg-info-light text-info',
    'bg-trust-light text-trust',
    'bg-warning-light text-warning-mid',
  ];
  const colorIndex =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
  const colorClass = avatarColors[colorIndex];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-12 h-12 rounded-md object-cover border border-border"
      />
    );
  }

  return (
    <div
      className={`w-12 h-12 rounded-md flex items-center justify-center text-sm font-bold border border-border ${colorClass}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeSlug = BUSINESS_NAME.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const storeLink = `holdway.com/store/${storeSlug}`;

  // ── Form handlers ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', imageUrl: '' });
    setEditingItem(null);
    setIsFormOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) return;

    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      imageUrl: formData.imageUrl || undefined,
    };

    if (editingItem) {
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? newItem : item)));
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      imageUrl: item.imageUrl ?? '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(copy.inventory.confirmDelete)) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const baseInputClass =
    'w-full bg-surface border border-border rounded-md px-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-trust focus:ring-2 focus:ring-trust/20 transition-colors';

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-ink tracking-tight font-sans">
            {copy.inventory.title}
          </h1>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-ink-muted tracking-wider uppercase font-sans">
              {copy.inventory.storeLinkLabel}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={storeLink}
                className="font-mono text-sm bg-surface border border-border rounded-md px-3 py-2 text-ink-muted cursor-default w-auto min-w-[200px] focus:outline-none"
              />
              <CopyButton text={storeLink} />
            </div>
          </div>
        </div>

        {/* Add Item Toggle Button */}
        <button
          onClick={() => {
            if (isFormOpen && !editingItem) {
              resetForm();
            } else {
              setEditingItem(null);
              setFormData({ name: '', description: '', price: '', imageUrl: '' });
              setIsFormOpen(true);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-md text-sm font-medium text-ink hover:bg-surface-raised hover:border-ink-faint transition-colors focus:outline-none focus:ring-2 focus:ring-border font-sans"
        >
          {isFormOpen && !editingItem ? (
            <>
              <X className="w-4 h-4" />
              {copy.inventory.addItemClose}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {copy.inventory.addItemOpen}
            </>
          )}
        </button>

        {/* Add / Edit Form (collapsible) */}
        {isFormOpen && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-card mt-4 font-sans">
            <h2 className="text-base font-semibold text-ink mb-4">
              {editingItem ? copy.inventory.form.editTitle : copy.inventory.form.title}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
                  {copy.inventory.form.nameLbl}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={copy.inventory.form.namePlaceholder}
                  className={baseInputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
                  {copy.inventory.form.descriptionLbl}{' '}
                  <span className="text-ink-muted text-xs font-normal">
                    {copy.inventory.form.descriptionOptional}
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={copy.inventory.form.descriptionPlaceholder}
                  className={`${baseInputClass} resize-none`}
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-ink mb-1">
                  {copy.inventory.form.priceLbl}
                </label>
                <div className="flex items-stretch border border-border rounded-md overflow-hidden focus-within:border-trust focus-within:ring-2 focus-within:ring-trust/20 transition-colors">
                  <span className="px-3 py-2.5 bg-surface-raised text-ink-muted text-base border-r border-border flex-shrink-0">
                    ₦
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="flex-1 font-mono px-3 py-2.5 text-base text-ink focus:outline-none bg-surface"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-ink mb-1">
                  {copy.inventory.form.imageLbl}{' '}
                  <span className="text-ink-muted text-xs font-normal">
                    {copy.inventory.form.descriptionOptional}
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-border file:bg-surface-raised file:text-sm file:font-medium file:text-ink cursor-pointer transition-colors"
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 h-16 w-16 rounded-md object-cover border border-border"
                  />
                )}
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  {copy.inventory.form.imageHint}
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-trust text-white text-sm font-semibold rounded-md hover:bg-trust-mid transition-colors focus:outline-none focus:ring-2 focus:ring-trust/50"
                >
                  {editingItem ? copy.inventory.form.submitUpdate : copy.inventory.form.submitAdd}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  {copy.inventory.form.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Table / Empty State */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center mt-6 font-sans">
            <Package className="w-12 h-12 text-ink-faint mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-ink">{copy.inventory.emptyTitle}</h3>
            <p className="text-sm text-ink-muted mt-1">{copy.inventory.emptyBody}</p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto bg-surface border border-border rounded-lg shadow-card font-sans">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-raised">
                  <th scope="col" className="px-6 py-4">{copy.inventory.table.image}</th>
                  <th scope="col" className="px-6 py-4">{copy.inventory.table.name}</th>
                  <th scope="col" className="px-6 py-4">{copy.inventory.table.description}</th>
                  <th scope="col" className="px-6 py-4 text-right">{copy.inventory.table.price}</th>
                  <th scope="col" className="px-6 py-4 text-right">{copy.inventory.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-6 py-4">
                      <ProductThumbnail name={item.name} imageUrl={item.imageUrl} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-ink">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{item.description}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-sm text-ink text-right">
                      ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-raised rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-border"
                          aria-label="Edit item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-error-mid hover:text-error hover:bg-error-light rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-error/20"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
