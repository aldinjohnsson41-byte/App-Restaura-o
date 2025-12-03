import { useState, useEffect, FormEvent } from 'react';
import { supabase, Cargo, Ministerio, GrupoFamiliar, Pessoa } from '../../lib/supabase';
import { Save, X, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PessoaFormProps {
  pessoa?: Pessoa | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function PessoaForm({ pessoa, onSave, onCancel }: PessoaFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [gruposFamiliares, setGruposFamiliares] = useState<GrupoFamiliar[]>([]);

  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    estado_civil: 'solteiro' as 'solteiro' | 'casado' | 'viúvo' | 'divorciado',
    telefone: '',
    whatsapp: '',
    email: '',
    profissao: '',
    e_membro: false,
    data_membro: '',
    nome_conjuge: '',
    observacoes: '',
    cargo_id: '',
    ministerio_id: '',
    grupo_familiar_id: '',
    papel_grupo: '' as '' | 'membro' | 'líder' | 'co-líder',
    endereco_completo: '',
    cep: '',
    cidade: '',
    estado: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    loadSelectData();
    if (pessoa) {
      setFormData({
        nome_completo: pessoa.nome_completo,
        data_nascimento: pessoa.data_nascimento,
        estado_civil: pessoa.estado_civil,
        telefone: pessoa.telefone,
        whatsapp: pessoa.whatsapp || '',
        email: pessoa.email || '',
        profissao: pessoa.profissao || '',
        e_membro: pessoa.e_membro,
        data_membro: pessoa.data_membro || '',
        nome_conjuge: pessoa.nome_conjuge || '',
        observacoes: pessoa.observacoes || '',
        cargo_id: pessoa.cargo_id || '',
        ministerio_id: pessoa.ministerio_id || '',
        grupo_familiar_id: pessoa.grupo_familiar_id || '',
        papel_grupo: pessoa.papel_grupo || '',
        endereco_completo: pessoa.endereco_completo || '',
        cep: pessoa.cep || '',
        cidade: pessoa.cidade || '',
        estado: pessoa.estado || '',
        latitude: pessoa.latitude,
        longitude: pessoa.longitude,
      });
    }
  }, [pessoa]);

  const loadSelectData = async () => {
    const [cargosRes, ministeriosRes, gruposRes] = await Promise.all([
      supabase.from('cargos').select('*').order('nome'),
      supabase.from('ministerios').select('*').order('nome'),
      supabase.from('grupos_familiares').select('*').order('nome'),
    ]);

    if (cargosRes.data) setCargos(cargosRes.data);
    if (ministeriosRes.data) setMinisterios(ministeriosRes.data);
    if (gruposRes.data) setGruposFamiliares(gruposRes.data);
  };

  const validatePapelGrupo = async (): Promise<boolean> => {
    if (!formData.grupo_familiar_id || !formData.papel_grupo) return true;
    if (formData.papel_grupo === 'membro') return true;

    const grupo = gruposFamiliares.find(g => g.id === formData.grupo_familiar_id);
    if (!grupo) return true;

    if (formData.papel_grupo === 'líder' && grupo.lider_id && grupo.lider_id !== pessoa?.id) {
      setError('Este grupo familiar já possui um líder');
      return false;
    }

    if (formData.papel_grupo === 'co-líder' && grupo.co_lider_id && grupo.co_lider_id !== pessoa?.id) {
      setError('Este grupo familiar já possui um co-líder');
      return false;
    }

    return true;
  };

  const buscarLocalizacao = async () => {
    if (!formData.endereco_completo || !formData.cidade || !formData.estado) {
      setError('Preencha o endereço, cidade e estado para buscar a localização');
      return;
    }

    try {
      const address = `${formData.endereco_completo}, ${formData.cidade}, ${formData.estado}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
        setError('');
      } else {
        setError('Não foi possível encontrar a localização');
      }
    } catch (err) {
      setError('Erro ao buscar localização');
    }
  };

  const registrarHistorico = async (pessoaId: string, acao: string, detalhes?: Record<string, unknown>) => {
    await supabase.from('historico_pessoas').insert({
      pessoa_id: pessoaId,
      acao,
      detalhes,
      created_by: user?.id,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!(await validatePapelGrupo())) return;

    setLoading(true);

    try {
      const pessoaData = {
        ...formData,
        cargo_id: formData.cargo_id || null,
        ministerio_id: formData.ministerio_id || null,
        grupo_familiar_id: formData.grupo_familiar_id || null,
        papel_grupo: formData.papel_grupo || null,
        data_membro: formData.e_membro && formData.data_membro ? formData.data_membro : null,
        created_by: user?.id,
      };

      if (pessoa) {
        const { error: updateError } = await supabase
          .from('pessoas')
          .update(pessoaData)
          .eq('id', pessoa.id);

        if (updateError) throw updateError;

        await registrarHistorico(pessoa.id, 'Dados atualizados', { campos_alterados: Object.keys(formData) });
      } else {
        const { data: newPessoa, error: insertError } = await supabase
          .from('pessoas')
          .insert(pessoaData)
          .select()
          .single();

        if (insertError) throw insertError;
        if (newPessoa) {
          await registrarHistorico(newPessoa.id, 'Pessoa cadastrada');
        }
      }

      if (formData.grupo_familiar_id && formData.papel_grupo && (formData.papel_grupo === 'líder' || formData.papel_grupo === 'co-líder')) {
        const updateData = formData.papel_grupo === 'líder'
          ? { lider_id: pessoa?.id || null }
          : { co_lider_id: pessoa?.id || null };

        await supabase
          .from('grupos_familiares')
          .update(updateData)
          .eq('id', formData.grupo_familiar_id);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pessoa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Dados Pessoais</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              required
              value={formData.data_nascimento}
              onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estado Civil *
            </label>
            <select
              required
              value={formData.estado_civil}
              onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="solteiro">Solteiro</option>
              <option value="casado">Casado</option>
              <option value="viúvo">Viúvo</option>
              <option value="divorciado">Divorciado</option>
            </select>
          </div>

          {formData.estado_civil === 'casado' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Cônjuge
              </label>
              <input
                type="text"
                value={formData.nome_conjuge}
                onChange={(e) => setFormData({ ...formData, nome_conjuge: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              required
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Profissão
            </label>
            <input
              type="text"
              value={formData.profissao}
              onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.e_membro}
                onChange={(e) => setFormData({ ...formData, e_membro: e.target.checked })}
                className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
              />
              <span className="text-sm font-medium text-slate-700">É membro da igreja?</span>
            </label>
          </div>

          {formData.e_membro && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data que se tornou membro
              </label>
              <input
                type="date"
                value={formData.data_membro}
                onChange={(e) => setFormData({ ...formData, data_membro: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Classificação</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cargo
            </label>
            <select
              value={formData.cargo_id}
              onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ministério
            </label>
            <select
              value={formData.ministerio_id}
              onChange={(e) => setFormData({ ...formData, ministerio_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {ministerios.map((ministerio) => (
                <option key={ministerio.id} value={ministerio.id}>
                  {ministerio.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Grupo Familiar
            </label>
            <select
              value={formData.grupo_familiar_id}
              onChange={(e) => setFormData({ ...formData, grupo_familiar_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {gruposFamiliares.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </div>

          {formData.grupo_familiar_id && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Papel no Grupo
              </label>
              <select
                value={formData.papel_grupo}
                onChange={(e) => setFormData({ ...formData, papel_grupo: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="membro">Membro</option>
                <option value="líder">Líder</option>
                <option value="co-líder">Co-líder</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Endereço</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Endereço Completo
            </label>
            <input
              type="text"
              value={formData.endereco_completo}
              onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CEP
            </label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cidade
            </label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estado
            </label>
            <input
              type="text"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={buscarLocalizacao}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Buscar localização no mapa
            </button>
          </div>

          {formData.latitude && formData.longitude && (
            <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
