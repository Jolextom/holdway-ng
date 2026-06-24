import { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { Product, Merchant } from "@/types/database";
import copy from "@/lib/content/copy.json";
import CheckoutButton from "./checkout-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return {
        title: `${copy.storefront.errorProductNotFound} | ${copy.brand.name}`,
      };
    }

    return {
      title: `${product.name} | ${copy.brand.name}`,
      description: `Securely checkout ${product.name} using Holdway Escrow via WhatsApp.`,
    };
  } catch (error) {
    return {
      title: `${copy.brand.name} Storefront`,
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch product and nested merchant relation
  const { data: rawProduct } = await supabaseAdmin
    .from("products")
    .select("*, merchants(*)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  const product = rawProduct as (Product & { merchants: Merchant | null }) | null;

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-canvas text-ink font-sans">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-4 bg-surface border border-border rounded-2xl p-8 shadow-card">
          <div className="p-3 bg-error-light rounded-full text-error">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {copy.storefront.errorProductNotFound}
          </h1>
          <p className="text-sm text-ink-muted">
            The link you followed might be broken, or the product is no longer active.
          </p>
          <Link
            href="/"
            className="mt-2 text-sm font-semibold text-trust hover:text-trust-mid transition-all"
          >
            Go back to homepage
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getFullImageUrl(product.image_url);
  const formattedPrice = `₦${Number(product.price).toLocaleString()}`;
  const merchantName = product.merchants?.business_name || copy.brand.name;

  return (
    <div className="min-h-screen bg-canvas py-8 px-4 flex items-center justify-center font-sans text-ink">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-surface-raised border-b border-border flex items-center justify-center text-ink-faint">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="h-16 w-16 stroke-[1.5]"
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Merchant name */}
          <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            {merchantName}
          </div>

          {/* Product name & description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-sm text-ink-muted leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-3xl font-extrabold text-trust">
            {formattedPrice}
          </div>

          <hr className="border-border" />

          {/* Shipping info */}
          <div className="flex items-start gap-3 text-sm text-ink-muted p-3 rounded-xl bg-surface-raised border border-border">
            <span className="text-base select-none">🚚</span>
            <span>{copy.storefront.shippingDetailInfo}</span>
          </div>

          {/* Escrow shield */}
          <div className="p-4 rounded-xl bg-trust-light border border-trust-mid/10 flex flex-col gap-1.5">
            <div className="font-semibold text-trust-mid text-sm flex items-center gap-2">
              <span className="text-base select-none">🔒</span>
              {copy.storefront.escrowBadgeProtected}
            </div>
            <p className="text-xs text-ink-muted/95 leading-relaxed">
              {copy.storefront.escrowBodyNoRisk}
            </p>
          </div>

          {/* Interactive Checkout Button Component */}
          <div className="mt-2">
            <CheckoutButton
              productId={product.id}
              merchantId={product.merchant_id}
              price={Number(product.price)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
