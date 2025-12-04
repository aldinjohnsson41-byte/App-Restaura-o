import { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Save } from "lucide-react";

interface EventoEditProps {
  evento: any;
  onClose: () => void;
  onSave: (eventoAtualizado: any) => void;
}

export default function EventoEdit({ evento, onClose, onSave }: EventoEditProps) {
  const [form, setForm] = useState({
    nome: evento.nome,
    descricao: evento.descricao || "",
    data_evento: evento.data_evento,
    data_fim: evento.data_fim || "",
    hora_inicio: evento.hora_inicio || "",
    hora_fim: evento.hora_fim || "",
    dia_inteiro: evento.dia_inteiro,
    multiplos_dias: evento.multiplos_dias,
    status: evento.status
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.checked });
  };

  const salvar = async () => {
    const { data, error } = await supabase
      .from("eventos")
      .update(form)
      .eq("id", evento.id)
      .select(); // remove .single()

    if (error) {
      console.error(error);
      alert("Erro ao atualizar evento");
      return;
    }
    console.log("DATA RETORNADA:", data);
console.log("DATA[0]:", data[0]);

    onSave(data[0]); // devolve apenas o evento atualizado
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Evento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nome */}
        <label className="block mb-3">
          <span className="text-sm font-medium">Nome</span>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg"
          />
        </label>

        {/* Descrição */}
        <label className="block mb-3">
          <span className="text-sm font-medium">Descrição</span>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg"
          />
        </label>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Data Inicial</span>
            <input
              type="date"
              name="data_evento"
              value={form.data_evento}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </label>

          {form.multiplos_dias && (
            <label className="block">
              <span className="text-sm font-medium">Data Final</span>
              <input
                type="date"
                name="data_fim"
                value={form.data_fim}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </label>
          )}
        </div>

        {/* Horários */}
        {!form.dia_inteiro && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="block">
              <span className="text-sm font-medium">Hora Início</span>
              <input
                type="time"
                name="hora_inicio"
                value={form.hora_inicio}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Hora Fim</span>
              <input
                type="time"
                name="hora_fim"
                value={form.hora_fim}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </label>
          </div>
        )}

        {/* Status */}
        <label className="block mt-3">
          <span className="text-sm font-medium">Status</span>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg"
          >
            <option value="confirmado">Confirmado</option>
            <option value="pendente">Pendente</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
          >
            Cancelar
          </button>

          <button
            onClick={salvar}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>

      </div>
    </div>
  );
}
