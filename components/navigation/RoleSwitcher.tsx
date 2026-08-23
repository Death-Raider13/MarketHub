"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, TrendingUp, ChevronDown, Check } from "lucide-react";

export function RoleSwitcher() {
  const { userProfile, switchRole } = useAuth();
  const router = useRouter();

  if (!userProfile) return null;

  const eligibleForRoleSwitch = ['creator', 'promoter', 'admin', 'super_admin'].includes(userProfile.role || '')
  if (!eligibleForRoleSwitch) return null

  const currentRole = userProfile.activeRole || userProfile.role || "customer";

  const handleRoleChange = async (role: "customer" | "creator" | "promoter") => {
    await switchRole(role);
    if (role === "creator") {
      router.push("/creator/dashboard");
    } else if (role === "promoter") {
      router.push("/dashboard/promoter");
    } else {
      router.push("/books");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "creator":
        return { label: "Creator Mode", icon: <BookOpen className="w-4 h-4 text-purple-400" /> };
      case "promoter":
        return { label: "Affiliate Mode", icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> };
      default:
        return { label: "Student Mode", icon: <GraduationCap className="w-4 h-4 text-cyan-400" /> };
    }
  };

  const activeBadge = getRoleBadge(currentRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-border bg-background/80 hover:bg-muted text-foreground rounded-xl px-3 py-2 text-xs font-semibold shadow-sm">
          {activeBadge.icon}
          <span>{activeBadge.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground p-2 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
          Switch Dashboard Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={() => handleRoleChange("customer")}
          className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-muted focus:bg-muted"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>Student / Reader</span>
          </div>
          {currentRole === "customer" && <Check className="w-4 h-4 text-cyan-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleRoleChange("creator")}
          className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-muted focus:bg-muted"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Creator / Seller</span>
          </div>
          {currentRole === "creator" && <Check className="w-4 h-4 text-purple-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleRoleChange("promoter")}
          className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-muted focus:bg-muted"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Affiliate Promoter</span>
          </div>
          {currentRole === "promoter" && <Check className="w-4 h-4 text-emerald-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
