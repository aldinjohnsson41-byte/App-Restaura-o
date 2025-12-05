// components/MinistryDetails/MinistrySchedulesTab.tsx
import React from 'react';
import { Calendar, Plus, Users } from 'lucide-react';
import { Schedule } from '../../types/ministryPage.types';
import { StatusBadge } from '../StatusBadge';

interface MinistrySchedulesTabProps {
  schedules: Schedule[];
  onAddSchedule?: () => void;
  onEditSchedule?: (schedule: Schedule) => void;
}

export function MinistrySchedulesTab({ schedules, onAddSchedule, onEditSchedule }: MinistrySchedulesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Próximas Escalas ({schedules.length})
        </h3>
        {onAddSchedule && (
          <button 
            onClick={onAddSchedule}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Escala
          </button>
        )}
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition cursor-pointer"
            onClick={() => onEditSchedule?.(schedule)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {new Date(schedule.data_escala).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long'
                    })}
                  </div>
                  <div className="text-sm text-slate-600">
                    {schedule.hora_inicio} - {schedule.hora_fim}
                  </div>
                </div>
              </div>
              <StatusBadge status={schedule.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              {schedule.membros.length} membro(s) escalado(s)
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Nenhuma escala cadastrada</p>
        </div>
      )}
    </div>
  );
}