// File: src/__tests__/MobileHeader.test.tsx

import React from "react";
import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import MobileHeader from "@/components/MobileHeader";

const navigationState = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams("q=radiohead"),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationState.push }),
  usePathname: () => navigationState.pathname,
  useSearchParams: () => ({
    get: (key: string) => navigationState.searchParams.get(key),
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}));

vi.mock("@/contexts/MenuContext", () => ({
  useMenu: () => ({ openMenu: vi.fn() }),
}));

vi.mock("@/trpc/react", () => ({
  api: {
    music: {
      getRecentSearches: {
        useQuery: () => ({ data: [] }),
      },
    },
  },
}));

vi.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: () => true,
}));

vi.mock("@/utils/haptics", () => ({
  hapticLight: vi.fn(),
}));

vi.mock("@/utils/spring-animations", () => ({
  springPresets: { gentle: {}, snappy: {} },
}));

let latestSearchBarProps: {
  onChange: (value: string) => void;
  onClear?: () => void;
} | null = null;

vi.mock("@/components/MobileSearchBar", () => ({
  __esModule: true,
  default: (props: { onChange: (value: string) => void; onClear?: () => void }) => {
    latestSearchBarProps = props;
    return <div data-testid="mobile-search-bar" />;
  },
}));

vi.mock("framer-motion", async () => {
  const ReactImport = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ReactImport.forwardRef((props: any, ref) => {
          const {
            layoutId,
            whileTap,
            transition,
            initial,
            animate,
            ...rest
          } = props;
          return ReactImport.createElement(tag, { ...rest, ref });
        }),
    },
  );
  return { motion };
});

describe("MobileHeader", () => {
  beforeEach(() => {
    navigationState.searchParams = new URLSearchParams("q=radiohead");
    navigationState.push.mockClear();
  });

  it("does not clear the query when URL already has a search param", () => {
    render(<MobileHeader />);

    expect(navigationState.push).not.toHaveBeenCalledWith("/");
  });

  it("navigates back to home when a non-empty query is cleared", async () => {
    render(<MobileHeader />);

    expect(latestSearchBarProps).not.toBeNull();
    await act(async () => {
      latestSearchBarProps?.onChange("");
      latestSearchBarProps?.onClear?.();
    });

    await Promise.resolve();
    expect(navigationState.push).toHaveBeenCalledWith("/");
  });
});
