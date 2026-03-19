import { Bell, Flower2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";

export function Navbar() {
  return (
    <nav className="bg-[#3D6FEB] text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Flower2 className="w-8 h-8" />
        <span className="text-xl font-semibold">
          Blossom Shop
        </span>
      </div>
    </nav>
  );
}