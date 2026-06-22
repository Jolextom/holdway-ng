import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, ShieldAlert } from "lucide-react";
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
    const db = supabaseAdmin as any;
    const { data: product } = await db
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
  const db = supabaseAdmin as any;
  const { data: rawProduct } = await db
    .from("products")
    .select("*, merchants(*)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  const product = rawProduct as any;

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
    <div className="flex-1 flex flex-col justify-center bg-canvas text-ink font-sans">
      <main className="max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden p-5 flex flex-col gap-5">
          {/* Product Image section with low-data optimization */}
          <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-surface-raised border border-border flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                width={480}
                height={480}
                quality={75}
                priority
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-ink-faint">
                <Package className="h-12 w-12 stroke-[1.5]" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-ink-muted font-mono uppercase tracking-wider">
              <span>{merchantName}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {product.name}
            </h1>
            <div className="text-3xl font-extrabold text-trust mt-1">
              {formattedPrice}
            </div>
          </div>

          <hr className="border-border" />

          {/* Flat-rate Shipping disclaimer */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-sm text-ink-muted flex items-center gap-3">
            <span className="text-base select-none">🚚</span>
            <span className="leading-snug">{copy.storefront.shippingInfo}</span>
          </div>

          {/* Escrow Shield Info */}
          <div className="p-4 rounded-xl bg-trust-light border border-trust-mid/10 flex flex-col gap-1.5">
            <div className="font-semibold text-trust-mid text-sm flex items-center gap-2">
              <span className="text-base select-none">🔒</span>
              {copy.storefront.escrowBadge}
            </div>
            <p className="text-xs text-ink-muted/95 leading-relaxed">
              {copy.storefront.escrowBody}
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
      </main>
    </div>
  );
}
