// data/ministryMockData.ts
import { Ministry, Member, Schedule } from '../types/ministryPage.types';

export const mockMinistries: Ministry[] = [
  {
    id: '1',
    nome: 'Louvor e Adoração',
    descricao: 'Ministério de música e cânticos',
    status: 'ativo',
    cor: '#3B82F6',
    membros_count: 12,
    escalas_count: 8
  },
  {
    id: '2',
    nome: 'Infantil',
    descricao: 'Cuidado e ensino das crianças',
    status: 'ativo',
    cor: '#10B981',
    membros_count: 8,
    escalas_count: 4
  },
  {
    id: '3',
    nome: 'Intercessão',
    descricao: 'Oração e intercessão',
    status: 'ativo',
    cor: '#8B5CF6',
    membros_count: 15,
    escalas_count: 6
  }
];

export const mockMembers: Member[] = [
  {
    id: '1',
    pessoa_id: 'p1',
    nome_completo: 'João Silva',
    funcao: 'lider',
    status: 'ativo',
    data_entrada: '2023-01-15',
    email: 'joao@email.com',
    telefone: '(11) 98765-4321'
  },
  {
    id: '2',
    pessoa_id: 'p2',
    nome_completo: 'Maria Santos',
    funcao: 'membro',
    status: 'ativo',
    data_entrada: '2023-03-20',
    telefone: '(11) 98765-1234'
  }
];

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    data_escala: '2025-01-12',
    hora_inicio: '09:00',
    hora_fim: '11:00',
    status: 'confirmada',
    membros: []
  },
  {
    id: '2',
    data_escala: '2025-01-19',
    hora_inicio: '09:00',
    hora_fim: '11:00',
    status: 'planejada',
    membros: []
  }
];