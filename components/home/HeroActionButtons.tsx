"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function HeroActionButtons() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login?next=/dashboard");
    }
  };

  const handleUploadClick = () => {
    if (isAuthenticated) {
      router.push("/submissions");
    } else {
      router.push("/login?next=/submissions");
    }
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <Button
        variant="primary"
        size="lg"
        onClick={handleDashboardClick}
      >
        {isAuthenticated ? "Open Dashboard →" : "Sign In to Dashboard →"}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={handleUploadClick}
      >
        Upload Academic Paper
      </Button>
    </div>
  );
}
