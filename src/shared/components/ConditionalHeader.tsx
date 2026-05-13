"use client";

import { usePathname } from "next/navigation";
import Header from "@/shared/components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Header />;
}
