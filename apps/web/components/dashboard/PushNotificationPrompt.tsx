"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bell, X } from "lucide-react";
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  savePushSubscription,
} from "@/lib/push-notifications";

const DISMISSED_KEY = "tr_push_prompt_dismissed";

export function PushNotificationPrompt() {
  const { getToken } = useAuth();
  const [show, setShow] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === "granted") return; // Already enabled
    if (Notification.permission === "denied") return; // User blocked it
    if (localStorage.getItem(DISMISSED_KEY)) return; // User dismissed prompt
    setShow(true);
  }, []);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        setShow(false);
        return;
      }

      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        setShow(false);
        return;
      }

      const token = await getToken();
      if (token) {
        await savePushSubscription(subscription, token);
      }
    } catch (err) {
      console.warn("Push setup failed:", err);
    } finally {
      setEnabling(false);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mx-4 mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell className="w-4.5 h-4.5 text-orange-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800">Enable notifications</p>
        <p className="text-xs text-zinc-500">Get notified when you receive new messages</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={enabling}
        className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors flex-shrink-0"
      >
        {enabling ? "..." : "Enable"}
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
