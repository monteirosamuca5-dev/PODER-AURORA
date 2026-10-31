/* ============================================================
   PODER — EXPANSÃO DE CARREIRA 0.4.2
   Calendário diário, economia, orçamento, Congresso, gabinete,
   eleições, imprensa, crises, regiões e diplomacia.
   Módulo independente: preserva o salvamento poder_save.
============================================================ */
(() => {
  "use strict";

  const SAVE_KEY = "poder_save";
  const RESUME_KEY = "poder_career_resume";
  const main = document.querySelector(".main-content");
  if (!main) return;

  // O jogo original mantém uma cópia da partida em memória. Este adaptador
  // impede que um salvamento antigo apague a expansão e o novo calendário.
  const nativeSetItem = Storage.prototype.setItem;
  const nativeGetItem = Storage.prototype.getItem;
  let skipCareerMergeNextWrite = false;
  document.addEventListener("click", event => {
    if (event.target.closest && event.target.closest("#confirm-character")) skipCareerMergeNextWrite = true;
  }, true);
  Storage.prototype.setItem = function(key, value) {
    if (key === SAVE_KEY && this === localStorage) {
      try {
        const incoming = JSON.parse(value);
        if (!skipCareerMergeNextWrite) {
          const existingRaw = nativeGetItem.call(this, key);
          const existing = existingRaw ? JSON.parse(existingRaw) : null;
          const incomingRevision = Number(incoming.career?._revision || 0);
          const existingRevision = Number(existing?.career?._revision || 0);
          if (existing?.career && (!incoming.career || incomingRevision < existingRevision)) {
            incoming.career = existing.career;
            const savedDate = dateObj(existing.career.date || "2026-01-01");
            incoming.currentDay = savedDate.getUTCDate();
            incoming.currentMonth = savedDate.getUTCMonth() + 1;
            incoming.currentYear = savedDate.getUTCFullYear();
          }
        }
        skipCareerMergeNextWrite = false;
        value = JSON.stringify(incoming);
      } catch (error) {
        skipCareerMergeNextWrite = false;
        console.warn("Não foi possível mesclar os dados da expansão com o salvamento antigo.", error);
      }
    }
    return nativeSetItem.call(this, key, value);
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
  const fmt = (value, digits = 1) => Number(value || 0).toLocaleString("pt-BR", {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const moneyUA = value => `UA$ ${fmt(value, 1)} bi`;

  const DEFAULT_BUDGET = { health: 20, education: 20, security: 14, infrastructure: 16, social: 18, administration: 12 };
  const SECTORS = [
    ["health", "Saúde", "Hospital, atenção básica e medicamentos"],
    ["education", "Educação", "Escolas, formação e universidades"],
    ["security", "Segurança", "Policiamento, prevenção e investigação"],
    ["infrastructure", "Infraestrutura", "Rodovias, energia, água e transporte"],
    ["social", "Proteção social", "Renda, habitação e assistência"],
    ["administration", "Administração", "Gestão pública e funcionamento do Estado"]
  ];
  const REGION_LIST = [
    ["planalto", "Planalto Norte", "Alto Norte", "Desigualdade de acesso a serviços"],
    ["litoral", "Litoral", "Porto das Águas", "Pressão sobre saneamento e turismo"],
    ["oriental", "Vale Oriental", "Santa Aurora", "Pequenos produtores precisam de crédito"],
    ["serra", "Serra Alta", "Pedra Clara", "Acesso difícil a hospitais e escolas"],
    ["centro", "Centro", "Nova Aurora", "Serviços públicos sobrecarregados"],
    ["fronteira", "Fronteira Oeste", "Campo Novo", "Logística e segurança de fronteira"],
    ["verde", "Vale Verde", "Boa Esperança", "Recuperação ambiental e renda"],
    ["campos", "Campos do Sul", "Estrela do Sul", "Desemprego no setor industrial"],
    ["costa", "Costa Dourada", "Mar do Sol", "Alagamentos em áreas costeiras"],
    ["metropolitana", "Metropolitana", "Aurora Central", "Moradia e mobilidade urbana"]
  ];
  const COUNTRIES = [
    { id:"boreal", name:"República de Boreal", flag:"❄", relation:48, focus:"energia e indústria", color:"#6a9ac7" },
    { id:"monteluz", name:"União de Monteluz", flag:"▲", relation:56, focus:"comércio e tecnologia", color:"#c8a25d" },
    { id:"sereia", name:"Federação de Sereia", flag:"≈", relation:42, focus:"meio ambiente e oceanos", color:"#58a998" }
  ];
  const OFFICES = [
    { id:"vereador", name:"Vereador", level:1, threshold:25, description:"Comece representando sua cidade e formando uma base local." },
    { id:"prefeito", name:"Prefeito", level:2, threshold:32, description:"Administre uma cidade e responda diretamente pelos serviços locais." },
    { id:"deputado", name:"Deputado federal", level:3, threshold:40, description:"Dispute uma cadeira na Câmara dos Deputados de Aurora." },
    { id:"governador", name:"Governador", level:4, threshold:49, description:"Comande uma região e coordene políticas de grande escala." },
    { id:"presidente", name:"Presidente", level:5, threshold:58, description:"Dispute o comando nacional da República de Aurora." }
  ];
  const MINISTER_ROLES = [
    { id:"economy", name:"Ministério da Economia", role:"Economia" },
    { id:"health", name:"Ministério da Saúde", role:"Saúde" },
    { id:"education", name:"Ministério da Educação", role:"Educação" },
    { id:"security", name:"Ministério da Segurança", role:"Segurança" },
    { id:"infrastructure", name:"Ministério da Infraestrutura", role:"Infraestrutura" },
    { id:"foreign", name:"Relações Exteriores", role:"Diplomacia" }
  ];
  const MINISTER_POOL = [
    {name:"Helena Nobre", role:"Economia", competence:87, trust:72, style:"Técnica", suit:"#315b78"},
    {name:"Rafael Dantas", role:"Economia", competence:77, trust:84, style:"Articulador", suit:"#6b4b36"},
    {name:"Marta Valença", role:"Economia", competence:82, trust:69, style:"Reformista", suit:"#586d55"},
    {name:"Dr. Caio Mendes", role:"Saúde", competence:91, trust:78, style:"Especialista", suit:"#315b78"},
    {name:"Lúcia Ferreira", role:"Saúde", competence:83, trust:88, style:"Gestora", suit:"#754c68"},
    {name:"Paulo Siqueira", role:"Saúde", competence:74, trust:81, style:"Conciliador", suit:"#586d55"},
    {name:"Beatriz Ramos", role:"Educação", competence:89, trust:83, style:"Educadora", suit:"#754c68"},
    {name:"André Bastos", role:"Educação", competence:78, trust:76, style:"Gestor", suit:"#315b78"},
    {name:"Sônia Prado", role:"Educação", competence:84, trust:91, style:"Articuladora", suit:"#586d55"},
    {name:"Celso Aranha", role:"Segurança", competence:82, trust:74, style:"Operacional", suit:"#39465d"},
    {name:"Nádia Torres", role:"Segurança", competence:88, trust:80, style:"Investigação", suit:"#754c68"},
    {name:"Bruno Leal", role:"Segurança", competence:76, trust:89, style:"Comunitário", suit:"#586d55"},
    {name:"Ícaro Farias", role:"Infraestrutura", competence:86, trust:74, style:"Planejador", suit:"#315b78"},
    {name:"Tereza Campos", role:"Infraestrutura", competence:82, trust:87, style:"Executora", suit:"#754c68"},
    {name:"Davi Lacerda", role:"Infraestrutura", competence:75, trust:82, style:"Negociador", suit:"#586d55"},
    {name:"Marina Vale", role:"Diplomacia", competence:90, trust:85, style:"Diplomata", suit:"#754c68"},
    {name:"Otávio Reis", role:"Diplomacia", competence:81, trust:78, style:"Negociador", suit:"#315b78"},
    {name:"Ana Luz", role:"Diplomacia", competence:85, trust:91, style:"Multilateralista", suit:"#586d55"}
  ];

  const BILLS = [
    { id:"literacy", title:"Plano Aurora Alfabetizada", sector:"education", cost:3.2, affinity:0.16, description:"Formação de professores, alfabetização na idade certa e metas públicas por região.", effects:{ education:7, approval:3, growth:0.25, treasury:-3.2 } },
    { id:"clinics", title:"Rede de Atenção Regional", sector:"health", cost:4.1, affinity:0.14, description:"Ampliar unidades básicas, equipes médicas e atendimento especializado fora da capital.", effects:{ health:8, approval:3, socialTension:-3, treasury:-4.1 } },
    { id:"roads", title:"Programa Caminhos de Aurora", sector:"infrastructure", cost:5.4, affinity:0.1, description:"Recuperar estradas e melhorar a ligação entre regiões produtoras e centros urbanos.", effects:{ infrastructure:8, growth:0.4, unemployment:-0.3, treasury:-5.4 } },
    { id:"integrity", title:"Lei de Transparência e Integridade", sector:"administration", cost:1.2, affinity:0.12, description:"Abrir contratos, fortalecer auditorias e proteger canais de denúncia.", effects:{ reputation:5, approval:2, socialTension:-2, treasury:-1.2 } },
    { id:"jobs", title:"Pacto de Emprego e Qualificação", sector:"social", cost:3.8, affinity:0.18, description:"Articular empresas, escolas técnicas e trabalhadores com metas de contratação.", effects:{ unemployment:-0.7, approval:4, growth:0.3, treasury:-3.8 } },
    { id:"safety", title:"Plano Integrado de Segurança", sector:"security", cost:3.6, affinity:0.08, description:"Combinar investigação, prevenção, iluminação pública e integração de dados.", effects:{ crime:-5, approval:2, security:6, treasury:-3.6 } }
  ];

  const CRISIS_POOL = [
    { id:"teachers", title:"Paralisação de professores", category:"EDUCAÇÃO", scene:"congress", text:"Sindicatos da educação anunciam paralisação e cobram calendário de valorização profissional.", options:[
      {title:"Abrir negociação e apresentar calendário", detail:"Buscar acordo com metas e prazos possíveis.", effects:{approval:3,reputation:3,socialTension:-5,treasury:-1.2}},
      {title:"Oferecer reajuste imediato", detail:"Tentar encerrar a mobilização com aumento de despesa.", effects:{approval:5,socialTension:-7,treasury:-3.8,inflation:0.2}},
      {title:"Manter a proposta atual e explicar limites", detail:"Preservar o orçamento, mas assumir o custo político.", effects:{approval:-3,reputation:1,socialTension:5}}
    ]},
    { id:"prices", title:"Pressão sobre o custo de vida", category:"ECONOMIA", scene:"newsroom", text:"Famílias relatam alta nos preços de alimentos e transporte. A oposição cobra uma resposta do governo.", options:[
      {title:"Focalizar apoio temporário às famílias vulneráveis", detail:"Direcionar recursos a quem mais sente a alta.", effects:{approval:4,socialTension:-4,treasury:-2.5}},
      {title:"Negociar logística e abastecimento", detail:"Atuar sobre gargalos sem criar despesa permanente.", effects:{growth:0.15,inflation:-0.25,approval:2,treasury:-0.8}},
      {title:"Evitar intervenção e monitorar os preços", detail:"Manter cautela fiscal, com risco de parecer omisso.", effects:{approval:-2,reputation:1}}
    ]},
    { id:"security", title:"Protestos por segurança", category:"SEGURANÇA", scene:"rally", text:"Após uma sequência de crimes, moradores organizam manifestações e pedem providências.", options:[
      {title:"Plano de investigação e prevenção por região", detail:"Combinar ação policial, iluminação e proteção comunitária.", effects:{crime:-5,approval:3,treasury:-1.8}},
      {title:"Reforçar patrulhamento imediatamente", detail:"Responder à urgência com mais presença nas ruas.", effects:{crime:-3,approval:2,treasury:-2.2,socialTension:-2}},
      {title:"Criar comissão de diagnóstico", detail:"Investigar causas e formular medidas de médio prazo.", effects:{reputation:2,approval:-1,crime:-1}}
    ]},
    { id:"flood", title:"Chuvas intensas na Costa Dourada", category:"EMERGÊNCIA", scene:"capital", text:"Equipes locais alertam para alagamentos e famílias em áreas de risco na região costeira.", options:[
      {title:"Mobilizar defesa civil e abrigos", detail:"Priorizar vidas e atendimento emergencial.", effects:{approval:4,health:2,treasury:-2.4,socialTension:-3}},
      {title:"Liberar recursos para drenagem", detail:"Atacar parte do problema estrutural.", effects:{infrastructure:4,growth:0.1,treasury:-3.6}},
      {title:"Aguardar um relatório completo", detail:"Evitar gastos sem diagnóstico, com risco de demora.", effects:{approval:-4,socialTension:5}}
    ]}
  ];

  const INVESTIGATION_POOL = [
    {id:"contracts",category:"AUDITORIA PÚBLICA",title:"Revisão de contratos de infraestrutura",text:"O órgão de controle externo iniciou uma análise de contratos de obras em diferentes regiões. A abertura do procedimento não significa que houve irregularidade.",source:"Tribunal de Contas de Aurora"},
    {id:"conflict",category:"INTEGRIDADE",title:"Representação sobre possível conflito de interesses",text:"Uma entidade civil pediu esclarecimentos sobre vínculos e decisões administrativas. O caso exige transparência e respeito ao direito de defesa.",source:"Procuradoria-Geral de Aurora"},
    {id:"procurement",category:"LICITAÇÕES",title:"Questionamento sobre processo de licitação",text:"Uma concorrente contestou critérios de uma contratação pública. A administração deverá apresentar documentos e justificativas técnicas.",source:"Controladoria Nacional"}
  ];

  function todayISO(save) {
    const c = save.career;
    if (c?.date && /^\d{4}-\d{2}-\d{2}$/.test(c.date)) return c.date;
    const y = Number(save.currentYear) || 2026;
    const m = Number(save.currentMonth) || 1;
    const d = Number(save.currentDay) || 1;
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  function dateObj(iso) {
    const [y,m,d] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(y, (m || 1)-1, d || 1));
  }
  function isoDate(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;
  }
  function addDays(iso, amount) {
    const d = dateObj(iso); d.setUTCDate(d.getUTCDate()+amount); return isoDate(d);
  }
  function addYears(iso, amount) {
    const d = dateObj(iso); d.setUTCFullYear(d.getUTCFullYear()+amount); return isoDate(d);
  }
  function daysBetween(a,b) { return Math.round((dateObj(b)-dateObj(a))/86400000); }
  function dateBR(iso, weekday = false) {
    const opts = {day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"};
    if (weekday) opts.weekday = "long";
    return dateObj(iso).toLocaleDateString("pt-BR", opts);
  }
  function dateShort(iso) { return dateObj(iso).toLocaleDateString("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}); }
  function getSave() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (error) { console.error("Erro ao ler o salvamento PODER:", error); return null; }
  }
  function writeSave(save) {
    try {
      if (save.career) {
        const old = getSave();
        save.career._revision = Math.max(Number(save.career._revision || 0), Number(old?.career?._revision || 0)) + 1;
        save.career._updatedAt = Date.now();
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true;
    }
    catch (error) { console.error("Erro ao salvar PODER:", error); alert("Não foi possível salvar. Verifique o armazenamento do navegador."); return false; }
  }
  function defaultAgenda(date) {
    return [
      {id:"ag-1", date:addDays(date,4), type:"meeting", title:"Reunião de organização partidária", description:"Definir prioridades e alinhar os diretórios regionais.", status:"scheduled"},
      {id:"ag-2", date:addDays(date,9), type:"press", title:"Entrevista na TV Aurora", description:"Apresentar as propostas do partido e responder aos jornalistas.", status:"scheduled"},
      {id:"ag-3", date:addDays(date,16), type:"visit", title:"Visita à região Metropolitana", description:"Ouvir moradores e conhecer problemas de mobilidade urbana.", status:"scheduled"},
      {id:"ag-4", date:addDays(date,23), type:"congress", title:"Encontro com parlamentares", description:"Negociar apoio para uma agenda legislativa.", status:"scheduled"},
      {id:"ag-5", date:addDays(date,32), type:"debate", title:"Debate público de Aurora", description:"Enfrentar o adversário em uma arena de perguntas e respostas.", status:"scheduled"}
    ];
  }
  function makeCareer(date, save) {
    return {
      version:3, date, office:"Liderança partidária", officeId:null, termStart:null, termEnd:null, reelections:0,
      electionDate:"2026-10-04", candidateOffice:null, candidacyRegistered:false, campaignPoints:0, campaignFund:3.5,
      treasury:48, politicalCapital:12, stability:72, institutionalTrust:64,
      economy:{gdp:1280, inflation:4.6, unemployment:8.8, debt:58.0, growth:1.8, crime:37, socialTension:28,
        sectors:{health:62,education:60,security:58,infrastructure:64,social:61,administration:66}, monthlyRevenue:45.0, monthlyExpense:43.0},
      budget:{...DEFAULT_BUDGET}, agenda:defaultAgenda(date), nextAgendaId:6,
      news:[{date,category:"POLÍTICA",title:"Uma nova força política surge em Aurora",text:`${save.party?.name || "Seu partido"} inicia sua organização e prepara os primeiros passos da carreira.`}],
      crises:[], resolvedCrises:[], investigations:[], legalHistory:[], cabinet:{}, congress:null, bills:[], countries:COUNTRIES.map(x=>({...x})),
      monthlyReports:[], electionHistory:[], regionVisits:{}, lastWeeklyNews:date
    };
  }
  function ensureCareer(save) {
    const date = todayISO(save);
    if (!save.career || typeof save.career !== "object") save.career = makeCareer(date, save);
    const c = save.career;
    const base = makeCareer(date, save);
    Object.keys(base).forEach(key => { if (c[key] === undefined || c[key] === null) c[key] = base[key]; });
    c.version = 3;
    if (!c.economy || typeof c.economy !== "object") c.economy = base.economy;
    c.economy = {...base.economy, ...c.economy, sectors:{...base.economy.sectors, ...(c.economy.sectors || {})}};
    c.budget = {...DEFAULT_BUDGET, ...(c.budget || {})};
    c.agenda = Array.isArray(c.agenda) ? c.agenda : base.agenda;
    c.news = Array.isArray(c.news) ? c.news : base.news;
    c.crises = Array.isArray(c.crises) ? c.crises : [];
    c.resolvedCrises = Array.isArray(c.resolvedCrises) ? c.resolvedCrises : [];
    c.investigations = Array.isArray(c.investigations) ? c.investigations : [];
    c.legalHistory = Array.isArray(c.legalHistory) ? c.legalHistory : [];
    c.institutionalTrust = clamp(c.institutionalTrust ?? 64);
    c.bills = Array.isArray(c.bills) ? c.bills : [];
    c.monthlyReports = Array.isArray(c.monthlyReports) ? c.monthlyReports : [];
    c.electionHistory = Array.isArray(c.electionHistory) ? c.electionHistory : [];
    c.countries = Array.isArray(c.countries) && c.countries.length ? c.countries : COUNTRIES.map(x=>({...x}));
    if (!c.congress) c.congress = makeCongress(save);
    if (save.party && c.congress?.parties?.[0]) { c.congress.parties[0].name = save.party.name; c.congress.parties[0].acronym = save.party.acronym; }
    if (c.candidacyRegistered === undefined) c.candidacyRegistered = false;
    if (!c.date || !/^\d{4}-\d{2}-\d{2}$/.test(c.date)) c.date = date;
    if (!c.electionDate || !/^\d{4}-\d{2}-\d{2}$/.test(c.electionDate)) c.electionDate = "2026-10-04";
    // Salvamentos antigos podem estar em uma data posterior à eleição inicial.
    // Nesse caso, agenda o próximo ciclo de quatro anos sem deixar a eleição travada no passado.
    while (c.electionDate <= c.date) c.electionDate = addYears(c.electionDate, 4);
    syncLegacyDate(save);
    return c;
  }
  function syncLegacyDate(save) {
    const c = save.career;
    const d = dateObj(c.date);
    save.currentDay = d.getUTCDate();
    save.currentMonth = d.getUTCMonth()+1;
    save.currentYear = d.getUTCFullYear();
  }
  function pushNews(save, category, title, text) {
    const c = save.career;
    c.news.unshift({date:c.date, category, title, text});
    c.news = c.news.slice(0,30);
  }
  function makeCongress(save) {
    const ownDep = clamp(Math.round(8 + (save.influence || 0)*0.18 + (save.approval || 50)*0.06), 8, 22);
    const ownSen = clamp(Math.round(2 + (save.influence || 0)*0.035 + (save.approval || 50)*0.02), 2, 7);
    const restDep = 60-ownDep, restSen=20-ownSen;
    const depWeights=[0.37,0.27,0.21,0.15], senWeights=[0.35,0.29,0.22,0.14];
    const names=[{name:"Aliança Nacional",acronym:"AN",alignment:"centro-direita",relation:0.43,color:"#6484a8"},{name:"Partido Social de Aurora",acronym:"PSA",alignment:"centro-esquerda",relation:0.55,color:"#a36b75"},{name:"União Liberal",acronym:"UL",alignment:"liberal",relation:0.38,color:"#8b9a67"},{name:"Verde Cidadão",acronym:"VC",alignment:"ambientalista",relation:0.62,color:"#5a9a86"}];
    const parties=[{name:save.party?.name || "Seu partido",acronym:save.party?.acronym || "SEU",alignment:"pragmático",relation:1,color:"#d9b66c",deputies:ownDep,senators:ownSen,isPlayer:true}];
    names.forEach((p,i)=>parties.push({...p,deputies:Math.floor(restDep*depWeights[i]),senators:Math.floor(restSen*senWeights[i]),isPlayer:false}));
    let depGap=60-parties.reduce((s,p)=>s+p.deputies,0), senGap=20-parties.reduce((s,p)=>s+p.senators,0);
    for(let i=1;depGap>0;i=(i%4)+1,depGap--) parties[i].deputies++;
    for(let i=1;senGap>0;i=(i%4)+1,senGap--) parties[i].senators++;
    return {parties,bonusSupport:0,votes:[]};
  }
  function ensure(save) {
    const c = ensureCareer(save);
    if (!save.character || !save.party) return c;
    return c;
  }

  function pixelPerson(variant = 0, colors = {}) {
    const palettes = [
      {hair:"#2c2525",skin:"#d7a27d",suit:"#315b78",tie:"#d9b66c"},
      {hair:"#aeb3bc",skin:"#c88f6b",suit:"#633f4d",tie:"#dfe4e9"},
      {hair:"#4c342a",skin:"#e0b38d",suit:"#49634f",tie:"#d9b66c"},
      {hair:"#282d38",skin:"#9d694d",suit:"#55517b",tie:"#e7e4dc"}
    ];
    const p={...palettes[variant%palettes.length],...colors};
    return `<svg class="career-pixel-person" viewBox="0 0 16 24" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="5" y="1" width="7" height="3" fill="${p.hair}"/><rect x="4" y="3" width="2" height="3" fill="${p.hair}"/><rect x="12" y="4" width="1" height="2" fill="${p.hair}"/>
      <rect x="5" y="5" width="7" height="6" fill="${p.skin}"/><rect x="4" y="7" width="1" height="2" fill="${p.skin}"/><rect x="12" y="7" width="1" height="2" fill="${p.skin}"/>
      <rect x="6" y="7" width="1" height="1" fill="#24252a"/><rect x="10" y="7" width="1" height="1" fill="#24252a"/><rect x="7" y="10" width="3" height="1" fill="#813f3b"/>
      <rect x="4" y="12" width="9" height="8" fill="${p.suit}"/><rect x="7" y="12" width="3" height="7" fill="#f1efe8"/><rect x="8" y="13" width="1" height="5" fill="${p.tie}"/>
      <rect x="3" y="14" width="2" height="5" fill="${p.suit}"/><rect x="12" y="14" width="2" height="5" fill="${p.suit}"/>
      <rect x="5" y="20" width="3" height="3" fill="#202633"/><rect x="10" y="20" width="3" height="3" fill="#202633"/><rect x="4" y="23" width="4" height="1" fill="#111722"/><rect x="10" y="23" width="4" height="1" fill="#111722"/>
    </svg>`;
  }
  function scene(type, caption, people = 3) {
    const sprites = Array.from({length:people},(_,i)=>`<div class="career-scene-person person-${i+1}">${pixelPerson(i)}</div>`).join("");
    return `<div class="career-scene career-scene-${esc(type)}"><div class="career-scene-sun"></div><div class="career-scene-building b1"></div><div class="career-scene-building b2"></div><div class="career-scene-building b3"></div><div class="career-scene-floor"></div><div class="career-scene-caption">${esc(caption)}</div>${sprites}<div class="career-scene-lights"></div></div>`;
  }
  function pageShell(title, subtitle, type, label, body) {
    main.innerHTML = `<section class="career-page"><div class="career-page-top"><div><span class="career-kicker">PODER · REPÚBLICA DE AURORA</span><h1>${title}</h1><p>${subtitle}</p></div><button class="btn-secondary career-back" id="career-back">← GABINETE</button></div>${scene(type,label)}<div class="career-page-body">${body}</div></section>`;
    $("#career-back",main)?.addEventListener("click", goHome);
  }
  function statCard(label, value, detail, tone="gold") {
    return `<article class="career-stat-card"><span>${label}</span><strong class="tone-${tone}">${value}</strong><small>${detail}</small></article>`;
  }
  function meter(label, value, suffix="/100") {
    const v=clamp(value);
    return `<div class="career-meter"><div><span>${label}</span><b>${fmt(v,0)}${suffix}</b></div><div class="career-meter-track"><i style="width:${v}%"></i></div></div>`;
  }
  function homePath(target) {
    if (target === "debate") sessionStorage.setItem("poder_career_open_debate","1");
    if (target === "regions") sessionStorage.setItem("poder_career_open_regions","1");
    goHome();
  }
  function goHome() {
    sessionStorage.setItem(RESUME_KEY,"1");
    window.location.reload();
  }

  function installDashboard() {
    const save=getSave();
    if(!save?.character || !save?.party) return;
    const c=ensure(save); writeSave(save);
    const dashboard=main.querySelector(".creation-screen");
    const actions=main.querySelector(".dashboard-actions");
    if(!dashboard || !actions || main.querySelector(".career-hub")) return;

    const oldMap=$("#open-region-map",actions);
    if(oldMap && oldMap.dataset.careerManaged!=="1") {
      const mapButton=oldMap.cloneNode(true);
      mapButton.id="open-region-map";mapButton.dataset.careerManaged="1";
      oldMap.replaceWith(mapButton);
      mapButton.addEventListener("click",()=>homePath("regions"));
    }
    const oldNext=$("#next-month",actions);
    if(oldNext && oldNext.dataset.careerManaged!=="1") {
      const next=oldNext.cloneNode(true);
      next.id="next-month"; next.dataset.careerManaged="1";
      next.innerHTML="AVANÇAR 1 DIA →";
      oldNext.replaceWith(next);
      next.addEventListener("click",()=>advance(1));
    }
    const office=esc(c.office || "Liderança partidária");
    const date=dateBR(c.date,true);
    const due=c.agenda.filter(a=>a.status==="pending").length;
    const hub=document.createElement("section");
    hub.className="career-hub";
    hub.innerHTML=`
      <div class="career-hub-heading"><div><span class="career-kicker">CENTRAL DE COMANDO</span><h2>O PAÍS NÃO PARA.</h2><p>Gerencie sua carreira, acompanhe Aurora e decida quando o calendário vai avançar.</p></div><div class="career-date-chip"><small>DATA ATUAL</small><strong>${esc(date)}</strong><span>${office}</span></div></div>
      <div class="career-quick-actions"><button class="career-action-button primary" id="career-next-week">⏩ AVANÇAR 7 DIAS</button><button class="career-action-button" data-career-page="calendar">▦ CALENDÁRIO</button><button class="career-action-button" data-career-page="crises">⚑ AGENDA E CRISES ${due?`<b>${due}</b>`:""}</button></div>
      <div class="career-module-grid">
        <button class="career-module-card" data-career-page="economy"><span class="career-module-icon">▥</span><strong>ECONOMIA</strong><small>PIB, inflação, emprego e orçamento</small>${pixelPerson(0)}</button>
        <button class="career-module-card" data-career-page="congress"><span class="career-module-icon">▤</span><strong>CONGRESSO</strong><small>Deputados, senadores e projetos de lei</small>${pixelPerson(1)}</button>
        <button class="career-module-card" data-career-page="government"><span class="career-module-icon">♜</span><strong>GOVERNO</strong><small>Ministros e equipe de confiança</small>${pixelPerson(2)}</button>
        <button class="career-module-card" data-career-page="elections"><span class="career-module-icon">▣</span><strong>ELEIÇÕES</strong><small>Campanha, pesquisas e mandatos</small>${pixelPerson(3)}</button>
        <button class="career-module-card" data-career-page="press"><span class="career-module-icon">▣</span><strong>IMPRENSA</strong><small>Notícias, entrevistas e coletivas</small>${pixelPerson(1)}</button>
        <button class="career-module-card" data-career-page="regions"><span class="career-module-icon">⌖</span><strong>REGIÕES</strong><small>Dez regiões com problemas próprios</small>${pixelPerson(2)}</button>
        <button class="career-module-card" data-career-page="diplomacy"><span class="career-module-icon">◎</span><strong>DIPLOMACIA</strong><small>Acordos e relações internacionais</small>${pixelPerson(3)}</button>
        <button class="career-module-card" data-career-page="crises"><span class="career-module-icon">!</span><strong>CRISES</strong><small>Protestos, greves e emergências</small>${pixelPerson(0)}</button>
        <button class="career-module-card" data-career-page="justice"><span class="career-module-icon">⚖</span><strong>JUSTIÇA</strong><small>Auditorias, investigações e defesa institucional</small>${pixelPerson(1)}</button>
      </div>
      <div class="career-hub-footer"><span>APROVAÇÃO ${Math.round(save.approval||50)}%</span><span>REPUTAÇÃO ${Math.round(save.reputation||50)}%</span><span>CAPITAL POLÍTICO ${Math.round(c.politicalCapital||0)}</span><span>PRÓXIMA ELEIÇÃO ${dateShort(c.electionDate)}</span></div>`;
    dashboard.appendChild(hub);
    $("#career-next-week",hub)?.addEventListener("click",()=>advance(7));
    // Um único listener por botão: o seletor em main já inclui os elementos do hub.
    $$('[data-career-page]',main).forEach(button=>button.addEventListener("click",()=>openPage(button.dataset.careerPage)));

    if(sessionStorage.getItem("poder_career_open_debate")==="1") {
      sessionStorage.removeItem("poder_career_open_debate");
      window.setTimeout(()=>$("#open-debate")?.click(),350);
    }
    if(sessionStorage.getItem("poder_career_open_regions")==="1") {
      sessionStorage.removeItem("poder_career_open_regions");
      window.setTimeout(()=>$("#open-region-map")?.click(),350);
    }
  }

  function addCalendarAgenda(save) {
    const c=save.career;
    if(c.agenda.length) return;
    c.agenda=defaultAgenda(c.date);
  }
  function advance(days) {
    const save=getSave(); if(!save?.character || !save?.party) return;
    const c=ensure(save);
    const n=Math.max(1,Math.min(3650,Number(days)||1));
    const start=c.date;
    for(let i=0;i<n;i++) {
      c.date=addDays(c.date,1); syncLegacyDate(save);
      const d=dateObj(c.date);
      if(d.getUTCDate()===1) monthlyTick(save);
      c.agenda.forEach(item=>{if(item.status==="scheduled" && item.date<=c.date)item.status="pending";});
      if(c.date===c.electionDate) resolveElection(save);
      if(d.getUTCDate()%7===0) weeklyNews(save);
      if(d.getUTCDate()===18 && d.getUTCMonth()%2===0) maybeCreateCrisis(save);
    }
    writeSave(save);
    renderAdvanceSummary(start,c.date,n,save);
  }
  function renderAdvanceSummary(start,end,days,save) {
    const c=save.career;
    const due=c.agenda.filter(a=>a.status==="pending");
    const reports=c.monthlyReports.filter(r=>r.date>start && r.date<=end).length;
    const election=c.electionHistory.find(e=>e.date>start && e.date<=end);
    pageShell("O TEMPO AVANÇOU.",`${days} ${days===1?"dia foi simulado":"dias foram simulados"} na República de Aurora.`,"capital","CALENDÁRIO NACIONAL",`
      <div class="career-summary-grid">${statCard("DATA ANTERIOR",dateShort(start),"Início da simulação")}${statCard("DATA ATUAL",dateShort(end),"Calendário atualizado")}${statCard("RELATÓRIOS MENSAIS",reports,"Meses processados")}${statCard("COMPROMISSOS PENDENTES",due.length,"Itens aguardando sua decisão",due.length?"red":"gold")}</div>
      ${election?`<div class="career-alert"><strong>RESULTADO ELEITORAL</strong><p>${esc(election.resultText)}</p><button class="career-primary-button" data-open="elections">VER ELEIÇÃO</button></div>`:""}
      ${due.length?`<div class="career-section-title"><h2>COMPROMISSOS QUE CHEGARAM</h2><span>Você ainda pode atendê-los.</span></div>${due.slice(0,5).map(a=>agendaCard(a)).join("")}`:`<div class="career-empty">Nenhum compromisso ficou pendente neste período. Seu gabinete segue organizado.</div>`}
      <div class="career-inline-actions career-summary-actions">
        <button class="career-primary-button" id="career-summary-next-day">AVANÇAR +1 DIA →</button>
        <button class="career-secondary-button" id="career-summary-next-commitment">⏩ PRÓXIMO COMPROMISSO</button>
        <button class="career-secondary-button" data-open="calendar">ABRIR CALENDÁRIO</button>
        <button class="career-secondary-button" data-open="home">VOLTAR AO GABINETE</button>
      </div>`);
    bindPageNavigation();
    // A tela de resumo também exibe compromissos com status pendente.
    // Sem este listener, o botão ATENDER anima visualmente, mas não executa a ação.
    $$('[data-attend]',main).forEach(btn=>btn.addEventListener("click",()=>attendAgenda(btn.dataset.attend)));
    // Atalhos de calendário disponíveis sem precisar retornar ao Gabinete.
    $("#career-summary-next-day",main)?.addEventListener("click",()=>advance(1));
    $("#career-summary-next-commitment",main)?.addEventListener("click",advanceToNextCommitment);
  }

  function advanceToNextCommitment() {
    const save=getSave();
    if(!save?.character || !save?.party) return;
    const c=ensure(save);

    // Primeiro atende o compromisso que já chegou, evitando pular algo pendente.
    const pending=c.agenda
      .filter(item=>item.status==="pending" || (item.status==="scheduled" && item.date<=c.date))
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(pending.length) {
      const item=pending[0];
      if(item.status!=="pending") { item.status="pending"; writeSave(save); }
      attendAgenda(item.id);
      return;
    }

    // Sem pendências, localiza o compromisso futuro mais próximo.
    const next=c.agenda
      .filter(item=>item.status==="scheduled" && item.date>c.date)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];
    if(!next) {
      alert("Não há compromissos futuros na agenda. Cadastre um compromisso no Calendário para usar este atalho.");
      return;
    }

    const days=daysBetween(c.date,next.date);
    if(days<1) {
      alert("Não foi possível localizar uma data futura para esse compromisso.");
      return;
    }

    // advance() simula cada dia, incluindo fechamento mensal, notícias,
    // eleições e a conversão do compromisso agendado em pendente.
    advance(days);

    // Abre diretamente o compromisso que motivou o avanço.
    const updated=getSave();
    const arrived=updated?.career?.agenda?.find(item=>item.id===next.id);
    if(arrived?.status==="pending") attendAgenda(arrived.id);
  }

  function monthlyTick(save) {
    const c=save.career, e=c.economy, b=c.budget;
    const ministers=Object.values(c.cabinet||{});
    const cabinetQuality=ministers.length?ministers.reduce((sum,m)=>sum+(Number(m.competence)||50),0)/ministers.length:55;
    const income=44.8 + (e.gdp-1280)*0.0025 + ((save.approval||50)-50)*0.012;
    const spending=42.2 + ((b.infrastructure+b.social)-34)*0.055 + ((b.health+b.education)-40)*0.025 + (b.administration-12)*0.03;
    const balance=income-spending;
    c.treasury=Math.max(-30,c.treasury+balance);
    e.debt=clamp(e.debt-balance*0.045+(c.treasury<0?0.25:0),20,120);
    e.growth=clamp(1.7+(b.infrastructure-16)*0.10+(b.education-20)*0.11+(b.health-20)*0.045+(cabinetQuality-65)*0.009-(e.debt-58)*0.025-(e.inflation-4.5)*0.07,-3,6);
    e.gdp=Math.max(500,e.gdp*(1+e.growth/1200));
    e.inflation=clamp(e.inflation+Math.max(0,-balance)*0.075-Math.max(0,balance)*0.018+(e.growth<0?0.08:0),1,22);
    e.unemployment=clamp(e.unemployment-(e.growth-1.4)*0.075+(b.education<17?0.11:0)+(b.infrastructure<13?0.08:0),3,24);
    e.crime=clamp(e.crime+(e.unemployment-8)*0.045-(b.security-14)*0.095,8,90);
    e.socialTension=clamp(e.socialTension+(e.inflation-4.5)*0.32+(e.unemployment-8)*0.15-(b.social-18)*0.18,5,95);
    Object.keys(e.sectors).forEach(key=>{
      const budgetKey=key==="administration"?"administration":key;
      const target=clamp(42+(b[budgetKey]-DEFAULT_BUDGET[budgetKey])*1.7+(e.growth-1.5)*0.9,25,90);
      e.sectors[key]=clamp(e.sectors[key]+(target-e.sectors[key])*0.08,15,95);
    });
    const approvalDelta=(e.growth>2?0.45:e.growth<0?-0.65:0.05)-(e.inflation>8?0.55:0)-(e.unemployment>12?0.4:0)+(balance>0.5?0.1:-0.1)+(cabinetQuality-65)*0.006;
    save.approval=clamp((save.approval||50)+approvalDelta);
    c.politicalCapital=clamp(c.politicalCapital+(save.approval>55?1:0),0,30);
    c.monthlyReports.unshift({date:c.date,income,spending,balance,growth:e.growth,inflation:e.inflation,unemployment:e.unemployment});
    c.monthlyReports=c.monthlyReports.slice(0,24);
    pushNews(save,"ECONOMIA",balance>=0?"Contas públicas fecham o mês com superávit":"Contas públicas registram déficit no mês",`PIB: ${fmt(e.growth)}% de crescimento anualizado. Inflação em ${fmt(e.inflation)}%. Resultado fiscal: ${moneyUA(balance)}.`);
    maybeCreateCrisis(save);
    maybeCreateInvestigation(save);
  }
  function weeklyNews(save) {
    const c=save.career,e=c.economy;
    const headlines = e.inflation>8
      ? [["ECONOMIA","Famílias cobram resposta para alta dos preços","O custo de vida domina conversas e pressiona a agenda política."],["OPOSIÇÃO","Oposição cobra plano contra a inflação","Parlamentares pedem medidas e metas para estabilizar os preços."]]
      : e.unemployment>11
      ? [["TRABALHO","Desemprego vira tema central em Aurora","Representantes de trabalhadores pedem ações de qualificação e emprego."],["REGIÕES","Interior cobra novas oportunidades","Prefeitos defendem investimento produtivo fora dos grandes centros."]]
      : [["POLÍTICA","Partidos articulam prioridades para a próxima sessão","Lideranças negociam projetos e tentam ampliar suas bases."],["SOCIEDADE","Organizações civis apresentam novas demandas","Entidades pedem transparência e participação nas decisões públicas."],["ECONOMIA","Setor produtivo acompanha indicadores de Aurora","Empresários e trabalhadores aguardam sinais de estabilidade."]];
    const item=headlines[Math.floor(Math.random()*headlines.length)];
    pushNews(save,item[0],item[1],item[2]);
  }
  function maybeCreateCrisis(save) {
    const c=save.career,e=c.economy;
    if(c.crises.some(x=>x.status==="open")) return;
    let chosen=null;
    if(e.inflation>8) chosen=CRISIS_POOL.find(x=>x.id==="prices");
    else if(e.crime>62) chosen=CRISIS_POOL.find(x=>x.id==="security");
    else if(e.socialTension>67) chosen=CRISIS_POOL.find(x=>x.id==="teachers");
    else if(Math.random()<0.17) chosen=CRISIS_POOL[Math.floor(Math.random()*CRISIS_POOL.length)];
    if(chosen && !c.resolvedCrises.includes(chosen.id+":"+c.date.slice(0,7))) {
      c.crises.unshift({id:chosen.id+"-"+c.date,templateId:chosen.id,title:chosen.title,category:chosen.category,scene:chosen.scene,text:chosen.text,options:chosen.options,status:"open",date:c.date});
      pushNews(save,chosen.category,chosen.title,chosen.text);
    }
  }

  function maybeCreateInvestigation(save) {
    const c=save.career;
    if(c.investigations.some(item=>item.status==="open")) return;
    const risk=0.035+Math.max(0,45-(save.reputation||50))*0.002+(c.treasury<0?0.025:0)+(c.economy.debt>85?0.02:0);
    if(Math.random()<Math.min(0.15,risk)) {
      const template=INVESTIGATION_POOL[Math.floor(Math.random()*INVESTIGATION_POOL.length)];
      c.investigations.unshift({id:`${template.id}-${c.date}`,templateId:template.id,category:template.category,title:template.title,text:template.text,source:template.source,date:c.date,status:"open",origin:"external"});
      pushNews(save,"JUSTIÇA",template.title,`${template.source} abriu um procedimento de análise. A abertura não representa condenação ou prova de irregularidade.`);
    }
  }

  function createIndependentAudit(save) {
    const c=save.career;
    if(c.investigations.some(item=>item.status==="open")) { alert("Conclua primeiro o procedimento que já está em andamento."); return; }
    if(c.treasury<0.8) { alert("O Tesouro precisa ter ao menos UA$ 0,8 bi para contratar uma auditoria independente."); return; }
    c.treasury-=0.8;
    const template={id:"independent-audit",category:"CONTROLE PREVENTIVO",title:"Auditoria independente solicitada pelo governo",text:"O próprio governo solicitou uma revisão independente de processos e contratos para fortalecer a prevenção e a transparência.",source:"Auditoria Independente de Aurora"};
    c.investigations.unshift({id:`${template.id}-${c.date}`,templateId:template.id,category:template.category,title:template.title,text:template.text,source:template.source,date:c.date,status:"open",origin:"government"});
    pushNews(save,"JUSTIÇA",template.title,"O governo solicitou uma auditoria independente e reservou recursos para a análise técnica.");
    writeSave(save); renderJustice();
  }

  function renderJustice() {
    const save=getSave(); if(!save)return; const c=ensure(save);
    const active=c.investigations.filter(x=>x.status==="open");
    const history=c.legalHistory.slice(0,8);
    const activeHTML=active.map(item=>`<article class="career-legal-case"><div class="legal-case-heading"><span>${esc(item.category)} · ${dateShort(item.date)}</span><b>EM ANÁLISE</b></div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><small>Órgão responsável: ${esc(item.source)}</small><div class="career-choice-grid"><button class="career-choice" data-investigation="${esc(item.id)}" data-option="0"><span>RESPOSTA A</span><strong>Cooperar e entregar os documentos solicitados</strong><small>Reforça a transparência e facilita a apuração, com custo administrativo.</small></button><button class="career-choice" data-investigation="${esc(item.id)}" data-option="1"><span>RESPOSTA B</span><strong>Solicitar uma perícia técnica independente</strong><small>Amplia a confiança no procedimento, mas exige recursos adicionais.</small></button><button class="career-choice" data-investigation="${esc(item.id)}" data-option="2"><span>RESPOSTA C</span><strong>Apresentar defesa formal e contestar pontos específicos</strong><small>Preserva o direito de defesa e exige fundamentação documental.</small></button></div></article>`).join("");
    const historyHTML=history.map(item=>`<div class="career-report-list"><div><b>${dateShort(item.date)}</b><span>${esc(item.title)}</span><strong class="${item.outcome==="Cooperação integral"?"career-success":"career-muted"}">${esc(item.outcome)}</strong></div></div>`).join("");
    pageShell("JUSTIÇA E CONTROLE INSTITUCIONAL.","Auditorias, investigações e direito de defesa. A abertura de um procedimento não significa culpa: a apuração deve seguir provas e garantias legais.","justice","SUPREMO TRIBUNAL · INSTITUIÇÕES DE AURORA",`
      <div class="career-summary-grid">${statCard("CONFIANÇA INSTITUCIONAL",`${Math.round(c.institutionalTrust)}/100`,"Percepção sobre as instituições","blue")}${statCard("PROCEDIMENTOS ATIVOS",active.length,"Auditorias e apurações",active.length?"red":"green")}${statCard("PROCEDIMENTOS CONCLUÍDOS",c.legalHistory.length,"Histórico de controle")}</div>
      ${activeHTML||`<div class="career-legal-empty">${pixelPerson(1)}<div><strong>NENHUM PROCEDIMENTO EM ABERTO</strong><p>Você pode solicitar uma auditoria independente para revisar contratos e processos antes que surjam questionamentos.</p><button class="career-primary-button" id="justice-audit">SOLICITAR AUDITORIA INDEPENDENTE · UA$ 0,8 BI</button></div></div>`}
      <div class="career-alert"><strong>GARANTIAS INSTITUCIONAIS</strong><p>O governo deve colaborar com os órgãos de controle, mas toda pessoa ou instituição investigada tem direito a conhecer as acusações, apresentar documentos e contestar formalmente os pontos questionados.</p></div>
      <div class="career-section-title"><h2>HISTÓRICO DE PROCEDIMENTOS</h2><span>Registro público da carreira</span></div>${historyHTML||'<div class="career-empty">Nenhum procedimento foi concluído nesta carreira.</div>'}`);
    $("#justice-audit")?.addEventListener("click",()=>createIndependentAudit(getSave()));
    $$('[data-investigation]',main).forEach(btn=>btn.addEventListener("click",()=>resolveInvestigation(btn.dataset.investigation,Number(btn.dataset.option))));
  }

  function resolveInvestigation(id,index) {
    const save=getSave(); if(!save)return; const c=ensure(save);
    const item=c.investigations.find(x=>x.id===id&&x.status==="open"); if(!item)return;
    const choices=[
      {title:"Cooperação integral",effects:{reputation:4,approval:1,institutionalTrust:5,stability:3,treasury:-0.35}},
      {title:"Perícia técnica independente",effects:{reputation:3,institutionalTrust:7,stability:4,treasury:-1.1}},
      {title:"Defesa formal fundamentada",effects:{reputation:1,institutionalTrust:2,stability:1,treasury:-0.2,politicalCapital:1}}
    ];
    const choice=choices[index]; if(!choice)return;
    applyEffects(save,choice.effects); item.status="resolved"; item.resolvedDate=c.date; item.outcome=choice.title;
    c.legalHistory.unshift({date:c.date,title:item.title,outcome:choice.title,source:item.source}); c.legalHistory=c.legalHistory.slice(0,20);
    pushNews(save,"JUSTIÇA",`${item.title}: procedimento concluído`,`${choice.title}. O registro foi incluído no histórico institucional.`);
    writeSave(save); renderJustice();
  }

  function agendaCard(item) {
    const status=item.status==="pending"?"PENDENTE":item.status==="completed"?"CONCLUÍDO":"AGENDADO";
    return `<article class="career-agenda-item"><div class="agenda-date"><b>${dateShort(item.date)}</b><small>${status}</small></div><div class="agenda-copy"><strong>${esc(item.title)}</strong><p>${esc(item.description||"")}</p></div><div class="agenda-actions">${item.status==="pending"?`<button class="career-small-button" data-attend="${esc(item.id)}">ATENDER</button>`:item.status==="scheduled"?`<span class="career-muted">${esc(item.type.toUpperCase())}</span>`:`<span class="career-success">✓</span>`}</div></article>`;
  }
  function renderCalendar() {
    const save=getSave(); if(!save) return; const c=ensure(save); writeSave(save);
    const view=calendarViewDate||c.date; const v=dateObj(view); const year=v.getUTCFullYear(),month=v.getUTCMonth();
    const first=new Date(Date.UTC(year,month,1)); const offset=(first.getUTCDay()+6)%7; const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    const monthName=first.toLocaleDateString("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"});
    let cells="";
    for(let i=0;i<offset;i++) cells+='<div class="calendar-cell empty"></div>';
    for(let day=1;day<=count;day++) {
      const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const items=c.agenda.filter(a=>a.date===iso);
      const isNow=iso===c.date, isPast=iso<c.date;
      cells+=`<div class="calendar-cell ${isNow?"is-today":""} ${isPast?"is-past":""}"><b>${day}</b>${items.slice(0,2).map(a=>`<span class="calendar-dot ${a.status}">${esc(a.title)}</span>`).join("")}</div>`;
    }
    const nextDate=addDays(c.date,1);
    const agendas=[...c.agenda].sort((a,b)=>a.date.localeCompare(b.date));
    pageShell("CALENDÁRIO DE AURORA.",`Hoje é ${dateBR(c.date,true)}. O calendário controla a passagem do tempo e os compromissos da sua carreira.`,"capital","CENTRO ADMINISTRATIVO · AGENDA OFICIAL",`
      <div class="career-calendar-toolbar"><button class="career-secondary-button" id="calendar-prev">← MÊS ANTERIOR</button><strong>${esc(monthName.toUpperCase())}</strong><button class="career-secondary-button" id="calendar-next">PRÓXIMO MÊS →</button></div>
      <div class="career-calendar"><div class="calendar-weekdays">${["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(x=>`<b>${x}</b>`).join("")}</div><div class="calendar-grid">${cells}</div></div>
      <div class="career-calendar-actions"><button class="career-primary-button" id="calendar-one-day">AVANÇAR UM DIA</button><button class="career-secondary-button" id="calendar-seven-days">AVANÇAR 7 DIAS</button><button class="career-secondary-button" id="calendar-current">IR PARA HOJE</button></div>
      <div class="career-jump-card"><div><span class="career-kicker">CONTROLE DO TEMPO</span><h3>AVANÇAR ATÉ UMA DATA</h3><p>Escolha qualquer data futura. O jogo simulará os dias e fechará os meses atravessados.</p></div><div class="career-jump-controls"><input type="date" id="career-jump-date" min="${nextDate}" value="${addDays(c.date,7)}"><button class="career-primary-button" id="career-jump">AVANÇAR ATÉ A DATA →</button></div></div>
      <div class="career-section-title"><h2>AGENDA E COMPROMISSOS</h2><span>${agendas.filter(a=>a.status!=="completed").length} itens em aberto</span></div>
      <form class="career-agenda-form" id="career-agenda-form"><label>DATA<input type="date" id="new-agenda-date" min="${nextDate}" value="${addDays(c.date,14)}" required></label><label>COMPROMISSO<select id="new-agenda-type"><option value="meeting">Reunião partidária</option><option value="press">Entrevista / coletiva</option><option value="visit">Visita regional</option><option value="congress">Articulação no Congresso</option><option value="debate">Debate político</option><option value="campaign">Comício / campanha</option></select></label><button class="career-primary-button" type="submit">+ ADICIONAR À AGENDA</button></form>
      <div class="career-agenda-list">${agendas.length?agendas.map(agendaCard).join(""):'<div class="career-empty">Nenhum compromisso cadastrado.</div>'}</div>`);
    $("#calendar-prev")?.addEventListener("click",()=>{const d=new Date(Date.UTC(year,month-1,1));calendarViewDate=isoDate(d);renderCalendar();});
    $("#calendar-next")?.addEventListener("click",()=>{const d=new Date(Date.UTC(year,month+1,1));calendarViewDate=isoDate(d);renderCalendar();});
    $("#calendar-current")?.addEventListener("click",()=>{calendarViewDate=c.date;renderCalendar();});
    $("#calendar-one-day")?.addEventListener("click",()=>advance(1));
    $("#calendar-seven-days")?.addEventListener("click",()=>advance(7));
    $("#career-jump")?.addEventListener("click",()=>{const target=$("#career-jump-date")?.value;if(!target)return;const diff=daysBetween(c.date,target);if(diff<1){alert("Escolha uma data futura.");return;}if(diff>3650){alert("Para manter a simulação estável, avance no máximo dez anos por vez.");return;}if(diff>365&&!confirm(`Você vai simular ${diff} dias. Deseja continuar?`))return;advance(diff);});
    $("#career-agenda-form")?.addEventListener("submit",event=>{event.preventDefault();const date=$("#new-agenda-date").value,type=$("#new-agenda-type").value;if(date<=c.date){alert("Escolha uma data futura.");return;}const labels={meeting:"Reunião partidária",press:"Entrevista / coletiva",visit:"Visita regional",congress:"Articulação no Congresso",debate:"Debate político",campaign:"Comício / campanha"};c.agenda.push({id:"ag-"+(c.nextAgendaId++),date,type,title:labels[type],description:"Compromisso adicionado à agenda pelo jogador.",status:"scheduled"});writeSave(save);renderCalendar();});
    $$('[data-attend]',main).forEach(btn=>btn.addEventListener("click",()=>attendAgenda(btn.dataset.attend)));
  }
  let calendarViewDate=null;

  function attendAgenda(id) {
    const save=getSave(); if(!save) return; const c=ensure(save); const item=c.agenda.find(a=>a.id===id); if(!item)return;
    if(item.status!=="pending"){alert("Esse compromisso ainda não está disponível.");return;}
    if(item.type==="debate") { item.status="completed";writeSave(save);homePath("debate");return; }
    if(item.type==="congress") { item.status="completed";writeSave(save);renderCongress();return; }
    if(item.type==="campaign") { item.status="completed";c.campaignPoints+=2;writeSave(save);renderElections();return; }
    renderAgendaEvent(item);
  }
  function renderAgendaEvent(item) {
    const options={
      meeting:[{title:"Ouvir as lideranças locais",detail:"Construir prioridades em conjunto.",effects:{influence:3,reputation:2,approval:1}},{title:"Definir metas e responsáveis",detail:"Organizar a atuação do partido.",effects:{politicalCapital:2,reputation:3}},{title:"Priorizar a expansão da base",detail:"Buscar novos apoiadores e diretórios.",effects:{influence:5,treasury:-0.2}}],
      press:[{title:"Responder com dados e transparência",detail:"Explicar metas, custos e prazos.",effects:{reputation:4,approval:2}},{title:"Destacar as prioridades do partido",detail:"Focar na mensagem política.",effects:{approval:3,influence:2}},{title:"Confrontar a linha editorial",detail:"Uma postura dura pode mobilizar apoiadores, mas também gerar desgaste.",effects:{approval:1,reputation:-3,influence:2}}],
      visit:[{title:"Ouvir moradores e lideranças comunitárias",detail:"Conhecer demandas e prioridades.",effects:{approval:3,influence:3,reputation:2}},{title:"Visitar empresas e trabalhadores",detail:"Debater emprego, produção e qualificação.",effects:{growth:0.1,influence:2,approval:1}},{title:"Anunciar um projeto regional",detail:"Assumir compromisso com prazo e orçamento.",effects:{approval:3,treasury:-0.4,reputation:1}}]
    };
    const list=options[item.type]||options.meeting;
    pageShell(esc(item.title).toUpperCase(),`${dateShort(item.date)} · COMPROMISSO DA AGENDA`,item.type==="press"?"newsroom":item.type==="visit"?"rally":"cabinet","COMPROMISSO OFICIAL",`
      <div class="career-event-intro"><div class="career-large-character">${pixelPerson(2)}</div><div><span class="career-kicker">DECISÃO DE CARREIRA</span><h2>${esc(item.description)}</h2><p>Escolha como conduzir este compromisso. O resultado será registrado na sua trajetória.</p></div></div>
      <div class="career-choice-grid">${list.map((o,i)=>`<button class="career-choice" data-agenda-choice="${i}"><span>OPÇÃO ${String.fromCharCode(65+i)}</span><strong>${esc(o.title)}</strong><small>${esc(o.detail)}</small></button>`).join("")}</div>`);
    $$('[data-agenda-choice]',main).forEach(btn=>btn.addEventListener("click",()=>{
      const save=getSave(),c=ensure(save),fresh=c.agenda.find(a=>a.id===item.id);if(!fresh)return;
      const choice=list[Number(btn.dataset.agendaChoice)];applyEffects(save,choice.effects);fresh.status="completed";fresh.result=choice.title;pushNews(save,"AGENDA",item.title,choice.detail);writeSave(save);renderAdvanceSummary(c.date,c.date,0,save);
    }));
  }

  function applyEffects(save,effects={}) {
    const c=ensure(save),e=c.economy;
    if(typeof effects.approval==="number")save.approval=clamp((save.approval||50)+effects.approval);
    if(typeof effects.reputation==="number")save.reputation=clamp((save.reputation||50)+effects.reputation);
    if(typeof effects.influence==="number")save.influence=clamp((save.influence||0)+effects.influence);
    if(typeof effects.politicalCapital==="number")c.politicalCapital=clamp(c.politicalCapital+effects.politicalCapital,0,30);
    if(typeof effects.institutionalTrust==="number")c.institutionalTrust=clamp(c.institutionalTrust+effects.institutionalTrust);
    if(typeof effects.stability==="number")c.stability=clamp(c.stability+effects.stability);
    if(typeof effects.treasury==="number")c.treasury+=effects.treasury;
    if(typeof effects.growth==="number")e.growth=clamp(e.growth+effects.growth,-3,6);
    if(typeof effects.inflation==="number")e.inflation=clamp(e.inflation+effects.inflation,1,22);
    if(typeof effects.unemployment==="number")e.unemployment=clamp(e.unemployment+effects.unemployment,3,24);
    if(typeof effects.crime==="number")e.crime=clamp(e.crime+effects.crime,8,90);
    if(typeof effects.socialTension==="number")e.socialTension=clamp(e.socialTension+effects.socialTension,5,95);
    if(typeof effects.health==="number")e.sectors.health=clamp(e.sectors.health+effects.health);
    if(typeof effects.education==="number")e.sectors.education=clamp(e.sectors.education+effects.education);
    if(typeof effects.security==="number")e.sectors.security=clamp(e.sectors.security+effects.security);
    if(typeof effects.infrastructure==="number")e.sectors.infrastructure=clamp(e.sectors.infrastructure+effects.infrastructure);
    if(typeof effects.social=== "number")e.sectors.social=clamp(e.sectors.social+effects.social);
  }

  function renderEconomy() {
    const save=getSave();if(!save)return;const c=ensure(save),e=c.economy;
    const budgetHTML=SECTORS.map(([id,label,desc])=>`<label class="career-budget-row"><span><b>${label}</b><small>${desc}</small></span><input type="number" min="0" max="100" step="1" data-budget="${id}" value="${c.budget[id]}"><em>%</em></label>`).join("");
    const sectors=SECTORS.map(([id,label])=>meter(label,e.sectors[id])).join("");
    pageShell("ECONOMIA DE AURORA.","A economia responde às decisões, ao orçamento e ao cenário político. O resultado aparece ao longo dos meses.","capital","MINISTÉRIO DA ECONOMIA",`
      <div class="career-summary-grid">${statCard("PIB",`UA$ ${fmt(e.gdp,0)} bi`,`Crescimento ${fmt(e.growth)}% a.a.`)}${statCard("INFLAÇÃO",`${fmt(e.inflation)}%`,"Variação anual estimada","red")}${statCard("DESEMPREGO",`${fmt(e.unemployment)}%`,"População economicamente ativa","blue")}${statCard("DÍVIDA PÚBLICA",`${fmt(e.debt)}% do PIB`,"Dívida bruta estimada","gold")}${statCard("TESOURO",moneyUA(c.treasury),"Saldo acumulado","green")}${statCard("CRIME",`${fmt(e.crime,0)}/100`,"Índice de pressão sobre segurança","red")}</div>
      <div class="career-two-column"><div class="career-panel"><div class="career-section-title"><h2>INDICADORES SOCIAIS</h2><span>0–100</span></div>${sectors}</div><div class="career-panel"><div class="career-section-title"><h2>ÚLTIMO RESULTADO FISCAL</h2></div>${c.monthlyReports[0]?`<div class="career-finance-row"><span>Receitas</span><b>${moneyUA(c.monthlyReports[0].income)}</b></div><div class="career-finance-row"><span>Despesas</span><b>${moneyUA(c.monthlyReports[0].spending)}</b></div><div class="career-finance-row"><span>Saldo</span><b class="${c.monthlyReports[0].balance>=0?"career-success":"career-danger"}">${moneyUA(c.monthlyReports[0].balance)}</b></div>`:`<p class="career-muted">O primeiro relatório será produzido no fechamento do próximo mês.</p>`}<p class="career-muted">As contas são simuladas em bilhões de unidades de Aurora (UA$).</p></div></div>
      <div class="career-panel career-budget-panel"><div class="career-section-title"><h2>ORÇAMENTO PÚBLICO</h2><span>Distribua 100% dos recursos</span></div><p class="career-muted">A distribuição influencia a qualidade dos serviços, o crescimento econômico e a pressão fiscal. O total precisa fechar em 100%.</p><form id="career-budget-form"><div class="career-budget-grid">${budgetHTML}</div><div class="career-budget-total">TOTAL: <strong id="budget-total">${Object.values(c.budget).reduce((a,b)=>a+b,0)}%</strong></div><button type="submit" class="career-primary-button">APROVAR NOVO ORÇAMENTO</button></form></div>
      <div class="career-section-title"><h2>HISTÓRICO ECONÔMICO</h2><span>Últimos 12 fechamentos</span></div><div class="career-report-list">${c.monthlyReports.slice(0,8).map(r=>`<div><b>${dateShort(r.date)}</b><span>PIB ${fmt(r.growth)}% · Inflação ${fmt(r.inflation)}% · Desemprego ${fmt(r.unemployment)}%</span><strong class="${r.balance>=0?"career-success":"career-danger"}">${r.balance>=0?"+":""}${moneyUA(r.balance)}</strong></div>`).join("")||'<div class="career-empty">Ainda não há relatórios mensais. Avance o calendário até o próximo mês.</div>'}</div>`);
    const fields=$$('[data-budget]',main);
    const updateTotal=()=>{const total=fields.reduce((sum,input)=>sum+(Number(input.value)||0),0);$("#budget-total",main).textContent=total+"%";$("#budget-total",main).classList.toggle("career-danger",total!==100);};
    fields.forEach(input=>input.addEventListener("input",updateTotal));
    $("#career-budget-form")?.addEventListener("submit",event=>{event.preventDefault();const total=fields.reduce((sum,input)=>sum+(Number(input.value)||0),0);if(total!==100){alert(`O orçamento precisa somar exatamente 100%. Total atual: ${total}%.`);return;}fields.forEach(input=>c.budget[input.dataset.budget]=clamp(input.value,0,100));writeSave(save);pageShell("ORÇAMENTO APROVADO.","A nova distribuição passa a valer no próximo fechamento mensal.","cabinet","PLANEJAMENTO ORÇAMENTÁRIO",`<div class="career-alert"><strong>ORÇAMENTO REGISTRADO</strong><p>As seis áreas receberam uma distribuição total de 100%. O próximo relatório mostrará os efeitos fiscais e sociais.</p></div><button class="career-primary-button" id="economy-return">VOLTAR À ECONOMIA</button>`);$("#economy-return")?.addEventListener("click",renderEconomy);});
  }

  function renderCongress() {
    const save=getSave();if(!save)return;const c=ensure(save),con=c.congress;
    const partyRows=con.parties.map(p=>`<div class="career-party-row"><span class="party-swatch" style="background:${p.color}"></span><b>${esc(p.acronym)}</b><span>${esc(p.name)}</span><strong>${p.deputies} dep.</strong><strong>${p.senators} sen.</strong></div>`).join("");
    const deputySprites=con.parties.map(p=>Array.from({length:p.deputies},()=>`<span class="career-seat" style="--seat:${p.color}" title="${esc(p.name)}"></span>`).join("")).join("");
    const senateSprites=con.parties.map(p=>Array.from({length:p.senators},()=>`<span class="career-seat" style="--seat:${p.color}" title="${esc(p.name)}"></span>`).join("")).join("");
    const billOptions=BILLS.map(b=>`<option value="${b.id}">${b.title} · ${moneyUA(b.cost)}</option>`).join("");
    pageShell("CONGRESSO NACIONAL.","60 deputados e 20 senadores decidem o futuro das propostas. Negociar é tão importante quanto apresentar bons projetos.","congress","PALÁCIO LEGISLATIVO · SESSÃO PLENÁRIA",`
      <div class="career-chamber-card"><div class="career-chamber-heading"><div><span class="career-kicker">CÂMARA DOS DEPUTADOS</span><h2>60 CADEIRAS</h2></div><div class="career-pixel-crowd">${deputySprites}</div></div><div class="career-chamber-heading senate"><div><span class="career-kicker">SENADO FEDERAL</span><h2>20 CADEIRAS</h2></div><div class="career-pixel-crowd small">${senateSprites}</div></div></div>
      <div class="career-panel"><div class="career-section-title"><h2>COMPOSIÇÃO PARLAMENTAR</h2><span>Distribuição estimada</span></div><div class="career-party-table">${partyRows}</div><p class="career-muted">A bancada do seu partido cresce com influência, popularidade e resultados eleitorais. As demais siglas têm interesses próprios.</p></div>
      <div class="career-panel"><div class="career-section-title"><h2>ARTICULAÇÃO POLÍTICA</h2><span>Capital político: ${Math.round(c.politicalCapital)}</span></div><p>Negociar com as lideranças aumenta o apoio potencial aos seus projetos.</p><button class="career-secondary-button" id="congress-negotiate">NEGOCIAR APOIO · CUSTO 2 PONTOS</button><span class="career-muted" id="congress-bonus">Bônus temporário de apoio: ${Math.round(con.bonusSupport*100)}%</span></div>
      <div class="career-panel"><div class="career-section-title"><h2>APRESENTAR PROJETO DE LEI</h2><span>Votação nas duas casas</span></div><form id="career-bill-form"><select id="career-bill-choice">${billOptions}</select><p class="career-muted" id="bill-description">${BILLS[0].description}</p><button class="career-primary-button" type="submit">APRESENTAR E VOTAR PROJETO →</button></form></div>
      <div class="career-section-title"><h2>HISTÓRICO LEGISLATIVO</h2><span>${c.bills.length} votações</span></div><div class="career-report-list">${c.bills.slice(0,8).map(b=>`<div><b>${dateShort(b.date)}</b><span>${esc(b.title)}</span><strong class="${b.passed?"career-success":"career-danger"}">${b.passed?"APROVADO":"REJEITADO"} · ${b.deputiesYes}/60 dep.</strong></div>`).join("")||'<div class="career-empty">Nenhum projeto votado ainda.</div>'}</div>`);
    $("#career-bill-choice")?.addEventListener("change",()=>{const b=BILLS.find(x=>x.id===$("#career-bill-choice").value);$("#bill-description").textContent=b?.description||"";});
    $("#congress-negotiate")?.addEventListener("click",()=>{if(c.politicalCapital<2){alert("Capital político insuficiente. Avance o calendário ou melhore sua articulação.");return;}c.politicalCapital-=2;con.bonusSupport=clamp(con.bonusSupport+0.07,0,0.28);writeSave(save);renderCongress();});
    $("#career-bill-form")?.addEventListener("submit",event=>{event.preventDefault();voteBill($("#career-bill-choice").value);});
  }
  function voteBill(id) {
    const save=getSave();if(!save)return;const c=ensure(save),con=c.congress,bill=BILLS.find(x=>x.id===id);if(!bill)return;
    const own=con.parties[0],others=con.parties.slice(1),neg=Number(save.character?.negotiation||40),approval=Number(save.approval||50);
    const relationFactor=clamp(0.36+neg/260+approval/800+bill.affinity+con.bonusSupport,0.25,0.82);
    const depCoalition=others.reduce((sum,p)=>sum+p.deputies*relationFactor*(p.relation+0.25),0);
    const senCoalition=others.reduce((sum,p)=>sum+p.senators*relationFactor*(p.relation+0.25),0);
    const depYes=clamp(Math.round(own.deputies+depCoalition+(Math.random()*4-2)),0,60);
    const senYes=clamp(Math.round(own.senators+senCoalition+(Math.random()*2-1)),0,20);
    const passed=depYes>=31&&senYes>=11;
    con.votes.unshift({date:c.date,bill:bill.id,deputiesYes:depYes,senatorsYes:senYes,passed});con.votes=con.votes.slice(0,20);
    c.bills.unshift({date:c.date,title:bill.title,deputiesYes:depYes,senatorsYes:senYes,passed});c.bills=c.bills.slice(0,20);
    con.bonusSupport=Math.max(0,con.bonusSupport-0.07);
    if(passed){applyEffects(save,bill.effects);pushNews(save,"CONGRESSO",`Congresso aprova ${bill.title}`,`O projeto recebeu ${depYes} votos na Câmara e ${senYes} no Senado. A medida seguirá para implementação.`);}else{save.approval=clamp((save.approval||50)-1);save.reputation=clamp((save.reputation||50)-1);pushNews(save,"CONGRESSO",`Projeto ${bill.title} é rejeitado`,`A proposta não alcançou maioria nas duas casas. Foram ${depYes}/60 votos na Câmara e ${senYes}/20 no Senado.`);}
    writeSave(save);
    pageShell(passed?"PROJETO APROVADO.":"PROJETO REJEITADO.",passed?"A articulação política garantiu maioria nas duas casas.":"A proposta não conseguiu apoio suficiente nas duas casas.","congress","RESULTADO DA VOTAÇÃO",`
      <div class="career-vote-result ${passed?"passed":"failed"}"><div class="vote-stamp">${passed?"✓":"×"}</div><h2>${esc(bill.title)}</h2><p>${passed?"O projeto foi aprovado e seus efeitos foram registrados na simulação.":"A oposição conseguiu bloquear a proposta. Você poderá negociar mais apoio e tentar novamente em outra sessão."}</p><div class="career-summary-grid">${statCard("CÂMARA",`${depYes}/60`,"Votos favoráveis",passed?"green":"red")}${statCard("SENADO",`${senYes}/20`,"Votos favoráveis",passed?"green":"red")}${statCard("MAIORIA",passed?"ALCANÇADA":"NÃO ALCANÇADA","31 deputados e 11 senadores")}</div><button class="career-primary-button" id="vote-back">VOLTAR AO CONGRESSO</button></div>`);
    $("#vote-back")?.addEventListener("click",renderCongress);
  }

  function ministerCandidates(role) { return MINISTER_POOL.filter(p=>p.role===role); }
  function renderGovernment() {
    const save=getSave();if(!save)return;const c=ensure(save);
    const official=OFFICES.find(o=>o.name===c.office)?.id==="presidente";
    const cards=MINISTER_ROLES.map((role,index)=>{
      const current=c.cabinet[role.id];const options=ministerCandidates(role.role);
      return `<article class="career-minister-card"><div class="career-minister-art">${pixelPerson(index)}</div><div class="career-minister-copy"><span class="career-kicker">${esc(role.name.toUpperCase())}</span><strong>${current?esc(current.name):"Cargo vago"}</strong><small>${current?`${current.competence}/100 de competência · ${current.trust}/100 de confiança`:`Escolha alguém para coordenar a área.`}</small><form class="minister-form" data-role="${role.id}"><select aria-label="Escolher ministro">${options.map(p=>`<option value="${esc(p.name)}" ${current?.name===p.name?"selected":""}>${esc(p.name)} · ${p.style} (${p.competence})</option>`).join("")}</select><button class="career-small-button" type="submit">${current?"SUBSTITUIR":"NOMEAR"}</button></form></div></article>`;
    }).join("");
    const cabinetScore=Object.values(c.cabinet).length?Math.round(Object.values(c.cabinet).reduce((s,m)=>s+m.competence,0)/Object.values(c.cabinet).length):0;
    pageShell("GABINETE E MINISTÉRIOS.",official?"Você está no Executivo. Escolha ministros e acompanhe a capacidade de gestão da equipe.":"Monte seu núcleo de especialistas e prepare uma equipe para quando conquistar um cargo no Executivo.","cabinet","PALÁCIO DE GOVERNO · SALA DO CONSELHO",`
      <div class="career-summary-grid">${statCard("CARGO ATUAL",esc(c.office),"Situação na carreira")}${statCard("MINISTROS NOMEADOS",`${Object.keys(c.cabinet).length}/6`,"Equipe de políticas públicas")}${statCard("COMPETÊNCIA MÉDIA",`${cabinetScore}/100`,"Capacidade técnica da equipe")}</div>
      <div class="career-cabinet-grid">${cards}</div><div class="career-alert"><strong>${official?"RESPONSABILIDADE DO EXECUTIVO":"GABINETE SOMBRA"}</strong><p>${official?"A qualidade da equipe influencia a execução das políticas, a estabilidade do governo e os resultados de cada ministério.":"Enquanto estiver fora do Executivo, esta equipe funciona como conselho programático do partido. Ao conquistar o governo, os nomes escolhidos poderão assumir os ministérios."}</p></div>`);
    $$(".minister-form",main).forEach(form=>form.addEventListener("submit",event=>{event.preventDefault();const roleId=form.dataset.role;const role=MINISTER_ROLES.find(r=>r.id===roleId);const chosen=ministerCandidates(role.role).find(p=>p.name===form.querySelector("select").value);if(!chosen)return;c.cabinet[roleId]={...chosen};const skill=roleId==="economy"?"politicalKnowledge":roleId==="foreign"?"negotiation":roleId==="security"?"leadership":null;if(skill&&save.character)save.character[skill]=clamp((save.character[skill]||50)+1);pushNews(save,"GOVERNO",`${chosen.name} é escolhido para ${role.name}`,`A nomeação foi anunciada como parte da organização da equipe de políticas públicas.`);writeSave(save);renderGovernment();}));
  }

  function electionScore(save,office) {
    const c=ensure(save),ch=save.character||{};
    const personal=(save.approval||50)*0.34+(save.reputation||50)*0.20+(save.influence||0)*0.22+(ch.charisma||50)*0.08+(ch.negotiation||40)*0.06+(ch.politicalKnowledge||35)*0.05;
    return personal+c.campaignPoints*0.58+(c.congress.parties[0].deputies*0.12);
  }
  function electionChance(save,office) {
    const score=electionScore(save,office);return clamp(38+(score-office.threshold)*1.25,5,88);
  }
  function renderElections() {
    const save=getSave();if(!save)return;const c=ensure(save),selected=OFFICES.find(o=>o.id===c.candidateOffice),chance=selected?electionChance(save,selected):0;
    const cards=OFFICES.map(o=>`<button class="career-office-card ${c.candidateOffice===o.id?"selected":""}" data-office="${o.id}"><span>DISPUTA NACIONAL</span><strong>${o.name}</strong><small>${o.description}</small><em>EXIGÊNCIA DE CAMPANHA ${o.threshold} PTS</em></button>`).join("");
    const recent=c.electionHistory.slice(0,4).map(e=>`<div><b>${dateShort(e.date)}</b><span>${esc(e.office)} · ${esc(e.party||"")}</span><strong class="${e.won?"career-success":"career-danger"}">${e.won?"ELEITO":"NÃO ELEITO"} · ${e.share}%</strong></div>`).join("");
    pageShell("ELEIÇÕES E CAMPANHA.","Construa uma base eleitoral, escolha um cargo e enfrente a votação. Uma eleição acontece a cada quatro anos.","rally","CENTRO DE CAMPANHA · COMITÊ ELEITORAL",`
      <div class="career-election-banner"><div>${pixelPerson(0)}${pixelPerson(1)}${pixelPerson(2)}</div><div><span class="career-kicker">PRÓXIMA ELEIÇÃO GERAL</span><h2>${dateBR(c.electionDate)}</h2><p>${daysBetween(c.date,c.electionDate)>=0?`${daysBetween(c.date,c.electionDate)} dias até a votação.`:"A eleição já passou. O resultado será processado no próximo avanço do calendário."}</p></div></div>
      <div class="career-section-title"><h2>ESCOLHA SUA DISPUTA</h2><span>Cargo atual: ${esc(c.office)}</span></div><div class="career-office-grid">${cards}</div>
      <div class="career-campaign-control"><div><span class="career-kicker">SUA CAMPANHA</span><h2>${selected?`Candidatura: ${esc(selected.name)}`:"Nenhuma candidatura registrada"}</h2><p>${selected?`Chance estimada de vitória: ${fmt(chance,0)}%. A pesquisa muda com sua popularidade, reputação, influência e campanha.`:"Selecione um cargo acima para registrar uma candidatura."}</p><div class="career-meter"><div><span>FORÇA ELEITORAL</span><b>${fmt(selected?electionScore(save,selected):electionScore(save,OFFICES[0]),0)} pts</b></div><div class="career-meter-track"><i style="width:${clamp(selected?chance:0)}%"></i></div></div></div><div class="career-campaign-actions"><button class="career-primary-button" id="campaign-register" ${selected?"":"disabled"}>${selected?"REGISTRAR CANDIDATURA":"ESCOLHA UM CARGO"}</button><button class="career-secondary-button" id="campaign-visit" ${selected?"":"disabled"}>VISITAR REGIÕES · +3 PTS</button><button class="career-secondary-button" id="campaign-media" ${selected?"":"disabled"}>CAMPANHA DIGITAL · +4 PTS</button><button class="career-secondary-button" id="campaign-manifesto" ${selected?"":"disabled"}>APRESENTAR PROGRAMA · +3 PTS</button><button class="career-secondary-button" id="campaign-fund" ${selected?"":"disabled"}>ARRECADAR FUNDOS</button><button class="career-secondary-button" id="campaign-debate" ${selected?"":"disabled"}>PARTICIPAR DE DEBATE</button></div></div>
      <div class="career-section-title"><h2>PESQUISA ELEITORAL</h2><span>Estimativa ilustrativa</span></div><div class="career-poll-card"><div class="career-poll-main"><b>${selected?fmt(clamp(22+(electionScore(save,selected)-selected.threshold)*0.65,5,67),1):"—"}%</b><span>INTENÇÃO DE VOTO ESTIMADA</span></div><p>As pesquisas são calculadas pela força partidária, desempenho público e ações de campanha. Não representam uma previsão garantida.</p></div>
      <div class="career-section-title"><h2>RESULTADOS ANTERIORES</h2><span>Histórico da sua carreira</span></div><div class="career-report-list">${recent||'<div class="career-empty">Você ainda não disputou uma eleição nesta carreira.</div>'}</div>`);
    $$('[data-office]',main).forEach(button=>button.addEventListener("click",()=>{c.candidateOffice=button.dataset.office;c.candidacyRegistered=false;c.campaignPoints=0;writeSave(save);renderElections();}));
    $("#campaign-register")?.addEventListener("click",()=>{if(!c.candidateOffice)return;if(c.date>=c.electionDate){alert("O prazo desta eleição já terminou. Aguarde o próximo ciclo eleitoral.");return;}const of=OFFICES.find(o=>o.id===c.candidateOffice);if(of.id===c.officeId && c.reelections>=1){alert("A lei de Aurora permite apenas uma reeleição consecutiva para o mesmo cargo.");return;}c.candidacyRegistered=true;pushNews(save,"ELEIÇÕES",`Candidatura registrada: ${of.name}`,`${save.character.name} e o partido ${save.party.acronym} confirmaram a candidatura.`);writeSave(save);alert(`Candidatura a ${of.name} registrada! Continue a campanha até ${dateShort(c.electionDate)}.`);renderElections();});
    $("#campaign-visit")?.addEventListener("click",()=>campaignAction("visit"));
    $("#campaign-media")?.addEventListener("click",()=>campaignAction("media"));
    $("#campaign-manifesto")?.addEventListener("click",()=>campaignAction("manifesto"));
    $("#campaign-fund")?.addEventListener("click",()=>{c.campaignFund+=1.8;save.influence=clamp((save.influence||0)+1);save.reputation=clamp((save.reputation||50)-1);pushNews(save,"CAMPANHA","Nova arrecadação de campanha",`O partido ampliou seu fundo eleitoral com contribuições declaradas.`);writeSave(save);renderElections();});
    $("#campaign-debate")?.addEventListener("click",()=>homePath("debate"));
  }
  function campaignAction(kind) {
    const save=getSave();if(!save)return;const c=ensure(save);if(!c.candidateOffice){alert("Escolha primeiro o cargo que pretende disputar.");return;}
    const actions={visit:{cost:0.35,points:3,approval:1,rep:1,title:"Agenda de visitas regionais"},media:{cost:0.55,points:4,approval:2,rep:0,title:"Campanha de comunicação"},manifesto:{cost:0.2,points:3,approval:0,rep:3,title:"Programa de governo apresentado"}};
    const a=actions[kind];if(c.campaignFund<a.cost){alert("Fundo de campanha insuficiente. Negocie apoio e organize novas arrecadações.");return;}c.campaignFund-=a.cost;c.campaignPoints+=a.points;save.approval=clamp((save.approval||50)+a.approval);save.reputation=clamp((save.reputation||50)+a.rep);pushNews(save,"CAMPANHA",a.title,`A ação eleitoral aumentou a força de campanha em ${a.points} pontos.`);writeSave(save);renderElections();
  }
  function resolveElection(save) {
    const c=save.career;const office=OFFICES.find(o=>o.id===c.candidateOffice);
    if(!office || !c.candidacyRegistered){if(c.termEnd && c.termEnd<=c.date){c.office="Liderança partidária";c.officeId=null;c.termStart=null;c.termEnd=null;c.reelections=0;}pushNews(save,"ELEIÇÕES","Aurora escolhe seus representantes",`O calendário eleitoral avançou, mas seu partido não registrou candidatura para esta disputa.`);c.electionHistory.unshift({date:c.date,office:"Sem candidatura",party:save.party?.acronym||"",won:false,share:0,resultText:"Seu partido não participou da disputa desta eleição."});}
    else {
      const chance=electionChance(save,office);const roll=Math.random()*100;const won=roll<=chance;const share=Math.round(clamp(22+(electionScore(save,office)-office.threshold)*0.65+(Math.random()*8-4),5,68));
      if(won){const sameOffice=c.officeId===office.id;c.office=office.name;c.officeId=office.id;c.termStart=c.date;c.termEnd=addYears(c.date,4);c.reelections=sameOffice?c.reelections+1:0;c.stability=clamp(c.stability+8);save.approval=clamp((save.approval||50)+5);pushNews(save,"ELEIÇÕES",`${save.character.name} é eleito(a) ${office.name}`,`Com ${share}% dos votos estimados, seu partido conquista uma vitória eleitoral. O mandato terá início em ${dateShort(c.date)}.`);}
      else {if(c.termEnd && c.termEnd<=c.date){c.office="Liderança partidária";c.officeId=null;c.termStart=null;c.termEnd=null;c.reelections=0;}save.approval=clamp((save.approval||50)-2);pushNews(save,"ELEIÇÕES",`Derrota eleitoral de ${save.character.name}`,`A candidatura terminou com ${share}% dos votos estimados. O partido inicia uma fase de reorganização.`);}
      const text=won?`Vitória: ${save.character.name} foi eleito(a) ${office.name} com ${share}% dos votos estimados.`:`Derrota: a candidatura a ${office.name} terminou com ${share}% dos votos estimados.`;
      c.electionHistory.unshift({date:c.date,office:office.name,party:save.party?.acronym||"",won,share,resultText:text});
    }
    c.electionHistory=c.electionHistory.slice(0,12);c.candidateOffice=null;c.candidacyRegistered=false;c.campaignPoints=0;c.campaignFund=Math.max(c.campaignFund,2.5);c.electionDate=addYears(c.electionDate,4);c.congress=makeCongress(save);
  }

  function renderPress() {
    const save=getSave();if(!save)return;const c=ensure(save);
    const news=c.news.slice(0,12).map(n=>`<article class="career-news-card"><span>${esc(n.category)} · ${dateShort(n.date)}</span><strong>${esc(n.title)}</strong><p>${esc(n.text)}</p></article>`).join("");
    pageShell("IMPRENSA E OPINIÃO PÚBLICA.","Aurora acompanha cada decisão. A imprensa pode ampliar sua reputação ou transformar uma resposta ruim em crise política.","newsroom","TV AURORA · REDAÇÃO NACIONAL",`
      <div class="career-press-stage"><div>${pixelPerson(1)}${pixelPerson(2)}</div><div><span class="career-kicker">COLETIVA DE IMPRENSA</span><h2>OS JORNALISTAS PEDIRAM UMA ENTREVISTA.</h2><p>Escolha sua estratégia de comunicação. A reação depende da coerência, da popularidade e da situação econômica.</p></div></div>
      <div class="career-choice-grid"><button class="career-choice" data-press="0"><span>ESTRATÉGIA A</span><strong>Responder com dados e admitir desafios</strong><small>Fortalece a imagem de transparência e competência.</small></button><button class="career-choice" data-press="1"><span>ESTRATÉGIA B</span><strong>Apresentar uma visão positiva para Aurora</strong><small>Valoriza sua mensagem, mas pode soar genérica.</small></button><button class="career-choice" data-press="2"><span>ESTRATÉGIA C</span><strong>Confrontar a pergunta e criticar a cobertura</strong><small>Mobiliza apoiadores, mas aumenta o desgaste.</small></button></div>
      <div class="career-section-title"><h2>ÚLTIMAS NOTÍCIAS</h2><span>Atualizadas durante o calendário</span></div><div class="career-news-list">${news||'<div class="career-empty">Ainda não há notícias.</div>'}</div>`);
    $$('[data-press]',main).forEach(btn=>btn.addEventListener("click",()=>{
      const options=[{approval:2,reputation:4,influence:1,title:"Entrevista marcada pela transparência",text:"Jornalistas destacaram o compromisso com dados e metas verificáveis."},{approval:3,reputation:0,influence:2,title:"Discurso otimista repercute",text:"A mensagem foi bem recebida por apoiadores, embora especialistas cobrem detalhes."},{approval:1,reputation:-4,influence:1,title:"Confronto com a imprensa gera críticas",text:"Parte do público apoiou o tom firme, mas entidades cobraram respostas objetivas."}];
      const o=options[Number(btn.dataset.press)];save.approval=clamp((save.approval||50)+o.approval);save.reputation=clamp((save.reputation||50)+o.reputation);save.influence=clamp((save.influence||0)+o.influence);pushNews(save,"IMPRENSA",o.title,o.text);writeSave(save);renderPress();
    }));
  }

  function renderCrises() {
    const save=getSave();if(!save)return;const c=ensure(save);
    const pending=c.agenda.filter(a=>a.status==="pending");const crisis=c.crises.filter(x=>x.status==="open");
    const crisisHTML=crisis.map(cr=>`<article class="career-crisis-card"><div class="crisis-top"><span>${esc(cr.category)} · ${dateShort(cr.date)}</span><b>URGENTE</b></div><h3>${esc(cr.title)}</h3><p>${esc(cr.text)}</p><div class="career-choice-grid">${cr.options.map((o,i)=>`<button class="career-choice" data-crisis="${esc(cr.id)}" data-option="${i}"><span>RESPOSTA ${String.fromCharCode(65+i)}</span><strong>${esc(o.title)}</strong><small>${esc(o.detail)}</small></button>`).join("")}</div></article>`).join("");
    pageShell("AGENDA, PROTESTOS E CRISES.","Problemas sociais, greves e emergências aparecem conforme os indicadores do país. Não existe resposta sem custo.","rally","CENTRO DE OPERAÇÕES · GESTÃO DE CRISE",`
      <div class="career-summary-grid">${statCard("COMPROMISSOS PENDENTES",pending.length,"Agenda que já chegou",pending.length?"red":"gold")}${statCard("CRISES ATIVAS",crisis.length,"Exigem uma decisão",crisis.length?"red":"green")}${statCard("ESTABILIDADE",`${Math.round(c.stability)}/100`,"Confiança nas instituições")}</div>
      <div class="career-section-title"><h2>COMPROMISSOS AGUARDANDO</h2><span>Atenda ou deixe para depois</span></div><div class="career-agenda-list">${pending.map(agendaCard).join("")||'<div class="career-empty">Nenhum compromisso pendente.</div>'}</div>
      <div class="career-section-title"><h2>CRISES EM ANDAMENTO</h2><span>Três alternativas por decisão</span></div><div class="career-crisis-list">${crisisHTML||'<div class="career-empty">Nenhuma crise ativa neste momento. A situação do país pode mudar quando o calendário avançar.</div>'}</div>`);
    $$('[data-attend]',main).forEach(btn=>btn.addEventListener("click",()=>attendAgenda(btn.dataset.attend)));
    $$('[data-crisis]',main).forEach(btn=>btn.addEventListener("click",()=>resolveCrisis(btn.dataset.crisis,Number(btn.dataset.option))));
  }
  function resolveCrisis(id,index) {
    const save=getSave();if(!save)return;const c=ensure(save),cr=c.crises.find(x=>x.id===id&&x.status==="open");if(!cr)return;const option=cr.options[index];if(!option)return;applyEffects(save,option.effects);cr.status="resolved";cr.resolvedDate=c.date;c.resolvedCrises.push(cr.templateId+":"+c.date.slice(0,7));c.stability=clamp(c.stability+(option.effects.socialTension<0?3:-1));pushNews(save,"CRISE",`${cr.title}: governo anuncia resposta`,option.title);writeSave(save);renderCrises();
  }

  function renderRegions() {
    const save=getSave();if(!save)return;const c=ensure(save);
    const cards=REGION_LIST.map((r,i)=>{
      const state=save.regions?.[r[0]]?.stats||{};const avg=Math.round([state.economy??58,state.infrastructure??58,state.health??58,state.education??58,state.security??58].reduce((a,b)=>a+b,0)/5);
      return `<article class="career-region-card"><div class="region-pixel-art">${pixelPerson(i%4)}</div><div><span class="career-kicker">REGIÃO ${String(i+1).padStart(2,"0")}</span><strong>${esc(r[1])}</strong><small>Capital: ${esc(r[2])}</small><p>${esc(r[3])}</p>${meter("DESENVOLVIMENTO",avg)}<button class="career-small-button" data-visit-region="${r[0]}">VISITAR REGIÃO</button></div></article>`;
    }).join("");
    pageShell("AS DEZ REGIÕES DE AURORA.","Cada região tem população, desafios e prioridades próprias. Uma política nacional precisa considerar diferenças locais.","capital","MAPA POLÍTICO · DIVISÃO REGIONAL",`
      <div class="career-summary-grid">${statCard("REGIÕES", "10", "Divisão administrativa")}${statCard("VISITAS REALIZADAS",Object.values(c.regionVisits).reduce((a,b)=>a+b,0),"Agenda da carreira")}${statCard("APROVAÇÃO NACIONAL",`${Math.round(save.approval||50)}%`,"Média estimada")}</div>
      <div class="career-region-grid">${cards}</div><div class="career-alert"><strong>MAPA REGIONAL DETALHADO</strong><p>O mapa interativo original continua disponível com seleção de região e decisões locais.</p><button class="career-primary-button" id="career-open-original-map">ABRIR MAPA INTERATIVO →</button></div>`);
    $("#career-open-original-map")?.addEventListener("click",()=>homePath("regions"));
    $$('[data-visit-region]',main).forEach(btn=>btn.addEventListener("click",()=>{
      const id=btn.dataset.visitRegion; c.regionVisits[id]=(c.regionVisits[id]||0)+1;
      save.approval=clamp((save.approval||50)+1); save.influence=clamp((save.influence||0)+2);
      if(!save.regions)save.regions={}; if(!save.regions[id])save.regions[id]={stats:{economy:58,infrastructure:58,health:58,education:58,security:58},news:[]};
      save.regions[id].stats.infrastructure=clamp((save.regions[id].stats.infrastructure||58)+2);
      pushNews(save,"REGIÕES",`Visita política à região ${REGION_LIST.find(r=>r[0]===id)?.[1]||id}`,"A visita reforçou o contato com lideranças e moradores locais.");writeSave(save);renderRegions();
    }));
  }

  function renderDiplomacy() {
    const save=getSave();if(!save)return;const c=ensure(save);
    const cards=c.countries.map(country=>`<article class="career-country-card"><div class="country-flag" style="--country:${country.color}">${esc(country.flag)}</div><div class="country-main"><span class="career-kicker">RELAÇÃO BILATERAL</span><strong>${esc(country.name)}</strong><small>Interesse: ${esc(country.focus)}</small>${meter("RELAÇÃO DIPLOMÁTICA",country.relation)}</div><div class="country-actions"><button class="career-small-button" data-diplomacy="${country.id}" data-action="trade">ACORDO COMERCIAL</button><button class="career-small-button" data-diplomacy="${country.id}" data-action="research">COOPERAÇÃO TÉCNICA</button><button class="career-small-button" data-diplomacy="${country.id}" data-action="climate">PACTO AMBIENTAL</button></div></article>`).join("");
    pageShell("RELAÇÕES INTERNACIONAIS.","Aurora não está isolada. Acordos comerciais, cooperação científica e diplomacia ambiental podem gerar oportunidades e riscos.","congress","PALÁCIO DAS RELAÇÕES EXTERIORES",`
      <div class="career-summary-grid">${statCard("PAÍSES PARCEIROS",c.countries.length,"Relações acompanhadas")}${statCard("CRESCIMENTO DO PIB",`${fmt(c.economy.growth)}%`,"Indicador anual")}${statCard("TESOURO",moneyUA(c.treasury),"Recursos públicos")}</div>
      <div class="career-country-grid">${cards}</div><div class="career-muted">A diplomacia depende de confiança, capacidade de negociação e estabilidade interna. Acordos podem produzir resultados ao longo de vários meses.</div>`);
    $$('[data-diplomacy]',main).forEach(btn=>btn.addEventListener("click",()=>diplomacyAction(btn.dataset.diplomacy,btn.dataset.action)));
  }
  function diplomacyAction(countryId,action) {
    const save=getSave();if(!save)return;const c=ensure(save),country=c.countries.find(x=>x.id===countryId);if(!country)return;
    const options={trade:{cost:1.8,relation:8,growth:0.3,approval:1,title:"Acordo de facilitação comercial"},research:{cost:1.1,relation:6,growth:0.15,reputation:2,title:"Programa de cooperação científica"},climate:{cost:1.4,relation:9,approval:1,reputation:2,title:"Pacto de proteção ambiental"}};
    const o=options[action];if(c.treasury<o.cost){alert("O Tesouro não possui recursos suficientes para esse acordo.");return;}c.treasury-=o.cost;country.relation=clamp(country.relation+o.relation);applyEffects(save,{growth:o.growth||0,approval:o.approval||0,reputation:o.reputation||0});pushNews(save,"DIPLOMACIA",`${o.title} com ${country.name}`,`A relação bilateral subiu para ${country.relation}/100. O acordo terá efeitos graduais.`);writeSave(save);renderDiplomacy();
  }

  function openPage(page) {
    const save=getSave();if(!save?.character||!save?.party){alert("Inicie uma carreira e funde um partido primeiro.");return;}ensure(save);writeSave(save);
    calendarViewDate=null;
    const pages={calendar:renderCalendar,economy:renderEconomy,congress:renderCongress,government:renderGovernment,elections:renderElections,press:renderPress,crises:renderCrises,regions:renderRegions,diplomacy:renderDiplomacy,justice:renderJustice};
    if(pages[page]) pages[page]();
  }
  function bindPageNavigation() {
    $$('[data-open]',main).forEach(btn=>btn.addEventListener("click",()=>{const v=btn.dataset.open;if(v==="home")goHome();else openPage(v);}));
  }

  function startup() {
    const save=getSave();if(save?.character){ensure(save);writeSave(save);}
    const observer=new MutationObserver(()=>installDashboard());
    observer.observe(main,{childList:true,subtree:true});
    installDashboard();
    if(sessionStorage.getItem(RESUME_KEY)==="1") {
      sessionStorage.removeItem(RESUME_KEY);
      window.setTimeout(()=>$("#continue-game")?.click(),120);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",startup,{once:true});
  else startup();
})();
