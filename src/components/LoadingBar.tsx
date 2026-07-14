"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(true);
      setPrevPath(pathname);
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPath]);

  if (!loading) return null;

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full overflow-hidden">
      <div className="h-full animate-loading-bar bg-amber-500" />
    </div>
  );
}
