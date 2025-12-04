import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Save, Trash2, MapPin, Users, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function EventoFormEdit() {
  const { id } = useParams(); // ID do evento vindo da URL
  const navigate = useNavigate();

  const [espacos, setEspacos] = useState<any[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);

  const [searchPessoa, setSearchPessoa] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<any>({
    nome: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    hora_inicio: "",
    hora_fim: "",
    dia_inteiro: false,
    multiplos_dias: false,
    local: "",
    endereco_completo: "",
    espaco_id: "",
    status: "confirmado",
    observacoes: "",
    participantes: []
  });

  /* ------------------------- CARREGAR ESPAÇOS ------------------------- */
  useEffect(() => {
    supabase
      .from("espacos_fisicos")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setEspacos(data || []));
  }, []);

  /* ------------------------- CARREGAR EVENTO ------------------------- */
  useEffect(() => {
    if (!id) return;

    const carregarEvento = async () => {
      const { data, error } = await supabase
        .from("eventos_agenda")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError("Não foi possível carregar o evento.");
        return;
      }

      setFormData({
        nome: data.nome,
        descricao: data.descricao || "",
        data_inicio: data.data_evento,
        data_fim: data.data_fim || data.data_evento,
        hora_inicio: data.hora_inicio || "",
        hora_fim: data.hora_fim || "",
        dia_inteiro: data.dia_inteiro,
        multiplos_dias: data.multiplos_dias,
        local: data.local || "",
        endereco_completo: data.endereco_completo || "",
        espaco_id: data.espaco_id || "",
        status: data.status,
        observacoes: data.observacoes || "",
        participantes: (data.participantes_ids || []).map((pid: string) => ({
          id: pid,
          nome_completo: "",
          email: "",
          telefone: ""
        }))
      });
    };

    carregarEvento();
  }, [id]);

  /* ------------------------- BUSCAR PESSOAS ------------------------- */
  useEffect(() => {
    if (searchPessoa.trim().length < 2) {
      setPessoas([]);
      return;
    }

    const buscar = async () => {
      setLoadingPessoas(true);
      const termo = searchPessoa.trim();

      const { data } = await supabase
        .from("pessoas")
        .select("id,nome_completo,email,telefone,whatsapp")
        .or(`nome_completo.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order("nome_completo")
        .limit(20);

      setPessoas(data || []);
      setLoadingPessoas(false);
    };

    buscar();
  }, [searchPessoa]);

  /* ------------------------- PARTICIPANTES ------------------------- */
  const handleAddParticipante = (p: any) => {
    if (formData.participantes.find((x: any) => x.id === p.id)) {
      setError("Esta pessoa já foi adicionada.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFormData((prev: any) => ({
      ...prev,
      participantes: [
        ...prev.participantes,
        {
          id: p.id,
          nome_completo: p.nome_completo,
          email: p.email,
          telefone: p.telefone || p.whatsapp || ""
        }
      ]
    }));

    setSearchPessoa("");
    setPessoas([]);
  };

  const handleRemoveParticipante = (pid: string) => {
    setFormData((prev: any) => ({
      ...prev,
      participantes: prev.participantes.filter((p: any) => p.id !== pid)
    }));
  };

  /* ------------------------- SALVAR ALTERAÇÕES ------------------------- */
  const handleSubmit = async () => {
    setError("");

    if (!formData.nome.trim()) {
      setError("Nome do evento é obrigatório.");
      return;
    }

    setSubmitting(true);

    const payload = {
      nome: formData.nome,
      descricao: formData.descricao,
      data_evento: formData.data_inicio,
      data_fim: formData.multiplos_dias ? formData.data_fim : formData.data_inicio,
      hora_inicio: formData.dia_inteiro ? null : formData.hora_inicio,
      hora_fim: formData.dia_inteiro ? null : formData.hora_fim,
      dia_inteiro: formData.dia_inteiro,
      multiplos_dias: formData.multiplos_dias,
      local: formData.local,
      endereco_completo: formData.endereco_completo,
      espaco_id: formData.espaco_id || null,
      status: formData.status,
      observacoes: formData.observacoes,
      participantes_ids: formData.participantes.map((p: any) => p.id),
      criado_por: null,
      sincronizado_google: false,
      google_calendar_id: null
    };

    const { error } = await supabase
      .from("eventos_agenda")
      .update(payload)
      .eq("id", id);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError("Erro ao atualizar evento.");
      return;
    }

    alert("Evento atualizado com sucesso!");
    navigate("/calendar");
  };

  /* ------------------------- RENDER ------------------------- */

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Editar Evento</h2>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Nome */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Data Início</label>
          <input
            type="date"
            value={formData.data_inicio}
            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Data Fim</label>
          <input
            type="date"
            value={formData.data_fim}
            onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Hora Início</label>
          <input
            type="time"
            value={formData.hora_inicio}
            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Hora Fim</label>
          <input
            type="time"
            value={formData.hora_fim}
            onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {/* Participantes */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Participantes</label>

        <input
          placeholder="Buscar pessoas..."
          value={searchPessoa}
          onChange={(e) => setSearchPessoa(e.target.value)}
          className="w-full border p-2 rounded mb-2"
        />

        {pessoas.length > 0 && (
          <div className="border rounded bg-white shadow max-h-48 overflow-y-auto">
            {pessoas.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-3 py-2 border-b hover:bg-gray-100"
                onClick={() => handleAddParticipante(p)}
              >
                {p.nome_completo} — {p.email}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {formData.participantes.map((p: any) => (
            <div key={p.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <div className="font-medium">{p.nome_completo}</div>
                <div className="text-sm text-gray-500">{p.email}</div>
              </div>

              <button
                onClick={() => handleRemoveParticipante(p.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        <Save size={18} className="inline mr-2" />
        {submitting ? "Salvando..." : "Salvar Alterações"}
      </button>
    </div>
  );
}
