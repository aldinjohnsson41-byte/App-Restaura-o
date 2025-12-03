import { useState, useEffect } from 'react';
import { Pessoa, Cargo, Ministerio, GrupoFamiliar, supabase } from '../../lib/supabase';
import { X, User, Briefcase, Users as UsersIcon, MapPin, Phone, Mail } from 'lucide-react';
import OcorrenciasTab from './OcorrenciasTab';
import HistoricoTab from './HistoricoTab';

interface PessoaDetailsProps {
  pessoaId: string;
  onClose: () => void;
}

export default function PessoaDetails({ pessoaId, onClose }: PessoaDetailsProps) {
  const [pessoa, setPessoa] = useState<
    (Pessoa & {
      cargo?: Cargo;
      ministerio?: Ministerio;
      grupo_familiar?: GrupoFamiliar;
    }) | null
  >(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'ocorrencias' | 'historico'>('dados');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPessoa();
  }, [pessoaId]);

  const loadPessoa = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pessoas')
      .select(`
        *,
        cargo:cargo_id(*),
        ministerio:ministerio_id(*),
        grupo_familiar:grupo_familiar_id(*)
      `)
      .eq('id', pessoaId)
      .single();

    if (data && !error) {
      setPessoa({
        ...data,
        cargo: Array.isArray(data.cargo) ? data.cargo[0] : data.cargo,
        ministerio: Array.isArray(data.ministerio) ? data.ministerio[0] : data.ministerio,
        grupo_familiar: Array.isArray(data.grupo_familiar) ? data.grupo_familiar[0] : data.grupo_familiar,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pessoa) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">{pessoa.nome_completo}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-2 px-6">
            <button
              onClick={() => setActiveTab('dados')}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === 'dados'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('ocorrencias')}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === 'ocorrencias'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Ocorrências
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === 'historico'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600">Data de Nascimento</p>
                    <p className="text-slate-900 font-medium">
                      {new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600">Estado Civil</p>
                    <p className="text-slate-900 font-medium capitalize">{pessoa.estado_civil}</p>
                  </div>
                </div>

                {pessoa.nome_conjuge && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <UsersIcon className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">Cônjuge</p>
                      <p className="text-slate-900 font-medium">{pessoa.nome_conjuge}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600">Telefone</p>
                    <p className="text-slate-900 font-medium">{pessoa.telefone}</p>
                  </div>
                </div>

                {pessoa.whatsapp && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">WhatsApp</p>
                      <p className="text-slate-900 font-medium">{pessoa.whatsapp}</p>
                    </div>
                  </div>
                )}

                {pessoa.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">E-mail</p>
                      <p className="text-slate-900 font-medium">{pessoa.email}</p>
                    </div>
                  </div>
                )}

                {pessoa.profissao && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">Profissão</p>
                      <p className="text-slate-900 font-medium">{pessoa.profissao}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600">Membro da Igreja</p>
                    <span
                      className={`inline-flex mt-1 px-3 py-1 text-sm font-medium rounded-full ${
                        pessoa.e_membro
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {pessoa.e_membro ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>

                {pessoa.e_membro && pessoa.data_membro && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">Data de Membresia</p>
                      <p className="text-slate-900 font-medium">
                        {new Date(pessoa.data_membro).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pessoa.cargo && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-slate-400 mt-1" />
                      <div>
                        <p className="text-sm text-slate-600">Cargo</p>
                        <p className="text-slate-900 font-medium">{pessoa.cargo.nome}</p>
                      </div>
                    </div>
                  )}

                  {pessoa.ministerio && (
                    <div className="flex items-start gap-3">
                      <UsersIcon className="w-5 h-5 text-slate-400 mt-1" />
                      <div>
                        <p className="text-sm text-slate-600">Ministério</p>
                        <p className="text-slate-900 font-medium">{pessoa.ministerio.nome}</p>
                      </div>
                    </div>
                  )}

                  {pessoa.grupo_familiar && (
                    <div className="flex items-start gap-3">
                      <UsersIcon className="w-5 h-5 text-slate-400 mt-1" />
                      <div>
                        <p className="text-sm text-slate-600">Grupo Familiar</p>
                        <p className="text-slate-900 font-medium">{pessoa.grupo_familiar.nome}</p>
                        {pessoa.papel_grupo && (
                          <p className="text-sm text-slate-600 capitalize mt-1">
                            ({pessoa.papel_grupo})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {pessoa.endereco_completo && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Endereço</h3>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-slate-900 font-medium">{pessoa.endereco_completo}</p>
                      {pessoa.cidade && pessoa.estado && (
                        <p className="text-slate-600 mt-1">
                          {pessoa.cidade} - {pessoa.estado}
                          {pessoa.cep && ` | CEP: ${pessoa.cep}`}
                        </p>
                      )}
                      {pessoa.latitude && pessoa.longitude && (
                        <p className="text-sm text-slate-500 mt-2">
                          Coordenadas: {pessoa.latitude.toFixed(6)}, {pessoa.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pessoa.observacoes && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Observações</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{pessoa.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ocorrencias' && <OcorrenciasTab pessoaId={pessoaId} />}

          {activeTab === 'historico' && <HistoricoTab pessoaId={pessoaId} />}
        </div>
      </div>
    </div>
  );
}
