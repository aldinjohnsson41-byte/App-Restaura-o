import { useState } from 'react';
import { Clock, MapPin, Calendar, ChevronRight } from 'lucide-react';

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

export default function CalendarDayCell({
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

  const obterCoresFeriado = (tipo: string) => {
    const cores = {
      nacional: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
      estadual: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-blue-200',
      municipal: 'bg-gradient-to-br from-green-50 to-green-100 text-green-800 border-green-200',
      religioso: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800 border-purple-200'
    };
    return cores[tipo as keyof typeof cores] || 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-200';
  };

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: 'from-emerald-500 to-green-600',
      pendente: 'from-amber-500 to-orange-600',
      cancelado: 'from-red-500 to-rose-600'
    };
    return cores[status as keyof typeof cores] || 'from-blue-500 to-blue-600';
  };

  const temEventos = dia.eventos.length > 0 || dia.reservas.length > 0;

  return (
    <>
      <div
        onClick={() => temEventos && setShowModal(true)}
        className={`min-h-28 border transition-all duration-200 relative group ${
          !dia.ehMes 
            ? 'bg-slate-50/50 border-slate-100' 
            : 'bg-white border-slate-200 hover:border-blue-300'
        } ${
          dia.ehHoje 
            ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50/30' 
            : ''
        } ${
          temEventos ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''
        }`}
      >
        {/* Número do Dia */}
        <div className="p-2 flex items-start justify-between">
          <div
            className={`font-semibold text-sm flex items-center justify-center transition-all ${
              dia.ehHoje
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-7 h-7 shadow-md'
                : dia.ehMes
                ? 'text-slate-700'
                : 'text-slate-400'
            }`}
          >
            {dia.dia}
          </div>

          {temEventos && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                {dia.eventos.length + dia.reservas.length}
              </span>
            </div>
          )}
        </div>

        {/* Feriado */}
        {dia.ehFeriado && dia.feriado && (
          <div className={`mx-2 mb-2 text-[10px] px-2 py-1 rounded-md font-semibold border ${obterCoresFeriado(dia.feriado.tipo)}`}>
            <div className="truncate">{dia.feriado.nome}</div>
          </div>
        )}

        {/* Indicadores de Eventos (barrinhas coloridas) */}
        {temEventos && (
          <div className="px-2 pb-2 space-y-1">
            {eventosOrdenados.slice(0, 3).map((evento, idx) => (
              <div key={evento.id} className="relative group/evento">
                <div
                  className={`h-1 rounded-full bg-gradient-to-r ${obterCoresStatus(evento.status)} transition-all duration-200 group-hover/evento:h-6 group-hover/evento:shadow-md overflow-hidden`}
                >
                  <div className="hidden group-hover/evento:flex items-center px-2 h-full text-white text-[10px] font-semibold whitespace-nowrap">
                    {!evento.dia_inteiro && evento.hora_inicio && (
                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {evento.dia_inteiro ? '' : `${evento.hora_inicio?.substring(0, 5)} `}
                      {evento.nome}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de mais eventos */}
            {(dia.eventos.length + dia.reservas.length) > 3 && (
              <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1 hover:text-blue-700">
                <span>+{(dia.eventos.length + dia.reservas.length) - 3} mais</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* Hover Effect */}
        {temEventos && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 pointer-events-none rounded transition-all duration-300"></div>
        )}
      </div>

      {/* Modal Moderno de Eventos do Dia */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Gradiente */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl">
                      {dia.dia}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        Eventos do Dia
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {eventosOrdenados.length} evento(s) • {dia.reservas.length} reserva(s)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all flex items-center justify-center group"
                  >
                    <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">×</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Eventos */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {eventosOrdenados.map((evento, idx) => (
                  <div
                    key={evento.id}
                    className="group border-2 border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden"
                    onClick={() => {
                      setShowModal(false);
                      onSelectEvento(evento);
                    }}
                  >
                    {/* Barra lateral colorida */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${obterCoresStatus(evento.status)} group-hover:w-2 transition-all duration-300`}></div>

                    <div className="pl-2">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold bg-slate-700 text-white rounded-lg px-2.5 py-1">
                              #{idx + 1}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold bg-gradient-to-r ${obterCoresStatus(evento.status)} text-white`}>
                              {evento.status}
                            </span>
                            {evento.dia_inteiro && (
                              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-2.5 py-1 font-semibold">
                                Dia Inteiro
                              </span>
                            )}
                            {evento.multiplos_dias && (
                              <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg px-2.5 py-1 font-semibold">
                                Múltiplos Dias
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-xl group-hover:text-blue-600 transition-colors">
                            {evento.nome}
                          </h4>
                        </div>
                      </div>

                      {/* Descrição */}
                      {evento.descricao && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                          {evento.descricao}
                        </p>
                      )}

                      {/* Informações em Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {!evento.dia_inteiro && evento.hora_inicio && (
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 font-medium">Horário</div>
                              <div className="text-sm font-semibold">{evento.hora_inicio.substring(0, 5)} - {evento.hora_fim?.substring(0, 5)}</div>
                            </div>
                          </div>
                        )}

                        {evento.espaco && (
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] text-slate-500 font-medium">Local</div>
                              <div className="text-sm font-semibold truncate">{evento.espaco.nome}</div>
                            </div>
                          </div>
                        )}

                        {evento.multiplos_dias && evento.data_fim && (
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 font-medium">Até</div>
                              <div className="text-sm font-semibold">
                                {new Date(evento.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal(false);
                            onSelectEvento(evento);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal(false);
                            onEditarEvento(evento);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all font-semibold hover:-translate-y-0.5"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reservas */}
                {dia.reservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="border-2 border-orange-200 rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-white"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-orange-600 font-semibold">RESERVA</div>
                        <div className="font-bold text-slate-900">{reserva.responsavel_nome}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {reserva.hora_inicio?.substring(0, 5)} - {reserva.hora_fim?.substring(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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