// components/MinistryDetails/MinistryDetailsTabs.tsx
import React from 'react';
import { Users, UserPlus, Calendar } from 'lucide-react';
import { TabType } from '../../types/ministryPage.types';

interface MinistryDetailsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MinistryDetailsTabs({ activeTab, onTabChange }: MinistryDetailsTabsProps) {
  const tabs = [
    { id: 'dados' as TabType, label: 'Dados', icon: Users },
    { id: 'membros' as TabType, label: 'Membros', icon: UserPlus },
    { id: 'escalas' as TabType, label: 'Escalas', icon: Calendar }
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-1 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}