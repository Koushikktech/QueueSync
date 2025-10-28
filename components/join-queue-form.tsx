"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useQueue } from "@/hooks/use-queue";
import { LocalQueueStorage } from "@/lib/local-queue-storage";

interface JoinQueueFormProps {
  businessId?: string;
  businessName?: string;
  onSuccess?: (queueId: string) => void;
}

export default function JoinQueueForm({
  businessId = "demo-business",
  businessName = "Demo Restaurant",
  onSuccess,
}: JoinQueueFormProps) {
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [queueId, setQueueId] = useState("");

  const { joinQueue, loading: isLoading, error } = useQueue();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      try {
        const result = await joinQueue(businessId, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          partySize: parseInt(partySize),
        });

        // Save to local storage
        LocalQueueStorage.saveQueueEntry({
          queueId: result.queueId,
          businessId,
          businessName: businessName || "Demo Restaurant",
          userInfo: {
            name: name.trim(),
            phone: phone.trim() || undefined,
          },
        });

        setIsSuccess(true);
        setQueueId(result.queueId);
        onSuccess?.(result.queueId);

        const resetTimer = setTimeout(() => {
          setName("");
          setPartySize("1");
          setPhone("");
          setIsSuccess(false);
        }, 3000);

        return () => clearTimeout(resetTimer);
      } catch (err) {
        console.error("Failed to join queue:", err);
      }
    },
    [name, phone, businessId, joinQueue, onSuccess]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-md"
    >
      <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Your Name
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || isSuccess}
              className="bg-background/50 border-border/50 focus:border-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground"
            >
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="For SMS notifications"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading || isSuccess}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="partySize"
              className="text-sm font-medium text-foreground"
            >
              Members
            </label>
            <select
              id="partySize"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              disabled={isLoading || isSuccess}
              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading || isSuccess || !name}
            className="w-full relative h-12 rounded-lg font-semibold text-primary-foreground overflow-hidden group"
            whileHover={{ scale: isLoading || isSuccess ? 1 : 1.02 }}
            whileTap={{ scale: isLoading || isSuccess ? 1 : 0.98 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
              initial={{ opacity: 1 }}
              animate={{ opacity: isSuccess ? 0.8 : 1 }}
            />

            <div className="relative flex items-center justify-center gap-2">
              {isLoading && (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="h-5 w-5" />
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.div>
              )}

              <span>
                {isLoading
                  ? "Joining..."
                  : isSuccess
                  ? "Joined!"
                  : "Join Queue"}
              </span>
            </div>
          </motion.button>

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20"
            >
              <p className="text-sm text-foreground font-medium">
                Queue ID: {queueId}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your position on the wait page
              </p>
            </motion.div>
          )}
        </form>
      </Card>
    </motion.div>
  );
}
