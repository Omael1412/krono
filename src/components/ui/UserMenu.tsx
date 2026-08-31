// src/components/ui/UserMenu.tsx
import React, { useRef, useState, useEffect } from 'react';
import { User, Settings, Camera, LogOut, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

interface UserMenuProps {
  onOpenSettings: () => void;
}

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const { state, updateUser, dispatch } = useAppContext();
  const { user } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user.displayName);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateUser({ avatarUrl: base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNameSave = () => {
    if (draftName.trim()) {
      updateUser({ displayName: draftName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón trigger */}
      <button
        id="user-menu-trigger"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        )}
        <span className="text-sm font-medium text-white hidden sm:block max-w-[120px] truncate">
          {user.displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50"
          role="menu"
        >
          {/* Avatar & nombre */}
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              {/* Avatar con botón de cambio */}
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={14} className="text-white" />
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Nombre editable */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="w-full bg-neutral-800 text-white text-sm rounded px-2 py-1 outline-none border border-emerald-500"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-sm font-medium text-white hover:text-emerald-400 transition-colors text-left truncate w-full"
                    title="Clic para editar"
                  >
                    {user.displayName}
                  </button>
                )}
                <p className="text-xs text-neutral-500 mt-0.5">Cuenta local</p>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="p-1.5">
            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-sm text-neutral-300 hover:text-white"
            >
              <Settings size={16} />
              Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
