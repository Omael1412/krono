// src/components/layout/Topbar.tsx
import React from 'react';
import { UserMenu } from '../ui/UserMenu';
import { Music } from 'lucide-react';

interface TopbarProps {
  onOpenSettings: () => void;
}

export function Topbar({ onOpenSettings }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800">
      <div className="flex items-center gap-2 lg:hidden">
        {/* En móvil mostramos el logo aquí porque la sidebar podría estar oculta */}
        <Music className="text-emerald-500" size={24} />
        <span className="text-lg font-bold tracking-tight text-white">Krono</span>
      </div>
      <div className="hidden lg:block" /> {/* Espaciador */}

      <div className="flex items-center gap-4">
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}
