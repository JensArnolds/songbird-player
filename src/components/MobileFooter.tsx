"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { hapticLight } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion } from "framer-motion";
import { Home, Search, Library, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface MobileFooterProps {
  onCreatePlaylist?: () => void;
}

export default function MobileFooter({ onCreatePlaylist }: MobileFooterProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>("home");

  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/?");
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path: string, tabName: string) => {
    hapticLight();
    setActiveTab(tabName);
    router.push(path);
  };

  const handleCreatePlaylist = () => {
    hapticLight();
    if (!session) {
      router.push("/api/auth/signin");
      return;
    }
    onCreatePlaylist?.();
  };

  const tabs = [
    {
      name: "home",
      label: "Home",
      icon: Home,
      path: "/",
      requiresAuth: false,
    },
    {
      name: "search",
      label: "Search",
      icon: Search,
      path: "/",
      requiresAuth: false,
    },
    {
      name: "library",
      label: "Library",
      icon: Library,
      path: "/library",
      requiresAuth: true,
    },
    {
      name: "create",
      label: "Create",
      icon: Plus,
      path: null,
      requiresAuth: true,
      onClick: handleCreatePlaylist,
    },
  ];

  return (
    <motion.footer
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={springPresets.gentle}
      className="safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(244,178,102,0.12)] bg-[rgba(10,16,24,0.98)] shadow-[0_-4px_24px_rgba(5,10,18,0.6)] backdrop-blur-2xl"
    >
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.path ? isActive(tab.path) : false;
          const isDisabled = tab.requiresAuth && !session;

          return (
            <motion.button
              key={tab.name}
              onClick={() => {
                if (tab.onClick) {
                  tab.onClick();
                } else if (tab.path) {
                  handleNavigation(tab.path, tab.name);
                }
              }}
              disabled={isDisabled}
              whileTap={{ scale: 0.92 }}
              transition={springPresets.snappy}
              className={`
                flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2.5 transition-all
                ${active
                  ? "text-[var(--color-accent)]"
                  : isDisabled
                  ? "text-[var(--color-muted)] opacity-50"
                  : "text-[var(--color-subtext)]"
                }
                ${!isDisabled && "active:bg-[rgba(244,178,102,0.08)]"}
              `}
              aria-label={tab.label}
              type="button"
            >
              <Icon
                className={`h-6 w-6 transition-transform ${active ? "scale-110" : "scale-100"}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0.5 h-0.5 w-12 rounded-full bg-[var(--color-accent)]"
                  transition={springPresets.snappy}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.footer>
  );
}
