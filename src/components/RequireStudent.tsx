import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export const RequireStudent: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const orgQuery = useQuery({
    queryKey: ["organizations", user?.id, "exists"],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("organizations").select("id").eq("id", user.id).maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  if (loading || orgQuery.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  // If user is an organizer, redirect them to organizer portal
  if (orgQuery.data) {
    return <Navigate to="/org" replace />;
  }

  return <>{children}</>;
};


