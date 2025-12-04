import { ArrowLeft, Edit, Trash2, Users, MapPin, Clock, Calendar } from 'lucide-react';
import { EventoAgenda } from '../../types/calendar';
import { formatarDataBR, formatarHora, obterCoresPorStatus } from '../../utils/calendarUtils';

interface EventoDetalhesProps {
  evento: EventoAgenda;
  onEditar: () => void;
  onVoltar: () => void;
}

export default function EventoDetalhes({
  evento,
  onEditar,
  onVoltar,
}: EventoDetalhesProps) {
  const cores = obterCoresPorStatus(evento.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-slate-100 rounded-lg transition mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{evento.nome}</h2>
            <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mt-2 ${cores.bg} ${cores.text}`}>
              {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
            </div>
          </div>
        </div>
        <button
          onClick={onEditar}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Editar
        </button>
      </div>

      <div className="p-6 space-y-6">
        {evento.descricao && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Descrição</h3>
            <p className="text-slate-700">{evento.descricao}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-600">Data</p>
              <p className="font-medium text-slate-900">{formatarDataBR(evento.data_evento)}</p>
            </div>
          </div>

          {!evento.dia_inteiro && evento.hora_inicio && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Horário</p>
                <p className="font-medium text-slate-900">
                  {formatarHora(evento.hora_inicio)} às {formatarHora(evento.hora_fim || '')}
                </p>
              </div>
            </div>
          )}

          {evento.local && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Local</p>
                <p className="font-medium text-slate-900">{evento.local}</p>
              </div>
            </div>
          )}

          {evento.espaco && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Espaço da Igreja</p>
                <p className="font-medium text-slate-900">{evento.espaco.nome}</p>
                {evento.espaco.localizacao && (
                  <p className="text-sm text-slate-600">{evento.espaco.localizacao}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {evento.participantes && evento.participantes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">
                Participantes ({evento.participantes.length})
              </h3>
            </div>
            <div className="space-y-2">
              {evento.participantes.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{p.pessoa?.nome_completo}</p>
                    <p className="text-sm text-slate-600">{p.email_enviado_para}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      p.confirmacao_presenca === 'confirmado'
                        ? 'bg-green-100 text-green-700'
                        : p.confirmacao_presenca === 'recusado'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {p.confirmacao_presenca === 'confirmado'
                      ? 'Confirmado'
                      : p.confirmacao_presenca === 'recusado'
                      ? 'Recusado'
                      : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {evento.observacoes && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Observações</h3>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {evento.observacoes}
            </p>
          </div>
        )}

        {evento.dia_inteiro && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            Este é um evento que ocorre o dia inteiro
          </div>
        )}
      </div>
    </div>
  );
}
