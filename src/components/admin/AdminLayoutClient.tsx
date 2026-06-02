"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when viewport crosses the md breakpoint (768px).
  // Without this, sidebarOpen can stay true after a resize, keeping the
  // content scroll-locked with no visible sidebar to close.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex shrink-0 border-r border-slate-200">
        <AdminSidebar />
      </aside>

      {/*
        Overlay: conditionally rendered so the backdrop-filter element is absent
        from the DOM when closed. This prevents the iOS Safari bug where
        backdrop-filter intercepts touches even with pointer-events:none.
      */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/*
        Mobile Sidebar Drawer.
        z-[60] keeps it above the mobile page header (z-50) so the sidebar's
        own brand header and X close button are not covered when the drawer is open.
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-60 md:hidden transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation menu"
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/*
        Main content area.
        overflow-hidden intentionally omitted — it was creating a paint-ordering
        issue in some browsers that caused the mobile header to be unreachable.
        Scroll containment is handled by overflow-y on <main> below.
      */}
      <div className="flex-1 flex flex-col min-w-0">
        {/*
          Mobile top header.
          relative z-50 puts this in the root stacking context above the overlay
          (z-40). The sidebar drawer is z-[60] so it paints above this header
          when open, keeping the sidebar's X button accessible.
        */}
        <header className="md:hidden relative z-50 flex items-center h-14 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-bold text-sm tracking-widest">
            TECHRAJ ADMIN
          </span>
        </header>

        {/*
          Scroll lock: toggle overflow-y directly on <main> — this is the actual
          scroll container. document.body.style.overflow has no effect here
          because the outer div's h-screen+overflow-hidden clamps the viewport
          so body never scrolls.
        */}
        <main
          className={`flex-1 overflow-x-hidden ${
            sidebarOpen ? "overflow-y-hidden" : "overflow-y-auto"
          }`}
        >
          <div className="px-4 py-4 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
