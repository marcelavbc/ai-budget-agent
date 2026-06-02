// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTranslation } from "./useTranslation";
import type { BudgetClientDetails, BudgetClientItem } from "../types/budget";

const DEFAULT_ITEMS: BudgetClientItem[] = [
  { id: "1", title: "Pintar saló", description: "Català", total: 100 },
];

const DEFAULT_CLIENT: BudgetClientDetails = {
  nameOrCompany: "Test",
  quoteNumber: "",
  date: "",
  estimatedTime: "",
  lang: "ca",
};

const DEFAULT_TRANSLATED_ITEMS: BudgetClientItem[] = [
  { id: "1", title: "Pintar salón", description: "Español", total: 100 },
];

function stubTranslateFetch(
  items: BudgetClientItem[] = DEFAULT_TRANSLATED_ITEMS
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items }),
    })
  );
}

function renderTranslationHook(options?: {
  items?: BudgetClientItem[];
  client?: Partial<BudgetClientDetails>;
}) {
  const initialItems = options?.items ?? DEFAULT_ITEMS;
  const initialClient = { ...DEFAULT_CLIENT, ...options?.client };

  return renderHook(() => {
    const [items, setItems] = useState<BudgetClientItem[]>(initialItems);
    const [client, setClient] = useState<BudgetClientDetails>(initialClient);

    return {
      ...useTranslation({
        items,
        onItemsReplace: setItems,
        onItemChange: (id, patch) =>
          setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
          ),
        setClient,
      }),
      items,
      client,
    };
  });
}

describe("useTranslation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("translates items and sets lang to es", async () => {
    stubTranslateFetch();
    const { result } = renderTranslationHook();

    await act(async () => {
      await result.current.handleTranslate();
    });

    expect(result.current.items[0]!.title).toBe("Pintar salón");
    expect(result.current.client.lang).toBe("es");
  });

  it("reverts translation and sets lang back to ca", async () => {
    stubTranslateFetch();
    const { result } = renderTranslationHook();

    await act(async () => {
      await result.current.handleTranslate();
    });

    expect(result.current.items[0]!.title).toBe("Pintar salón");
    expect(result.current.client.lang).toBe("es");

    await act(async () => {
      await result.current.handleRevertTranslation();
    });

    expect(result.current.items[0]!.title).toBe("Pintar saló");
    expect(result.current.client.lang).toBe("ca");
  });

  it("sets isTranslating to true while translating", async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = () => resolve();
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: DEFAULT_TRANSLATED_ITEMS }),
      })
    );
    const { result } = renderTranslationHook();
    act(() => {
      result.current.handleTranslate();
    });
    expect(result.current.isTranslating).toBe(true);
    resolvePromise();
    await waitFor(() => {
      expect(result.current.isTranslating).toBe(false);
    });
  });
  it("does nothing on revert if no snapshot exists", () => {
    const { result } = renderTranslationHook();
    act(() => {
      result.current.handleRevertTranslation();
    });
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.items[0]!.title).toBe("Pintar saló");
    expect(result.current.client.lang).toBe("ca");
  });
});
