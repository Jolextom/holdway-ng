import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { Product, Merchant } from "@/types/database";
import copy from "@/lib/content/copy.json";

const getFullImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const baseHost = projectRef.includes(".")
    ? projectRef
    : `https://${projectRef}.supabase.co`;
  return `${baseHost}/storage/v1/object/public/products/${url}`;
};

export default async function Home() {
  // Fetch active products and their merchant relations
  const { data: rawProducts } = await supabaseAdmin
    .from("products")
    .select("*, merchants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = (rawProducts || []) as (Product & { merchants: Merchant | null })[];

  // Dynamically resolve merchant name from the first product or use brand name
  const merchantName =
    products.length > 0 && products[0].merchants?.business_name
      ? products[0].merchants.business_name
      : copy.brand.name;

  return (
    <div className="min-h-screen bg-canvas py-8 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Store header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">{merchantName}</h1>
          <p className="text-sm text-ink-muted mt-1">{copy.storefront.subtitle}</p>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs font-mono text-trust">
            <span>🔒</span>
            <span>{copy.storefront.escrowProtectedHeader}</span>
          </div>
        </div>

        {/* Product list grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => {
              const imageUrl = getFullImageUrl(product.image_url);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-surface border border-border rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-200 block"
                >
                  <div className="aspect-square bg-surface-raised flex items-center justify-center text-ink-faint relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-12 w-12 stroke-[1.5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h2 className="font-semibold text-ink truncate">{product.name}</h2>
                    {product.description && (
                      <p className="text-sm text-ink-muted line-clamp-2 min-h-[2.5rem]">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-1 font-mono font-bold text-trust">
                      ₦{Number(product.price).toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-ink-muted">
            {copy.storefront.noProducts}
          </div>
        )}
      </div>
    </div>
  );
}
