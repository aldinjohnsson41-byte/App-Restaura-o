import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Users, MapPin, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Mail, Phone, X } from 'lucide-react';

interface EventoDetalhesProps {
  evento: any;
  onEditar: () => void;
  onVoltar: () => void;
  onExcluir?: () => void;
}

export default function EventoDetalhes({
  evento,
  onEditar,
  onVoltar,
  onExcluir
}: EventoDetalhesProps) {
  const [showParticipantes, setShowParticipantes] = useState(false);

  // 🔍 DEBUG - Verificar dados dos participantes
  useEffect(() => {
    console.log('🔍 DEBUG EventoDetalhes - Evento completo:', evento);
    console.log('👥 DEBUG EventoDetalhes - Participantes:', evento.participantes);
    console.log('📊 DEBUG EventoDetalhes - É array?:', Array.isArray(evento.participantes));
    if (evento.participantes) {
      console.log('📊 DEBUG EventoDetalhes - Quantidade:', evento.participantes.length);
      console.log('📊 DEBUG EventoDetalhes - Primeiro participante:', evento.participantes[0]);
    }
  }, [evento]);
  
  const formatarDataBR = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (hora: string) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    };
    return cores[status as keyof typeof cores] || cores.pendente;
  };

  const obterCoresConfirmacao = (confirmacao: string) => {
    const cores = {
      confirmado: 'bg-green-100 text-green-700 border-green-200',
      pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      recusado: 'bg-red-100 text-red-700 border-red-200'
    };
    return cores[confirmacao as keyof typeof cores] || cores.pendente;
  };

  const cores = obterCoresStatus(evento.status);

  const calcularDuracaoEvento = () => {
    if (!evento.multiplos_dias) return '1 dia';
    
    const inicio = new Date(evento.data_evento + 'T00:00:00');
    const fim = new Date(evento.data_fim + 'T00:00:00');
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${dias} dias`;
  };

  const participantes = evento.participantes || [];
  const totalParticipantes = participantes.length;
  const confirmados = participantes.filter((p: any) => p.confirmacao_presenca === 'confirmado').length;
  const pendentes = participantes.filter((p: any) => p.confirmacao_presenca === 'pendente').length;
  const recusados = participantes.filter((p: any) => p.confirmacao_presenca === 'recusado').length;

  console.log('📊 Stats - Total:', totalParticipantes, 'Confirmados:', confirmados, 'Pendentes:', pendentes);

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">

          {/* Header com Gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <button
                  onClick={onVoltar}
                  className="p-2 hover:bg-white/20 rounded-lg transition mt-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{evento.nome}</h2>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                      {evento.status === 'confirmado' && <CheckCircle className="w-4 h-4" />}
                      {evento.status === 'pendente' && <AlertCircle className="w-4 h-4" />}
                      {evento.status === 'cancelado' && <XCircle className="w-4 h-4" />}
                      {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
                    </div>

                    {evento.dia_inteiro && (
                      <div className="px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                        Dia Inteiro
                      </div>
                    )}

                    {evento.multiplos_dias && (
                      <div className="px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                        {calcularDuracaoEvento()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <button
                  onClick={onEditar}
                  className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>

                {onExcluir && (
                  <button
                    onClick={onExcluir}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Descrição */}
            {evento.descricao && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Descrição</h3>
                <p className="text-blue-800 whitespace-pre-wrap">{evento.descricao}</p>
              </div>
            )}

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Data */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">Data do Evento</p>
                    <p className="font-semibold text-slate-900 text-lg">
                      {formatarDataBR(evento.data_evento)}
                    </p>
                    {evento.multiplos_dias && evento.data_fim && (
                      <p className="text-sm text-slate-600 mt-1">
                        até {formatarDataBR(evento.data_fim)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Horário */}
              {!evento.dia_inteiro && evento.hora_inicio && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">Horário</p>
                      <p className="font-semibold text-slate-900 text-lg">
                        {formatarHora(evento.hora_inicio)} às {formatarHora(evento.hora_fim || '')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Espaço */}
              {evento.espaco && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">Espaço da Igreja</p>
                      <p className="font-semibold text-slate-900">{evento.espaco.nome}</p>
                      {evento.espaco.localizacao && (
                        <p className="text-sm text-slate-600">{evento.espaco.localizacao}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Local / Endereço */}
              {(evento.local || evento.endereco_completo) && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">Local</p>
                      {evento.local && (
                        <p className="font-semibold text-slate-900">{evento.local}</p>
                      )}
                      {evento.endereco_completo && (
                        <p className="text-sm text-slate-600 mt-1">{evento.endereco_completo}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Seção de Participantes */}
            {totalParticipantes > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">Participantes</h3>
                      <p className="text-sm text-slate-600">
                        {totalParticipantes} pessoa(s) convidada(s)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowParticipantes(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                  >
                    <Users className="w-4 h-4" />
                    Ver Lista
                  </button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{confirmados}</div>
                    <div className="text-xs text-slate-600">Confirmados</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
                    <div className="text-xs text-slate-600">Pendentes</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{recusados}</div>
                    <div className="text-xs text-slate-600">Recusados</div>
                  </div>
                </div>
              </div>
            )}

            {totalParticipantes === 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Nenhum participante adicionado</p>
              </div>
            )}

            {/* Observações */}
            {evento.observacoes && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Observações</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{evento.observacoes}</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal de Participantes */}
      {showParticipantes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Lista de Participantes</h3>
                    <p className="text-purple-100">
                      {totalParticipantes} pessoa(s) convidada(s) para este evento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowParticipantes(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {participantes.map((participante: any, idx: number) => (
                  <div
                    key={participante.id || idx}
                    className="border-2 border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(participante.pessoa?.nome_completo || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg mb-1">
                            {participante.pessoa?.nome_completo || 'Nome não disponível'}
                          </h4>
                          <div className="space-y-1">
                            {participante.pessoa?.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{participante.pessoa.email}</span>
                              </div>
                            )}
                            {participante.pessoa?.telefone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span>{participante.pessoa.telefone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${obterCoresConfirmacao(participante.confirmacao_presenca)}`}>
                          {participante.confirmacao_presenca === 'confirmado' && '✓ Confirmado'}
                          {participante.confirmacao_presenca === 'pendente' && '⏳ Pendente'}
                          {participante.confirmacao_presenca === 'recusado' && '✗ Recusado'}
                        </span>
                        {participante.data_confirmacao && (
                          <span className="text-xs text-slate-500">
                            {new Date(participante.data_confirmacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <button
                onClick={() => setShowParticipantes(false)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold"
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