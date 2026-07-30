"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  RefreshCw,
  DollarSign,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/submissions", label: "Submissions", icon: FileText },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/reschedule", label: "Reschedule", icon: RefreshCw },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
];

function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1.5 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      setAllowed(true);
      return;
    }

    async function checkAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkAdmin();
  }, [pathname, isLoginPage, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <>
      {!isLoginPage && <AdminNav />}
      {children}
    </>
  );
}
