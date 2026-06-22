"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { theme } from "@/lib/theme";
import copy from "@/lib/content/copy.json";
import { createPendingOrder } from "./actions";

interface CheckoutButtonProps {
  productId: string;
  merchantId: string;
  price: number;
}

export default function CheckoutButton({
  productId,
  merchantId,
  price,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Initialize order in the database
      const orderId = await createPendingOrder(productId, merchantId, price);

      // 2. Fetch bot number & manifest text from copy configuration
      const botNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ||
        copy.storefront.whatsappBotNumber;
      
      const manifestTemplate = copy.storefront.whatsappManifest;
      const messageText = manifestTemplate.replace("{order_id}", orderId);

      // 3. Construct WhatsApp deep link URL and redirect
      // Format number to remove any + or spaces for standard wa.me link
      const sanitizedNumber = botNumber.replace(/[+\s-]/g, "");
      const whatsappUrl = `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(
        messageText
      )}`;

      window.location.href = whatsappUrl;
    } catch (err: any) {
      console.error("Checkout handoff failed:", err);
      setError(copy.storefront.errorGeneric);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <motion.button
        onClick={handleCheckout}
        disabled={isLoading}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        className={theme.colors.button.primary}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {copy.storefront.buyButtonLoading}
          </span>
        ) : (
          <span>{copy.storefront.buyButton}</span>
        )}
      </motion.button>

      {error && (
        <p className="text-sm text-error text-center font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
