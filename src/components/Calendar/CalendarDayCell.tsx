import { useState } from 'react';
import { Clock, Users, MapPin, X, ChevronRight } from 'lucide-react';

interface CalendarDay {
  dia: number;
  ehMes: boolean;
  ehHoje: boolean;
  ehFeriado: boolean;
  feriado?: any;
  eventos: any[];
  reservas: any[];
}

interface CalendarDayCellProps {
  dia: CalendarDay;
  onSelectEvento: (evento: any) => void;
  onEditarEvento: (evento: any) => void;
}

export default function CalendarDayCellMelhorado({
  dia,
  onSelectEvento,
  onEditarEvento,
}: CalendarDayCellProps) {
  const [showModal, setShowModal] = useState(false);

  const eventosOrdenados = [...dia.eventos].sort((a, b) => {
    if (a.dia_inteiro && !b.dia_inteiro) return -1;
    if (!a.dia_inteiro && b.dia_inteiro) return 1;
    if (!a.hora_inicio || !b.hora_inicio) return 0;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  const temMaisEventos = dia.eventos.length > 2;
  const eventosVisiveis = eventosOrdenados.slice(0, 2);
  const eventosRestantes = eventosOrdenados.length - 2;

  const obterCoresFeriado = (tipo: string) => {
    const cores = {
      nacional: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      estadual: 'bg-blue-100 text-blue-800 border-blue-300',
      municipal: 'bg-green-100 text-green-800 border-green-300',
      religioso: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: 'bg-green-100 text-green-800 border-green-300',
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300'
    };
    return cores[status as keyof typeof cores] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <>
      <div
        className={`min-h-32 border border-slate-200 p-2 transition-all hover:shadow-md ${
          !dia.ehMes ? 'bg-slate-50' : 'bg-white'
        } ${dia.ehHoje ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''} relative cursor-pointer`}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className={`font-semibold text-sm ${
              dia.ehMes ? 'text-slate-900' : 'text-slate-400'
            } ${dia.ehHoje ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}
          >
            {dia.dia}
          </span>
          {(dia.eventos.length > 0 || dia.reservas.length > 0) && (
            <span className="text-xs bg-slate-700 text-white rounded-full px-2 py-0.5">
              {dia.eventos.length + dia.reservas.length}
            </span>
          )}
        </div>

        {dia.ehFeriado && dia.feriado && (
          <div className={`text-xs px-2 py-1 rounded mb-1 font-medium truncate border ${obterCoresFeriado(dia.feriado.tipo)}`}>
            {dia.feriado.nome}
          </div>
        )}

        <div className="space-y-1">
          {eventosVisiveis.map((evento) => (
            <button
              key={evento.id}
              onClick={() => onSelectEvento(evento)}
              className={`w-full text-left text-xs px-2 py-1 rounded hover:opacity-80 transition truncate border ${obterCoresStatus(evento.status)}`}
              title={`${evento.nome}${evento.hora_inicio ? ` - ${evento.hora_inicio.substring(0, 5)}` : ''}`}
            >
              <div className="flex items-center gap-1">
                {!evento.dia_inteiro && evento.hora_inicio && (
                  <Clock className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate">
                  {evento.dia_inteiro ? '' : `${evento.hora_inicio?.substring(0, 5)} `}
                  {evento.nome}
                </span>
              </div>
            </button>
          ))}

          {dia.reservas.slice(0, 1).map((reserva) => (
            <div
              key={reserva.id}
              className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded truncate border border-orange-300"
              title={`Reservado: ${reserva.responsavel_nome}`}
            >
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {reserva.responsavel_nome.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}

          {temMaisEventos && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center justify-between font-medium"
            >
              <span>+{eventosRestantes} mais</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Eventos do Dia */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    Eventos do Dia {dia.dia}
                  </h3>
                  <p className="text-blue-100">
                    {eventosOrdenados.length} evento(s) programado(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {eventosOrdenados.map((evento, idx) => (
                  <div
                    key={evento.id}
                    className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                    onClick={() => {
                      setShowModal(false);
                      onSelectEvento(evento);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-slate-700 text-white rounded px-2 py-0.5">
                            #{idx + 1}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${obterCoresStatus(evento.status)}`}>
                            {evento.status}
                          </span>
                          {evento.dia_inteiro && (
                            <span className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-0.5">
                              Dia Inteiro
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg">{evento.nome}</h4>
                      </div>
                    </div>

                    {evento.descricao && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {evento.descricao}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {!evento.dia_inteiro && evento.hora_inicio && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span>{evento.hora_inicio.substring(0, 5)} - {evento.hora_fim?.substring(0, 5)}</span>
                        </div>
                      )}

                      {evento.espaco && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{evento.espaco.nome}</span>
                        </div>
                      )}

                      {evento.participantes && evento.participantes.length > 0 && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span>{evento.participantes.length} participante(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModal(false);
                          onSelectEvento(evento);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModal(false);
                          onEditarEvento(evento);
                        }}
                        className="flex-1 px-3 py-2 text-sm border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}