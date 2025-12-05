import React from 'react';
import { Calendar, Users, Clock } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

interface MinistryEscalasTabProps {
  escalas: any[];
  ministryId: string;
  onReload: () => void;
}

export default function MinistryEscalasTab({
  escalas,
  ministryId,
  onReload
}: MinistryEscalasTabProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-900">
          Próximas Escalas ({escalas.length})
        </h4>
      </div>

      {escalas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Nenhuma escala futura cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalas.map((escala) => (
            <div
              key={escala.id}
              className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 capitalize">
                      {formatDate(escala.data_escala)}
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {escala.hora_inicio} - {escala.hora_fim}
                    </div>
                  </div>
                </div>
                <StatusBadge status={escala.status} />
              </div>

              {escala.observacoes && (
                <p className="text-sm text-slate-600 mb-3 pl-13">
                  {escala.observacoes}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-600 pl-13">
                <Users className="w-4 h-4" />
                {escala.membros?.length || 0} membro(s) escalado(s)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}