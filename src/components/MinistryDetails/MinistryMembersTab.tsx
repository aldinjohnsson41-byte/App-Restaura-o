// components/MinistryDetails/MinistryMembersTab.tsx
import React from 'react';
import { Users, UserPlus, Edit } from 'lucide-react';
import { Member } from '../../types/ministryPage.types';
import { StatusBadge } from '../StatusBadge';

interface MinistryMembersTabProps {
  members: Member[];
  onAddMember?: () => void;
  onEditMember?: (member: Member) => void;
}

export function MinistryMembersTab({ members, onAddMember, onEditMember }: MinistryMembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Membros ({members.length})
        </h3>
        {onAddMember && (
          <button 
            onClick={onAddMember}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{member.nome_completo}</div>
                <div className="text-sm text-slate-600">
                  {member.email || member.telefone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={member.funcao} />
              <StatusBadge status={member.status} />
              {onEditMember && (
                <button 
                  onClick={() => onEditMember(member)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <Edit className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
          <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Nenhum membro cadastrado</p>
        </div>
      )}
    </div>
  );
}