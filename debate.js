/* PODER — módulo independente da Arena de Debate.
   Lê e atualiza o mesmo salvamento local usado pelo jogo principal. */
(() => {
    "use strict";

    const SAVE_KEY = "poder_save";
    const RESUME_KEY = "poder_resume_after_debate";
    const main = document.querySelector(".main-content");
    if (!main) return;

    const opponent = {
        name: "DANIEL VASQUES",
        party: "Aliança pelo Progresso",
        charisma: 63,
        politicalKnowledge: 69,
        negotiation: 61,
        leadership: 58
    };

    const rounds = [
        {
            theme: "ECONOMIA E EMPREGO",
            question: "Seu plano promete gerar empregos, mas Aurora enfrenta dívida crescente. Como pretende estimular a economia sem comprometer as contas públicas?",
            options: [
                { title: "Apresentar metas e fontes de financiamento", detail: "Explicar prioridades, prazos e como cada medida será paga.", style: "PROPOSTA TÉCNICA", skill: "politicalKnowledge", base: 5, good: "O plano tem metas e uma fonte de financiamento. É uma resposta mais concreta do que um slogan.", mid: "O senhor apresentou uma direção, mas ainda precisará provar que as contas fecham.", bad: "O senhor citou planejamento, mas não explicou os números. A pergunta continua sem resposta." },
                { title: "Priorizar empregos e diálogo com empresas", detail: "Defender qualificação profissional e investimento produtivo com contrapartidas.", style: "NEGOCIAÇÃO", skill: "negotiation", base: 4, good: "O diálogo com o setor produtivo pode ajudar, desde que existam contrapartidas claras.", mid: "A proposta pode gerar oportunidades, mas faltou detalhar como evitar privilégios.", bad: "O senhor fala em parceria, mas não apresentou garantias de que os empregos serão mantidos." },
                { title: "Atacar o histórico econômico do adversário", detail: "Questionar os resultados da oposição e mudar o foco da pergunta.", style: "CONFRONTO", skill: "charisma", base: 1, good: "O ataque chamou atenção, mas não substituiu uma resposta sobre o seu plano.", mid: "O senhor desviou do tema. O eleitor quer saber o que fará daqui para frente.", bad: "O senhor evitou a pergunta e ainda não explicou como pretende financiar as promessas." }
            ]
        },
        {
            theme: "SAÚDE PÚBLICA",
            question: "Hospitais de Aurora enfrentam filas e falta de especialistas. Qual é sua prioridade para melhorar o atendimento sem desperdiçar dinheiro público?",
            options: [
                { title: "Reforçar a atenção básica e as equipes locais", detail: "Ampliar prevenção, equipes de saúde da família e atendimento regional.", style: "GESTÃO PÚBLICA", skill: "leadership", base: 5, good: "Fortalecer a atenção básica pode reduzir a pressão sobre os hospitais. É uma prioridade coerente.", mid: "A medida tem lógica, mas o senhor ainda precisa mostrar como acompanhará os resultados.", bad: "A proposta parece genérica. Faltou explicar como chegará aos municípios com maior carência." },
                { title: "Publicar metas e indicadores de atendimento", detail: "Medir filas, tempo de espera e execução do orçamento com transparência.", style: "TRANSPARÊNCIA", skill: "politicalKnowledge", base: 4, good: "Metas públicas facilitam a fiscalização e ajudam a identificar onde o sistema falha.", mid: "Transparência é importante, mas os indicadores precisam vir acompanhados de ação.", bad: "O senhor quer medir o problema, mas não explicou como pretende resolvê-lo." },
                { title: "Prometer resolver todas as filas rapidamente", detail: "Assumir um compromisso amplo sem apresentar cronograma ou orçamento.", style: "PROMESSA ARRISCADA", skill: "charisma", base: -2, good: "A promessa é ambiciosa, mas a população vai cobrar prazo e recursos.", mid: "O senhor não apresentou um cronograma realista para cumprir essa promessa.", bad: "Prometer resolver tudo sem explicar como pode aumentar a desconfiança." }
            ]
        },
        {
            theme: "SEGURANÇA",
            question: "A população cobra segurança, mas especialistas alertam que medidas apenas repressivas não resolvem as causas da violência. Qual será seu caminho?",
            options: [
                { title: "Integrar prevenção, investigação e policiamento", detail: "Combinar presença policial, inteligência, iluminação e políticas para jovens.", style: "PLANO INTEGRADO", skill: "politicalKnowledge", base: 5, good: "A proposta combina ações de curto e longo prazo. Segurança exige coordenação.", mid: "O plano é equilibrado, mas depende de integração entre diferentes órgãos.", bad: "O senhor citou várias frentes, mas não explicou como serão coordenadas." },
                { title: "Ouvir comunidades e profissionais da segurança", detail: "Criar metas com participação local e avaliação dos resultados.", style: "DIÁLOGO E LIDERANÇA", skill: "leadership", base: 4, good: "A participação local pode ajudar a identificar prioridades e aumentar a confiança.", mid: "Ouvir é importante, mas o senhor precisa transformar isso em medidas concretas.", bad: "O diálogo, sozinho, não responde à urgência de quem sofre com a violência." },
                { title: "Defender medidas mais duras sem detalhar execução", detail: "Adotar discurso de tolerância zero e evitar explicar os limites da proposta.", style: "DISCURSO DURO", skill: "charisma", base: 0, good: "A firmeza agrada a parte do público, mas ainda faltam detalhes de execução.", mid: "O discurso é forte, mas não explica como reduzir a violência de forma sustentável.", bad: "O senhor ofereceu palavras de ordem, não um plano de segurança." }
            ]
        },
        {
            theme: "EDUCAÇÃO",
            question: "Aurora tem diferenças grandes entre escolas urbanas e rurais. Como pretende melhorar a aprendizagem sem anunciar gastos impossíveis?",
            options: [
                { title: "Priorizar alfabetização, formação e acompanhamento", detail: "Definir metas de aprendizagem e apoiar professores com formação contínua.", style: "POLÍTICA EDUCACIONAL", skill: "politicalKnowledge", base: 5, good: "Metas de aprendizagem e apoio aos professores dão um caminho verificável.", mid: "A proposta é consistente, mas precisa considerar as diferenças entre as regiões.", bad: "O senhor falou de metas, mas não explicou como atenderá as escolas mais isoladas." },
                { title: "Construir um pacto com municípios e famílias", detail: "Coordenar transporte escolar, frequência e busca ativa de estudantes.", style: "ARTICULAÇÃO", skill: "negotiation", base: 4, good: "A cooperação entre governos e famílias pode enfrentar causas diferentes da evasão.", mid: "O pacto é promissor, mas depende de responsabilidades bem definidas.", bad: "O senhor não explicou como evitar que o pacto fique apenas no papel." },
                { title: "Anunciar uma grande reforma para todas as escolas", detail: "Prometer mudanças imediatas sem priorizar as unidades mais vulneráveis.", style: "PROMESSA AMPLA", skill: "charisma", base: -1, good: "A ambição é positiva, mas será necessário apresentar etapas e custos.", mid: "O plano não define prioridades nem como será financiado.", bad: "O senhor anunciou uma reforma sem dizer por onde começará." }
            ]
        },
        {
            theme: "TRANSPARÊNCIA E CORRUPÇÃO",
            question: "O senhor promete um governo diferente. Que mecanismo concreto impediria contratos públicos de favorecer aliados políticos?",
            options: [
                { title: "Abrir contratos, dados e auditorias ao público", detail: "Publicar contratos, aditivos, licitações e relatórios em formato acessível.", style: "CONTROLE E TRANSPARÊNCIA", skill: "politicalKnowledge", base: 5, good: "Dados abertos e auditorias independentes permitem fiscalização real.", mid: "A transparência é essencial, mas precisa de fiscalização e consequências.", bad: "Publicar dados não basta se ninguém fiscalizar os contratos." },
                { title: "Fortalecer órgãos de controle e proteção a denunciantes", detail: "Garantir autonomia técnica, canais seguros e apuração imparcial.", style: "INSTITUIÇÕES", skill: "leadership", base: 5, good: "Instituições independentes reduzem a chance de interferência política.", mid: "A proposta é importante, mas será preciso garantir autonomia na prática.", bad: "O senhor não explicou como protegerá a independência dos órgãos de controle." },
                { title: "Dizer que pessoas honestas não têm nada a temer", detail: "Responder com uma frase de efeito, sem apresentar mecanismos de controle.", style: "RESPOSTA VAGA", skill: "charisma", base: -2, good: "A frase é forte, mas o eleitor espera garantias institucionais.", mid: "O senhor não apresentou nenhum mecanismo concreto de fiscalização.", bad: "A resposta não esclarece como evitar favorecimento em contratos públicos." }
            ]
        }
    ];

    // Depois de responder à oposição, o jogador também escolhe uma pergunta.
    // A habilidade do candidato e a capacidade do adversário de se defender
    // determinam se a resposta dele será convincente, parcial ou evasiva.
    const playerQuestions = [
        [
            { title: "Qual é a fonte dos recursos para financiar seu plano de empregos?", detail: "Cobrar números, orçamento e prioridades.", style: "PERGUNTA TÉCNICA", skill: "politicalKnowledge", opponentSkill: "politicalKnowledge", base: 5, cornered: "Nossa equipe ainda está finalizando as projeções. Não vou inventar números antes de concluir os estudos.", partial: "Pretendemos rever despesas e estimular investimentos, mas os valores detalhados serão apresentados no plano econômico.", strong: "O financiamento virá de uma combinação de revisão de gastos, investimento privado e metas fiscais. O plano completo será divulgado com estimativas e prazos." },
            { title: "Qual medida concreta o senhor adotaria nos primeiros cem dias?", detail: "Exigir prioridade e cronograma de execução.", style: "COBRANÇA DE PRAZO", skill: "leadership", opponentSkill: "leadership", base: 4, cornered: "Ainda não quero antecipar uma medida sem avaliar a situação encontrada.", partial: "Vamos começar por um pacote de incentivo à contratação e por uma revisão dos programas existentes.", strong: "Nos primeiros cem dias, enviaremos um programa de qualificação e incentivo à contratação, com metas trimestrais e avaliação pública." },
            { title: "Como evitar que os incentivos às empresas virem benefícios para poucos grupos?", detail: "Questionar critérios, transparência e contrapartidas.", style: "FISCALIZAÇÃO", skill: "negotiation", opponentSkill: "negotiation", base: 4, cornered: "É uma preocupação legítima. Precisaremos construir critérios com os setores envolvidos.", partial: "Os incentivos terão regras e contrapartidas, mas os detalhes ainda serão discutidos.", strong: "Os benefícios terão prazo, metas de emprego, divulgação dos beneficiários e devolução dos recursos em caso de descumprimento." }
        ],
        [
            { title: "Como reduzir as filas sem apresentar um orçamento irrealista?", detail: "Cobrar planejamento financeiro e metas de atendimento.", style: "PERGUNTA TÉCNICA", skill: "politicalKnowledge", opponentSkill: "politicalKnowledge", base: 5, cornered: "Precisamos primeiro mapear as filas e a capacidade de cada região antes de estimar o custo.", partial: "A prioridade será reorganizar o atendimento e contratar serviços onde houver maior urgência.", strong: "Vamos publicar o custo por etapa, priorizar regiões com maior espera e medir consultas realizadas e tempo médio de atendimento." },
            { title: "O que o governo fará para levar especialistas ao interior?", detail: "Trazer o debate para a desigualdade regional.", style: "FOCO REGIONAL", skill: "leadership", opponentSkill: "leadership", base: 4, cornered: "Esse é um desafio complexo e dependerá de negociação com municípios e profissionais.", partial: "Podemos ampliar incentivos para fixação de profissionais em áreas menos atendidas.", strong: "A proposta inclui incentivos de permanência, telemedicina e consórcios regionais para garantir atendimento especializado." },
            { title: "Como a população vai fiscalizar se as metas de saúde foram cumpridas?", detail: "Exigir transparência e prestação de contas.", style: "TRANSPARÊNCIA", skill: "negotiation", opponentSkill: "negotiation", base: 4, cornered: "Teremos de definir indicadores que sejam compreensíveis e comparáveis entre regiões.", partial: "Pretendemos divulgar relatórios periódicos, embora ainda falte definir o formato.", strong: "Os indicadores serão públicos, atualizados periodicamente e acompanhados por conselhos de saúde e órgãos de controle." }
        ],
        [
            { title: "Quais indicadores provarão que a violência realmente diminuiu?", detail: "Cobrar dados além de discursos e operações pontuais.", style: "DADOS E RESULTADOS", skill: "politicalKnowledge", opponentSkill: "politicalKnowledge", base: 5, cornered: "A segurança não pode ser medida por um único indicador. Vamos precisar consolidar dados.", partial: "Acompanharemos ocorrências e crimes violentos, mas também a percepção de segurança.", strong: "Vamos divulgar séries de crimes violentos, elucidação de homicídios e tempo de resposta, separados por região." },
            { title: "Como impedir abusos e garantir que a política respeite a lei?", detail: "Pressionar por controle e responsabilidade institucional.", style: "DIREITOS E CONTROLE", skill: "negotiation", opponentSkill: "negotiation", base: 4, cornered: "A fiscalização precisa ser independente, mas ainda precisamos definir o modelo de acompanhamento.", partial: "Defendemos treinamento e protocolos, com investigação de denúncias quando necessário.", strong: "A política terá protocolos públicos, câmeras quando adequadas, corregedorias atuantes e investigação independente de abusos." },
            { title: "Que prevenção será oferecida aos jovens antes que a violência aconteça?", detail: "Cobrar ações de longo prazo e presença do Estado.", style: "PREVENÇÃO", skill: "leadership", opponentSkill: "leadership", base: 4, cornered: "Esse eixo precisa de coordenação com escolas, municípios e organizações locais.", partial: "Pretendemos ampliar atividades esportivas e oportunidades de formação profissional.", strong: "Vamos integrar escola em tempo ampliado, formação profissional, esporte e acompanhamento de jovens em áreas prioritárias." }
        ],
        [
            { title: "Como o senhor vai medir se os alunos estão aprendendo mais?", detail: "Exigir metas de aprendizagem verificáveis.", style: "AVALIAÇÃO", skill: "politicalKnowledge", opponentSkill: "politicalKnowledge", base: 5, cornered: "Os indicadores precisam considerar as diferenças entre escolas, e ainda estamos definindo as metas.", partial: "Vamos utilizar avaliações periódicas e acompanhar a evolução dos alunos.", strong: "As metas serão públicas, com avaliações periódicas, apoio às escolas com maior dificuldade e divulgação dos resultados por região." },
            { title: "Como garantir que escolas rurais não fiquem para trás?", detail: "Questionar a execução fora dos grandes centros.", style: "EQUIDADE REGIONAL", skill: "leadership", opponentSkill: "leadership", base: 4, cornered: "A logística do interior exige um plano específico que ainda precisa ser detalhado.", partial: "Vamos priorizar transporte escolar e conectividade nas localidades mais isoladas.", strong: "Haverá um mapa de carências, metas de transporte e conectividade e equipes de apoio pedagógico para escolas rurais." },
            { title: "Quanto será investido na formação e valorização dos professores?", detail: "Cobrar compromisso com quem executa a política educacional.", style: "VALORIZAÇÃO", skill: "negotiation", opponentSkill: "negotiation", base: 4, cornered: "Não vou anunciar um valor antes de negociar com os profissionais e avaliar o orçamento.", partial: "A formação continuada será prioridade, dentro do espaço fiscal disponível.", strong: "O plano terá calendário de formação, critérios de progressão e previsão orçamentária negociada com os profissionais." }
        ],
        [
            { title: "Quem vai fiscalizar os contratos e garantir auditorias independentes?", detail: "Cobrar controles que não dependam do próprio governante.", style: "INDEPENDÊNCIA", skill: "politicalKnowledge", opponentSkill: "politicalKnowledge", base: 5, cornered: "Precisamos definir garantias para que a fiscalização não seja apenas formal.", partial: "Os órgãos de controle terão acesso aos dados e poderão solicitar auditorias.", strong: "Auditorias independentes, dados abertos e autonomia dos órgãos de controle serão previstos desde o início." },
            { title: "O senhor publicaria os beneficiários finais das empresas contratadas?", detail: "Ir além do nome da empresa e revelar quem se beneficia.", style: "TRANSPARÊNCIA", skill: "negotiation", opponentSkill: "negotiation", base: 4, cornered: "A proposta é válida, mas teremos de observar a legislação e a proteção de dados.", partial: "Defendemos transparência dos contratos e identificação dos responsáveis, respeitando a lei.", strong: "Sim. Sempre que a legislação permitir, os dados dos beneficiários finais serão publicados para impedir empresas de fachada." },
            { title: "O senhor investigaria um aliado político se surgissem provas?", detail: "Testar coerência entre discurso e prática.", style: "INTEGRIDADE", skill: "charisma", opponentSkill: "charisma", base: 4, cornered: "Não vou julgar ninguém antecipadamente, mas nenhuma pessoa deve estar acima da lei.", partial: "As denúncias devem ser apuradas pelos órgãos competentes, sem interferência do governo.", strong: "Sim. A investigação deve seguir provas e procedimentos legais, independentemente de partido ou proximidade política." }
        ]
    ];

    let debate = null;

    function readSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error("Não foi possível ler o salvamento do PODER:", error);
            return null;
        }
    }

    function writeSave(save) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(save));
            return true;
        } catch (error) {
            console.error("Não foi possível salvar o debate:", error);
            alert("Não foi possível salvar o resultado do debate. Verifique o armazenamento do navegador.");
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[char]);
    }

    function clamp(value, min = 0, max = 100) {
        const number = Number(value);
        return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min));
    }

    function getPlayerName(save) {
        return escapeHTML(save.character?.name || "CANDIDATO");
    }

    function pixelSprite(variant) {
        const isPlayer = variant === "player";
        const hair = isPlayer ? "#30251f" : "#b7b9bd";
        const skin = isPlayer ? "#d9a77e" : "#c98f6b";
        const suit = isPlayer ? "#1c4770" : "#572f39";
        const tie = isPlayer ? "#d9b66c" : "#d7dce5";
        const hairTop = isPlayer
            ? '<rect x="5" y="2" width="7" height="2" fill="#30251f"/><rect x="4" y="4" width="2" height="2" fill="#30251f"/><rect x="11" y="4" width="2" height="2" fill="#30251f"/>'
            : '<rect x="4" y="2" width="9" height="2" fill="#b7b9bd"/><rect x="4" y="4" width="2" height="2" fill="#b7b9bd"/><rect x="11" y="4" width="2" height="2" fill="#b7b9bd"/>';
        return `<svg class="pixel-person" viewBox="0 0 16 24" aria-hidden="true" shape-rendering="crispEdges">
            <rect x="6" y="1" width="5" height="2" fill="${hair}"/>${hairTop}
            <rect x="5" y="5" width="7" height="6" fill="${skin}"/><rect x="4" y="7" width="1" height="2" fill="${skin}"/><rect x="12" y="7" width="1" height="2" fill="${skin}"/>
            <rect x="6" y="7" width="1" height="1" fill="#29252a"/><rect x="10" y="7" width="1" height="1" fill="#29252a"/><rect x="7" y="10" width="3" height="1" fill="#7d4039"/>
            <rect x="7" y="11" width="3" height="2" fill="#e5bd98"/>
            <rect x="4" y="13" width="9" height="7" fill="${suit}"/><rect x="7" y="13" width="3" height="6" fill="#f0eee9"/>
            <rect x="8" y="13" width="1" height="5" fill="${tie}"/><rect x="3" y="14" width="2" height="5" fill="${suit}"/><rect x="12" y="14" width="2" height="5" fill="${suit}"/>
            <rect x="5" y="20" width="3" height="3" fill="#202633"/><rect x="10" y="20" width="3" height="3" fill="#202633"/>
            <rect x="4" y="22" width="4" height="1" fill="#111722"/><rect x="10" y="22" width="4" height="1" fill="#111722"/>
        </svg>`;
    }

    function getStat(save, key) {
        const value = Number(save.character?.[key] ?? 50);
        return clamp(value, 0, 100);
    }

    function startDebate() {
        const save = readSave();
        if (!save?.character || !save?.party) {
            alert("Crie seu personagem e funde seu partido antes de participar de um debate.");
            return;
        }
        debate = {
            roundIndex: 0,
            totalScore: 0,
            answerScores: [],
            questionScores: [],
            phase: "opponentQuestion",
            lastAnswer: null,
            lastQuestion: null
        };
        renderRound();
    }

    function renderShell({ roundIndex, speaker, dialogue, phase, playerName, partyName, showChoices = false, feedbackHTML = "", buttonId = "", buttonLabel = "" }) {
        const progress = rounds.map((_, index) => {
            const done = index < roundIndex || (index === roundIndex && phase === "opponentAnswer");
            return `<span class="${done ? "done" : index === roundIndex ? "current" : ""}"></span>`;
        }).join("");
        const isPlayerSpeaking = speaker === "player";
        const current = rounds[Math.min(roundIndex, rounds.length - 1)];
        const phaseTitle = phase === "opponentQuestion" ? "PERGUNTA DA OPOSIÇÃO"
            : phase === "opponentReply" ? "RÉPLICA DA OPOSIÇÃO"
            : phase === "playerQuestion" ? "SUA PERGUNTA"
            : "RESPOSTA DO ADVERSÁRIO";
        const choiceTitle = phase === "opponentQuestion" ? "ESCOLHA SUA RESPOSTA"
            : phase === "playerQuestion" ? "ESCOLHA O QUE VAI PERGUNTAR"
            : phase === "opponentReply" ? "AGORA É SUA VEZ DE QUESTIONAR"
            : "ANÁLISE DA TROCA";

        main.innerHTML = `
            <section class="debate-screen">
                <header class="debate-head">
                    <div>
                        <span class="debate-kicker">REPÚBLICA DE AURORA · TRANSMISSÃO NACIONAL</span>
                        <h1>ARENA DE <span>DEBATE.</span></h1>
                        <p class="debate-subtitle">As falas se alternam: a oposição pergunta, você responde, depois você questiona e o adversário precisa se explicar.</p>
                    </div>
                    <button id="debate-exit" class="btn-secondary debate-exit">← VOLTAR AO GABINETE</button>
                </header>
                <div class="debate-status">
                    <div class="debate-status-card"><small>SEU CANDIDATO</small><strong>${playerName}</strong><small>${partyName}</small></div>
                    <span class="debate-vs">VS.</span>
                    <div class="debate-status-card right"><small>OPOSIÇÃO</small><strong>${opponent.name}</strong><small>${opponent.party}</small></div>
                </div>
                <div class="debate-progress" aria-label="Progresso do debate">${progress}</div>
                <div class="debate-stage">
                    <div class="debate-spotlight left"></div><div class="debate-spotlight right"></div>
                    <div class="debate-contestant ${isPlayerSpeaking ? "is-active" : ""}">
                        <span class="contestant-label">${playerName}</span>
                        ${pixelSprite("player")}
                        <div class="debate-podium"><b>${escapeHTML(partyName)}</b><small>SEU PARTIDO</small></div>
                    </div>
                    <div class="debate-contestant ${!isPlayerSpeaking ? "is-active" : ""}">
                        <span class="contestant-label">${opponent.name}</span>
                        ${pixelSprite("opponent")}
                        <div class="debate-podium"><b>ALIANÇA</b><small>OPOSIÇÃO</small></div>
                    </div>
                    <div class="debate-audience" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
                </div>
                <div class="debate-dialogue">
                    <span class="debate-speaker">${escapeHTML(speaker === "player" ? playerName : opponent.name)} · ${phaseTitle}</span>
                    ${dialogue}
                </div>
                <div class="debate-choice-heading"><h2>${choiceTitle}</h2><span>RODADA ${Math.min(roundIndex + 1, rounds.length)} DE ${rounds.length} · ${current.theme}</span></div>
                ${showChoices ? `<div id="debate-options" class="debate-choices"></div>` : `
                    <div class="debate-feedback">${feedbackHTML}</div>
                    <div class="debate-next-row">
                        <span class="debate-score">PONTUAÇÃO: <b>${debate.totalScore} PONTOS</b></span>
                        <button id="${buttonId}" class="btn-primary">${buttonLabel}</button>
                    </div>`}
            </section>`;
        document.querySelector("#debate-exit")?.addEventListener("click", returnToDashboard);
    }

    function renderChoiceButtons(options, type) {
        const container = document.querySelector("#debate-options");
        if (!container) return;
        container.innerHTML = options.map((option, index) => `
            <button class="debate-choice" data-choice="${index}">
                <span class="choice-top">${type === "answer" ? "RESPOSTA" : "PERGUNTA"} ${String.fromCharCode(65 + index)} · ${escapeHTML(option.style)}</span>
                <strong>${escapeHTML(option.title)}</strong>
                <small>${escapeHTML(option.detail)}</small>
                <span class="choice-skill">HABILIDADE: ${escapeHTML(option.skill === "politicalKnowledge" ? "CONHECIMENTO POLÍTICO" : option.skill === "leadership" ? "LIDERANÇA" : option.skill === "negotiation" ? "NEGOCIAÇÃO" : "CARISMA")}</span>
            </button>`).join("");
        container.querySelectorAll("[data-choice]").forEach(button => {
            button.addEventListener("click", () => {
                const index = Number(button.dataset.choice);
                if (type === "answer") chooseAnswer(index);
                else choosePlayerQuestion(index);
            });
        });
    }

    function renderRound() {
        const save = readSave();
        if (!save?.character || !save?.party) return;
        const round = rounds[debate.roundIndex];
        if (!round) return finishDebate();
        debate.phase = "opponentQuestion";
        renderShell({
            roundIndex: debate.roundIndex,
            speaker: "opponent",
            phase: "opponentQuestion",
            playerName: getPlayerName(save),
            partyName: escapeHTML(save.party.acronym || save.party.name || "PARTIDO"),
            showChoices: true,
            dialogue: `<p>“${escapeHTML(round.question)}”</p>`
        });
        renderChoiceButtons(round.options, "answer");
    }

    function chooseAnswer(index) {
        const save = readSave();
        const round = rounds[debate.roundIndex];
        const option = round?.options[index];
        if (!save || !option || debate.phase !== "opponentQuestion") return;

        const skill = getStat(save, option.skill);
        const modifier = Math.round((skill - 50) / 20);
        const score = option.base + modifier;
        debate.totalScore += score;
        debate.answerScores.push(score);
        debate.lastAnswer = option;
        debate.phase = "opponentReply";

        let reply;
        if (score >= 6) reply = option.good;
        else if (score >= 2) reply = option.mid;
        else reply = option.bad;

        const label = score >= 6 ? "RESPOSTA FORTE" : score >= 2 ? "RESPOSTA RAZOÁVEL" : "RESPOSTA QUESTIONADA";
        const feedbackHTML = `<strong>${label} · ${score > 0 ? "+" : ""}${score} PONTOS</strong><p>${score >= 6 ? "Sua habilidade ajudou a sustentar o argumento. Agora você terá a oportunidade de colocar o adversário na defensiva." : score >= 2 ? "Você respondeu ao tema, mas ainda deixou pontos que podem ser explorados. Agora é sua vez de perguntar." : "A resposta abriu espaço para críticas. Tente recuperar terreno com uma pergunta precisa."}</p>`;
        renderShell({
            roundIndex: debate.roundIndex,
            speaker: "opponent",
            phase: "opponentReply",
            playerName: getPlayerName(save),
            partyName: escapeHTML(save.party.acronym || save.party.name || "PARTIDO"),
            dialogue: `<p class="debate-response-quote">SUA RESPOSTA: “${escapeHTML(option.title)}”</p><p>“${escapeHTML(reply)}”</p>`,
            feedbackHTML,
            buttonId: "debate-ask-turn",
            buttonLabel: "AGORA, FAÇA UMA PERGUNTA →"
        });
        document.querySelector("#debate-ask-turn")?.addEventListener("click", renderPlayerQuestion);
    }

    function renderPlayerQuestion() {
        const save = readSave();
        if (!save?.character || !save?.party) return;
        const round = rounds[debate.roundIndex];
        const questions = playerQuestions[debate.roundIndex] || [];
        debate.phase = "playerQuestion";
        renderShell({
            roundIndex: debate.roundIndex,
            speaker: "player",
            phase: "playerQuestion",
            playerName: getPlayerName(save),
            partyName: escapeHTML(save.party.acronym || save.party.name || "PARTIDO"),
            showChoices: true,
            dialogue: `<p>“Minha resposta foi essa. Agora quero que o senhor explique melhor sua posição sobre <b>${escapeHTML(round.theme.toLowerCase())}</b>.”</p><p class="debate-dialogue-hint">Você tem a palavra. Escolha uma pergunta para pressionar o candidato adversário.</p>`
        });
        renderChoiceButtons(questions, "question");
    }

    function choosePlayerQuestion(index) {
        const save = readSave();
        const question = playerQuestions[debate.roundIndex]?.[index];
        if (!save || !question || debate.phase !== "playerQuestion") return;

        const playerSkill = getStat(save, question.skill);
        const playerQuestionScore = question.base + Math.round((playerSkill - 50) / 20);
        const opponentSkill = Number(opponent[question.opponentSkill] ?? 60);
        const opponentDefense = 3 + Math.round((opponentSkill - 50) / 10);
        const margin = playerQuestionScore - opponentDefense;
        const pressureScore = clamp(3 + margin, 0, 6);
        const pressurePoints = pressureScore - 3;
        debate.totalScore += pressurePoints;
        debate.questionScores.push(pressureScore);
        debate.lastQuestion = question;
        debate.phase = "opponentAnswer";

        let reply;
        let label;
        let explanation;
        if (margin >= 2) {
            reply = question.cornered;
            label = "OPONENTE PRESSIONADO";
            explanation = "Sua pergunta foi específica e difícil de contornar. O adversário não conseguiu apresentar uma resposta completa.";
        } else if (margin >= 0) {
            reply = question.partial;
            label = "RESPOSTA PARCIAL";
            explanation = "Você levantou um ponto relevante, mas o adversário conseguiu responder em parte. Há espaço para uma nova cobrança.";
        } else {
            reply = question.strong;
            label = "ADVERSÁRIO SE DEFENDEU";
            explanation = "O adversário tinha preparo para esse tema e conseguiu sustentar a resposta. Uma pergunta mais precisa poderia pressioná-lo.";
        }

        const feedbackHTML = `<strong>${label} · ${pressurePoints > 0 ? "+" : ""}${pressurePoints} PONTOS DE PRESSÃO</strong><p>${explanation}</p><p class="debate-pressure-meter">PRESSÃO GERADA: <b>${pressureScore}/6</b></p>`;
        renderShell({
            roundIndex: debate.roundIndex,
            speaker: "opponent",
            phase: "opponentAnswer",
            playerName: getPlayerName(save),
            partyName: escapeHTML(save.party.acronym || save.party.name || "PARTIDO"),
            dialogue: `<p class="debate-response-quote">SUA PERGUNTA: “${escapeHTML(question.title)}”</p><p>“${escapeHTML(reply)}”</p>`,
            feedbackHTML,
            buttonId: "debate-next",
            buttonLabel: debate.roundIndex + 1 >= rounds.length ? "VER RESULTADO →" : "PRÓXIMO TEMA →"
        });
        document.querySelector("#debate-next")?.addEventListener("click", () => {
            debate.roundIndex++;
            if (debate.roundIndex >= rounds.length) finishDebate();
            else renderRound();
        });
    }

    function finishDebate() {
        const save = readSave();
        if (!save?.character) return returnToDashboard();
        const average = debate.totalScore / rounds.length;
        const strongQuestions = debate.questionScores.filter(score => score >= 5).length;
        const approvalDelta = average >= 6 ? 4 : average >= 4 ? 2 : average >= 2 ? 1 : average < 0 ? -3 : 0;
        const reputationDelta = average >= 6 ? 5 : average >= 4 ? 3 : average >= 2 ? 1 : average < 0 ? -3 : 0;
        save.approval = clamp((save.approval ?? 50) + approvalDelta);
        save.reputation = clamp((save.reputation ?? 50) + reputationDelta);
        if (!Array.isArray(save.debateHistory)) save.debateHistory = [];
        const resultLabel = average >= 6 ? "DEBATE DOMINADO" : average >= 4 ? "BOA ATUAÇÃO" : average >= 2 ? "DESEMPENHO EQUILIBRADO" : average < 0 ? "DEBATE DIFÍCIL" : "ATUAÇÃO DISCRETA";
        save.debateHistory.unshift({
            month: save.currentMonth || 1,
            year: save.currentYear || 2026,
            opponent: opponent.name,
            score: debate.totalScore,
            strongQuestions,
            result: resultLabel,
            approvalDelta,
            reputationDelta
        });
        save.debateHistory = save.debateHistory.slice(0, 12);
        writeSave(save);

        main.innerHTML = `
            <section class="debate-screen">
                <header class="debate-head"><div><span class="debate-kicker">REPÚBLICA DE AURORA · ENCERRAMENTO</span><h1>RESULTADO DO <span>DEBATE.</span></h1><p class="debate-subtitle">A imprensa e os eleitores começam a avaliar seu desempenho.</p></div></header>
                <div class="debate-result">
                    <div class="result-mark">★</div>
                    <h2>${resultLabel}</h2>
                    <p>Você participou de cinco temas, alternando perguntas e respostas com ${opponent.name}. O resultado considera tanto a qualidade das suas respostas quanto a pressão que suas perguntas conseguiram exercer.</p>
                    <div class="debate-result-stats">
                        <div class="debate-result-stat"><span>PONTUAÇÃO</span><strong>${debate.totalScore}</strong></div>
                        <div class="debate-result-stat"><span>PERGUNTAS FORTES</span><strong>${strongQuestions}/5</strong></div>
                        <div class="debate-result-stat"><span>POPULARIDADE</span><strong>${approvalDelta > 0 ? "+" : ""}${approvalDelta}</strong></div>
                        <div class="debate-result-stat"><span>REPUTAÇÃO</span><strong>${reputationDelta > 0 ? "+" : ""}${reputationDelta}</strong></div>
                    </div>
                    <div class="debate-result-note">Nova aprovação: <b>${save.approval}/100</b> · Nova reputação: <b>${save.reputation}/100</b><br>O resultado foi salvo na sua carreira.</div>
                    <button id="debate-finish" class="btn-primary">VOLTAR AO GABINETE →</button>
                </div>
            </section>`;
        document.querySelector("#debate-finish")?.addEventListener("click", returnToDashboard);
    }

    function returnToDashboard() {
        sessionStorage.setItem(RESUME_KEY, "1");
        window.location.reload();
    }

    function installButton() {
        const actions = main.querySelector(".dashboard-actions");
        if (!actions || actions.querySelector("#open-debate")) return;
        const save = readSave();
        if (!save?.character || !save?.party) return;
        const button = document.createElement("button");
        button.type = "button";
        button.id = "open-debate";
        button.className = "btn-secondary debate-launch-btn";
        button.textContent = "ARENA DE DEBATE";
        button.addEventListener("click", startDebate);
        const nextMonth = actions.querySelector("#next-month");
        actions.insertBefore(button, nextMonth || null);
    }

    const observer = new MutationObserver(installButton);
    observer.observe(main, { childList: true, subtree: true });
    installButton();

    if (sessionStorage.getItem(RESUME_KEY) === "1") {
        sessionStorage.removeItem(RESUME_KEY);
        window.setTimeout(() => document.querySelector("#continue-game")?.click(), 80);
    }
})();
