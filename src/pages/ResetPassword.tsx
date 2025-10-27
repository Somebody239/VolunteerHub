import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const ResetPassword: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Could not update password", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Show email being recovered if present
  const email = sp.get("email") ?? undefined;

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md p-6 rounded-xl grid gap-4">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        {email && <p className="text-sm text-muted-foreground">for {email}</p>}
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="pw">New Password</label>
          <Input id="pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
