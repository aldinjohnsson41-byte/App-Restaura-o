import { ArrowLeft, Edit, Trash2, Users, MapPin, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EventoDetalhesProps {
  evento: any;
  onEditar: () => void;
  onVoltar: () => void;
  onExcluir?: () => void;
}

export default function EventoDetalhesCompleto({
  evento,
  onEditar,
  onVoltar,
  onExcluir
}: EventoDetalhesProps) {
  
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

  const cores = obterCoresStatus(evento.status);

  const calcularDuracaoEvento = () => {
    if (!evento.multiplos_dias) return '1 dia';
    
    const inicio = new Date(evento.data_evento);
    const fim = new Date(evento.data_fim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `${dias} dias`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
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
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm`}>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* DescriÃ§Ã£o */}
          {evento.descricao && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">DescriÃ§Ã£o</h3>
              <p className="text-blue-800 whitespace-pre-wrap">{evento.descricao}</p>
            </div>
          )}

          {/* InformaÃ§Ãµes Principais */}
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
                      atÃ© {formatarDataBR(evento.data_fim)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* HorÃ¡rio */}
            {!evento.dia_inteiro && evento.hora_inicio && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">HorÃ¡rio</p>
                    <p className="font-semibold text-slate-900 text-lg">
                      {formatarHora(evento.hora_inicio)} Ã s {formatarHora(evento.hora_fim || '')}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {calcularDuracao(evento.hora_inicio, evento.hora_fim)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EspaÃ§o */}
            {evento.espaco && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">EspaÃ§o da Igreja</p>
                    <p className="font-semibold text-slate-900">{evento.espaco.nome}</p>
                    {evento.espaco.localizacao && (
                      <p className="text-sm text-slate-600">{evento.espaco.localizacao}</p>
                    )}
                    {evento.espaco.capacidade && (
                      <p className="text-xs text-slate-500 mt-1">
                        Capacidade: {evento.espaco.capacidade} pessoas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EndereÃ§o */}
            {evento.endereco_completo && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">EndereÃ§o</p>
                    <p className="font-medium text-slate-900">{evento.endereco_completo}</p>
                    <button
                      onClick={() => {
                        const encoded = encodeURIComponent(evento.endereco_completo);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      Ver no mapa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participantes */}
          {evento.participantes && evento.participantes.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900 text-lg">
                  Participantes ({evento.participantes.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evento.participantes.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {p.pessoa?.nome_completo || p.nome_completo}
                        </p>
                        {p.email && (
                          <p className="text-sm text-slate-600">{p.email}</p>
                        )}
                        {p.telefone && (
                          <p className="text-xs text-slate-500">{p.telefone}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          p.confirmacao_presenca === 'confirmado' || p.confirmacao === 'confirmado'
                            ? 'bg-green-100 text-green-700'
                            : p.confirmacao_presenca === 'recusado' || p.confirmacao === 'recusado'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {(p.confirmacao_presenca || p.confirmacao || 'pendente').charAt(0).toUpperCase() + 
                         (p.confirmacao_presenca || p.confirmacao || 'pendente').slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ObservaÃ§Ãµes */}
          {evento.observacoes && (
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">ObservaÃ§Ãµes</h3>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                {evento.observacoes}
              </p>
            </div>
          )}

          {/* InformaÃ§Ãµes Adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Criado em</p>
              <p className="text-sm font-medium text-slate-900">
                {evento.created_at ? formatarDataBR(evento.created_at.split('T')[0]) : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Atualizado em</p>
              <p className="text-sm font-medium text-slate-900">
                {evento.updated_at ? formatarDataBR(evento.updated_at.split('T')[0]) : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Tipo</p>
              <p className="text-sm font-medium text-slate-900">
                {evento.dia_inteiro ? 'Dia Inteiro' : 'HorÃ¡rio EspecÃ­fico'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">DuraÃ§Ã£o</p>
              <p className="text-sm font-medium text-slate-900">
                {calcularDuracaoEvento()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calcularDuracao(inicio: string, fim: string): string {
  if (!inicio || !fim) return '';
  
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  
  const minutos = (hf * 60 + mf) - (hi * 60 + mi);
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas === 0) return `${mins} minutos`;
  if (mins === 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
  return `${horas}h ${mins}min`;
}