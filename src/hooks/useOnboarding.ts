import { useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../contexts/AuthContext';

export type OnboardingPageKey =
  | 'meu_estudio'
  | 'agendamentos'
  | 'clientes'
  | 'servicos'
  | 'meus_horarios'
  | 'relatorios'
  | 'link_agendamento'
  | 'configuracoes'
  | 'portal_catalogo'
  | 'portal_catalogo_anonimo'
  | 'portal_agendar'
  | 'portal_agendamentos'
  | 'portal_perfil';

import type { DriveStep } from 'driver.js';
const STEPS: Record<OnboardingPageKey, DriveStep[]> = {
  meu_estudio: [
    {
      popover: {
        title: 'Bem-vinda ao Lash Hub! 👋',
        description: 'Vamos te mostrar rapidinho como o sistema funciona. São só alguns passos e você já estará pronta para usar tudo. Pode pular a qualquer momento.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#onboarding-card-faturamento',
      popover: {
        title: 'Seu faturamento 💰',
        description: 'Aqui você acompanha quanto ganhou no mês com atendimentos finalizados. O valor atualiza automaticamente conforme você conclui atendimentos.',
      },
    },
    {
      element: '#onboarding-card-hoje',
      popover: {
        title: 'Agendamentos de hoje 📅',
        description: 'Quantos atendimentos você tem marcados para hoje. Clique no card para ir direto à agenda do dia.',
      },
    },
    {
      element: '#onboarding-card-pendentes',
      popover: {
        title: 'Confirmações pendentes ⏳',
        description: 'Quando sua cliente agendar pelo portal, o agendamento fica aqui até você confirmar. Não deixe acumular!',
      },
    },
    {
      element: '#onboarding-card-clientes',
      popover: {
        title: 'Novas clientes 🌟',
        description: 'Quantas clientes novas se cadastraram no período. Acompanhe seu crescimento por aqui.',
      },
    },
    {
      element: '#onboarding-btn-novo-agendamento',
      popover: {
        title: 'Criar agendamento rápido',
        description: 'Use este botão para adicionar um agendamento manualmente — quando a cliente liga ou manda mensagem pedindo um horário.',
      },
    },
    {
      element: '#onboarding-btn-bloquear',
      popover: {
        title: 'Bloquear horário',
        description: 'Precisa sair mais cedo ou tem um compromisso? Bloqueie o horário para que suas clientes não consigam agendar nesse período.',
      },
    },
    {
      element: '#onboarding-btn-novo-servico',
      popover: {
        title: 'Seus serviços',
        description: 'Cadastre aqui todos os seus serviços com preço e duração. Eles aparecem no portal para suas clientes escolherem na hora de agendar.',
      },
    },
    {
      element: '#onboarding-btn-agenda-dia',
      popover: {
        title: 'Agenda do dia',
        description: 'Veja todos os seus horários de hoje de forma organizada, com nome da cliente, serviço e status.',
      },
    },
    {
      element: '#onboarding-tabbar',
      popover: {
        title: 'Menu principal',
        description: 'Por aqui você acessa tudo: Início, Agenda completa, suas Clientes, Serviços e mais configurações. Explore cada seção!',
      },
    },
    {
      popover: {
        title: 'Tudo pronto! 🎉',
        description: 'Você já conhece o essencial do Lash Hub. Agora é só começar a usar. Qualquer dúvida, clique em Ajuda em qualquer tela.',
        side: 'over' as any, align: 'center',
      },
    },
  ],

  agendamentos: [
    {
      popover: {
        title: 'Sua agenda 📆',
        description: 'Aqui fica toda a sua agenda de atendimentos. Você pode ver por dia, semana ou mês.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-agend-view-toggle',
      popover: {
        title: 'Modos de visualização',
        description: 'Alterne entre visualização mensal, semanal e diária. No celular, o modo diário é o mais prático para o dia a dia.',
      },
    },
    {
      element: '#ob-agend-novo-btn',
      popover: {
        title: 'Novo agendamento',
        description: 'Cria um novo horário para uma cliente. Você escolhe a cliente, o serviço, a data e o horário.',
      },
    },
    {
      element: '#ob-agend-pendentes',
      popover: {
        title: 'Aguardando confirmação',
        description: 'Agendamentos feitos pelo portal que precisam da sua aprovação aparecem aqui. Confirme ou recuse com um clique.',
      },
    },
    {
      element: '#ob-agend-grid',
      popover: {
        title: 'Grade de horários',
        description: 'Clique em qualquer horário disponível para criar um agendamento rapidamente. Horários bloqueados aparecem em cinza.',
      },
    },
  ],

  clientes: [
    {
      popover: {
        title: 'Suas clientes 👩',
        description: 'Aqui você gerencia toda a sua base de clientes — dados pessoais, histórico e Ficha Clínica (Anamnese).',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-clientes-search',
      popover: {
        title: 'Busca rápida',
        description: 'Encontre qualquer cliente pelo nome ou número de WhatsApp. Útil quando a agenda está movimentada.',
      },
    },
    {
      element: '#ob-clientes-add-btn',
      popover: {
        title: 'Cadastrar cliente',
        description: 'Adicione uma nova cliente manualmente com nome e WhatsApp — e-mail, CPF, data de nascimento e Ficha Clínica (Anamnese) são opcionais e podem ser preenchidos depois.',
      },
    },
    {
      element: '#ob-clientes-lista',
      popover: {
        title: 'Lista de clientes',
        description: 'Clique em qualquer cliente para ver o perfil completo, histórico de atendimentos e agendar um novo horário.',
      },
    },
  ],

  servicos: [
    {
      popover: {
        title: 'Seus serviços 💅',
        description: 'Aqui você cadastra e organiza todos os serviços que oferece. Já deixamos alguns serviços pré-cadastrados com categorias e imagens para te dar uma base — fique à vontade para editar nomes, preços e durações conforme a sua realidade. Se preferir usar fotos suas no lugar das imagens padrão, é só substituir em cada serviço.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-servicos-nova-cat',
      popover: {
        title: 'Categorias de serviço',
        description: 'Organize seus serviços em categorias como "Extensão de Cílios", "Design de Sobrancelhas", etc. Facilita a navegação no portal.',
      },
    },
    {
      element: '#ob-servicos-novo-btn',
      popover: {
        title: 'Novo serviço',
        description: 'Cadastre um serviço com nome, preço, duração e uma foto ilustrativa. Você também pode criar variações (ex: Manutenção Fio a Fio, Volume Russo).',
      },
    },
    {
      element: '#ob-servicos-lista',
      popover: {
        title: 'Lista de serviços',
        description: 'Clique no lápis para editar, no botão de energia para ativar/desativar, e na lixeira para excluir. Serviços inativos não aparecem no portal.',
      },
    },
  ],

  meus_horarios: [
    {
      popover: {
        title: 'Meus horários ⏰',
        description: 'Configure os dias e horários em que você atende. Suas clientes só conseguirão agendar nos horários que você liberar aqui.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-horarios-grid',
      popover: {
        title: 'Dias de atendimento',
        description: 'Ative os dias que você trabalha e defina o horário de início e fim de cada um. Você pode ter horários diferentes por dia da semana.',
      },
    },
    {
      element: '#ob-horarios-bloqueios',
      popover: {
        title: 'Bloqueios de agenda',
        description: 'Use os bloqueios para marcar períodos em que você não atende — férias, feriados ou compromissos pessoais. As clientes não conseguirão agendar nesses períodos.',
      },
    },
  ],

  relatorios: [
    {
      popover: {
        title: 'Relatórios 📊',
        description: 'Acompanhe o desempenho do seu negócio com gráficos e números. Filtre por período para ver tendências.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-relatorios-kpis',
      popover: {
        title: 'Indicadores principais',
        description: 'Faturamento total, número de atendimentos e clientes novas no período selecionado. Compare com períodos anteriores para acompanhar o crescimento.',
      },
    },
    {
      element: '#ob-relatorios-graficos',
      popover: {
        title: 'Gráficos de desempenho',
        description: 'Veja a evolução do faturamento, os dias de maior movimento e quais serviços geram mais receita. Use essas informações para tomar decisões melhores.',
      },
    },
  ],

  link_agendamento: [
    {
      popover: {
        title: 'Seu link de agendamento 🔗',
        description: 'Este é o link único do seu portal. Suas clientes acessam para ver seus serviços e agendar horários sem precisar te chamar.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-link-display',
      popover: {
        title: 'Seu link exclusivo',
        description: 'Este é o endereço do seu portal de agendamento. Você pode copiar e colar em qualquer lugar ou compartilhar diretamente.',
      },
    },
    {
      element: '#ob-link-acoes',
      popover: {
        title: 'Compartilhar o link',
        description: 'Copie o link para colocar na bio do Instagram, ou clique em "Compartilhar no WhatsApp" para enviar diretamente para suas clientes.',
      },
    },
    {
      element: '#ob-link-personalizar',
      popover: {
        title: 'Personalizar o endereço',
        description: 'Troque o endereço padrão por algo que represente seu estúdio, como "lashes-by-carol" ou "studio-da-mari". Fica mais fácil de lembrar e compartilhar.',
      },
    },
  ],

  configuracoes: [
    {
      popover: {
        title: 'Configurações ⚙️',
        description: 'Personalize o sistema e o seu portal de acordo com o seu estúdio.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-config-perfil',
      popover: {
        title: 'Seu perfil',
        description: 'Atualize seu nome, foto de perfil e senha de acesso.',
      },
    },
    {
      element: '#ob-config-negocio',
      popover: {
        title: 'Dados do estúdio',
        description: 'Preencha o nome do estúdio, descrição, Instagram e endereço. Essas informações aparecem no portal das suas clientes.',
      },
    },
    {
      element: '#ob-config-visual',
      popover: {
        title: 'Identidade visual',
        description: 'Escolha a paleta de cores do sistema e faça upload da logo do seu estúdio. O portal das clientes vai refletir a sua identidade.',
      },
    },
    {
      element: '#ob-config-agendamento',
      popover: {
        title: 'Configurações de Agendamento',
        description: 'Defina se os agendamentos feitos pelo portal ficam confirmados automaticamente ou aguardam sua aprovação. Personalize também a mensagem que sua cliente recebe ao agendar.',
      },
    },
  ],

  // ── PORTAL DA CLIENTE ──────────────────────────────────────────────────────

  portal_catalogo: [
    {
      popover: {
        title: 'Bem-vinda ao portal! 👋',
        description: 'Aqui você encontra todos os serviços disponíveis e pode agendar seu horário de forma rápida e fácil.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-filtros',
      popover: {
        title: 'Filtrar por categoria',
        description: 'Use esses botões para ver só os serviços de uma categoria específica — como extensão de cílios ou design de sobrancelhas.',
      },
    },
    {
      element: '#ob-portal-servicos-grid',
      popover: {
        title: 'Catálogo de serviços',
        description: 'Cada card mostra o serviço com foto, preço e duração. Clique em "Agendar" no serviço que te interessar para escolher o dia e horário.',
      },
    },
    {
      element: '#ob-portal-nav',
      popover: {
        title: 'Navegação',
        description: 'Pelo menu você acessa o catálogo, agenda um horário, vê seus agendamentos e atualiza seu perfil.',
      },
    },
  ],

  portal_catalogo_anonimo: [
    {
      popover: {
        title: 'Bem-vinda ao portal! 👋',
        description: 'Aqui você encontra todos os serviços disponíveis com preços e duração. Para agendar, é só criar uma conta gratuita — leva menos de 1 minuto!',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-filtros',
      popover: {
        title: 'Filtrar por categoria',
        description: 'Use esses botões para ver só os serviços de uma categoria específica — como extensão de cílios ou design de sobrancelhas.',
      },
    },
    {
      element: '#ob-portal-servicos-grid',
      popover: {
        title: 'Catálogo de serviços',
        description: 'Cada card mostra o serviço com foto, preço e duração. Clique em "Agendar" no serviço que te interessar — você será direcionada para entrar ou criar sua conta.',
      },
    },
    {
      element: '#ob-portal-entrar',
      popover: {
        title: 'Entrar ou se cadastrar',
        description: 'Clique aqui para acessar o portal. Se for sua primeira vez, clique em "Cadastre-se aqui" na próxima tela para criar seu acesso gratuito. Se já tem conta, basta digitar e-mail e senha.',
        side: 'bottom' as any, align: 'end',
      },
    },
    {
      element: '#ob-portal-nav',
      popover: {
        title: 'Menu do portal',
        description: 'Por enquanto só o Catálogo está disponível. Após entrar com sua conta, você verá também: Agendar, Meus Agendamentos e Meu Perfil.',
      },
    },
  ],

  portal_agendar: [
    {
      popover: {
        title: 'Agendar um horário 📅',
        description: 'Siga os passos para escolher o serviço, o dia e o horário que preferir.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-servico-select',
      popover: {
        title: 'Escolha o serviço',
        description: 'Selecione o serviço que deseja agendar. Se tiver variações (como tipo ou duração diferentes), escolha a opção desejada.',
      },
    },
    {
      element: '#ob-portal-calendario',
      popover: {
        title: 'Escolha a data',
        description: 'Selecione um dia disponível no calendário. Dias em cinza não têm horários disponíveis.',
      },
    },
    {
      element: '#ob-portal-horarios',
      popover: {
        title: 'Escolha o horário',
        description: 'Clique no horário que preferir. Horários já ocupados aparecem desabilitados.',
      },
    },
  ],

  portal_agendamentos: [
    {
      popover: {
        title: 'Meus Agendamentos 🗓',
        description: 'Aqui você acompanha todos os seus horários marcados — os próximos e o histórico de atendimentos.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-proximos',
      popover: {
        title: 'Próximos atendimentos',
        description: 'Seus agendamentos futuros aparecem aqui. O status indica se está pendente de confirmação, confirmado ou cancelado.',
      },
    },
    {
      element: '#ob-portal-historico',
      popover: {
        title: 'Histórico',
        description: 'Todos os seus atendimentos anteriores ficam registrados aqui para você consultar quando quiser.',
      },
    },
  ],

  portal_perfil: [
    {
      popover: {
        title: 'Meu Perfil 👤',
        description: 'Aqui você mantém seus dados atualizados para facilitar o agendamento.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-dados-pessoais',
      popover: {
        title: 'Dados pessoais',
        description: 'Mantenha seu nome, WhatsApp e e-mail atualizados. Essas informações são usadas para confirmar seus agendamentos.',
      },
    },
    {
      element: '#ob-portal-senha',
      popover: {
        title: 'Senha de acesso',
        description: 'Altere sua senha quando quiser. Use uma senha segura que só você saiba.',
      },
    },
  ],
};

const DRIVER_CONFIG = (onComplete: () => void, doneBtnText = 'Concluir ✓') =>
  ({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayOpacity: 0.6,
    stagePadding: 6,
    stageRadius: 12,
    showProgress: true,
    progressText: '{{current}}/{{total}}',
    popoverClass: 'lashhub-onboarding-popover',
    nextBtnText: 'Próximo →',
    prevBtnText: '← Anterior',
    doneBtnText,
    onDestroyed: onComplete,
  } as Parameters<typeof driver>[0]);

export function useOnboarding(pageKey: OnboardingPageKey, options?: { studioName?: string | null }) {
  const { isPaginaVista, markPageSeen, loading } = useAuth();

  // Ref garante que startTour sempre lê o studioName mais recente,
  // mesmo quando chamado dentro de um setTimeout com closure desatualizado.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startTour = () => {
    let steps = STEPS[pageKey];
    if (!steps?.length) return;

    // Personaliza o primeiro passo com o nome do estúdio quando disponível
    const studioName = optionsRef.current?.studioName;
    if (studioName && steps[0]?.popover) {
      steps = [
        {
          ...steps[0],
          popover: {
            ...steps[0].popover,
            title: `Bem-vinda ao portal da ${studioName}! \u{1F44B}`,
          },
        },
        ...steps.slice(1),
      ];
    }

    const isLastPage = pageKey === 'meu_estudio';
    const doneBtnText = isLastPage ? 'Começar a usar \u{1F389}' : 'Concluir ✓';

    const driverObj = driver({
      ...DRIVER_CONFIG(() => markPageSeen(pageKey), doneBtnText),
      steps,
    });

    driverObj.drive();
  };

  const autoStart = () => {
    if (loading) return; // aguarda o profile carregar antes de avaliar
    if (isPaginaVista(pageKey)) return;
    setTimeout(() => startTour(), 500);
  };

  return { startTour, autoStart, loading, isPaginaVista: () => isPaginaVista(pageKey) };
}
