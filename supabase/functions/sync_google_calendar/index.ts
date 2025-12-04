import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GoogleToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface EventoParaGoogle {
  evento_id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  hora_inicio?: string;
  hora_fim?: string;
  dia_inteiro: boolean;
  local?: string;
}

async function obterTokenGoogle(refresh_token: string): Promise<string | null> {
  try {
    const resposta = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!resposta.ok) {
      throw new Error('Falha ao obter token do Google');
    }

    const dados = (await resposta.json()) as GoogleToken;
    return dados.access_token;
  } catch (erro) {
    console.error('Erro ao obter token:', erro);
    return null;
  }
}

async function criarEventoGoogle(
  accessToken: string,
  calendarId: string,
  evento: EventoParaGoogle
): Promise<{ id: string; htmlLink: string } | null> {
  try {
    const dataInicio = evento.dia_inteiro
      ? evento.data_evento
      : `${evento.data_evento}T${evento.hora_inicio || '09:00'}:00`;

    const dataFim = evento.dia_inteiro
      ? new Date(evento.data_evento)
      : new Date(`${evento.data_evento}T${evento.hora_fim || '10:00'}:00`);

    if (evento.dia_inteiro) {
      dataFim.setDate(dataFim.getDate() + 1);
    }

    const corpo = {
      summary: evento.nome,
      description: evento.descricao || '',
      location: evento.local || '',
      start: evento.dia_inteiro
        ? { date: evento.data_evento }
        : { dateTime: dataInicio, timeZone: 'America/Sao_Paulo' },
      end: evento.dia_inteiro
        ? { date: dataFim.toISOString().split('T')[0] }
        : {
            dateTime: dataFim.toISOString().split('Z')[0],
            timeZone: 'America/Sao_Paulo',
          },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const resposta = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpo),
      }
    );

    if (!resposta.ok) {
      throw new Error(`Falha ao criar evento: ${resposta.statusText}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao criar evento no Google Calendar:', erro);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { acao, evento, refresh_token, calendar_id } = await req.json();

    if (!acao || !evento) {
      return new Response(
        JSON.stringify({ erro: 'Ação e evento são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (acao === 'exportar') {
      if (!refresh_token || !calendar_id) {
        return new Response(
          JSON.stringify({ erro: 'Refresh token e calendar_id são obrigatórios' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const accessToken = await obterTokenGoogle(refresh_token);
      if (!accessToken) {
        return new Response(
          JSON.stringify({ erro: 'Falha ao obter token de acesso' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const resultado = await criarEventoGoogle(accessToken, calendar_id, evento);
      if (!resultado) {
        return new Response(
          JSON.stringify({ erro: 'Falha ao criar evento no Google Calendar' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          sucesso: true,
          google_event_id: resultado.id,
          google_calendar_link: resultado.htmlLink,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ erro: 'Ação não suportada' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (erro) {
    console.error('Erro ao sincronizar Google Calendar:', erro);
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
