import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Navigate } from "react-router-dom";
import Index from "./Index";

const HomeRouter: React.FC = () => {
  const { user, loading } = useAuth();

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
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (orgQuery.data) {
    return <Navigate to="/org" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default HomeRouter;
