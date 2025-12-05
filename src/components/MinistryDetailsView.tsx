// components/MinistryDetailsView.tsx
import React from 'react';
import { ArrowLeft, Edit, Users } from 'lucide-react';
import { Ministry, Member, Schedule, TabType } from '../types/ministryPage.types';
import { StatusBadge } from './StatusBadge';
import { MinistryDetailsTabs } from './MinistryDetails/MinistryDetailsTabs';
import { MinistryDataTab } from './MinistryDetails/MinistryDataTab';
import { MinistryMembersTab } from './MinistryDetails/MinistryMembersTab';
import { MinistrySchedulesTab } from './MinistryDetails/MinistrySchedulesTab';

interface MinistryDetailsViewProps {
  ministry: Ministry;
  members: Member[];
  schedules: Schedule[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onBack: () => void;
  onEdit: () => void;
}

export function MinistryDetailsView({
  ministry,
  members,
  schedules,
  activeTab,
  onTabChange,
  onBack,
  onEdit
}: MinistryDetailsViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: ministry.cor + '20' }}
              >
                <Users className="w-6 h-6" style={{ color: ministry.cor }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{ministry.nome}</h2>
                <StatusBadge status={ministry.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition bg-white"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <MinistryDetailsTabs activeTab={activeTab} onTabChange={onTabChange} />

          <div className="p-6">
            {activeTab === 'dados' && <MinistryDataTab ministry={ministry} />}
            {activeTab === 'membros' && <MinistryMembersTab members={members} />}
            {activeTab === 'escalas' && <MinistrySchedulesTab schedules={schedules} />}
          </div>
        </div>
      </div>
    </div>
  );
}