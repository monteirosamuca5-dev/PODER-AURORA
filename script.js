/* =====================================================
   PODER — REPÚBLICA DE AURORA
   SCRIPT PRINCIPAL REORGANIZADO
===================================================== */

(() => {
    "use strict";

    const STORAGE_KEY = "poder_save";
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const defaultGame = () => ({
        character: null,
        party: null,
        currentMonth: 1,
        currentYear: 2026,
        approval: 50,
        money: 0,
        influence: 0,
        reputation: 50,
        eventIndex: 0,
        eventHistory: [],
        regionalHistory: [],
        monthStarted: false,
        regions: {}
    });

    let game = defaultGame();

    const newGameButton = $("#new-game");
    const continueButton = $("#continue-game");
    const settingsButton = $("#settings-game");
    const settingsModal = $("#settings-modal");
    const closeSettings = $("#close-settings");

    function clamp(value, min = 0, max = 100) {
        const number = Number(value);
        return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min));
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0
        });
    }

    function saveGame() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
            return true;
        } catch (error) {
            console.error("Erro ao salvar a partida:", error);
            alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
            return false;
        }
    }

    function checkSave() {
        if (!continueButton) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        continueButton.disabled = !saved;
    }

    function normalizeLoadedGame(savedGame) {
        const base = defaultGame();
        const loaded = savedGame && typeof savedGame === "object" ? savedGame : {};

        game = { ...base, ...loaded };

        if (!Array.isArray(game.eventHistory)) game.eventHistory = [];
        if (!Array.isArray(game.regionalHistory)) game.regionalHistory = [];
        if (!game.regions || typeof game.regions !== "object") game.regions = {};

        game.currentMonth = clamp(game.currentMonth || 1, 1, 12);
        game.currentYear = Math.max(2026, Number(game.currentYear) || 2026);
        game.eventIndex = Math.max(0, Number(game.eventIndex) || 0);
    }

    function loadGame() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            alert("Nenhuma partida encontrada!");
            checkSave();
            return;
        }

        try {
            normalizeLoadedGame(JSON.parse(saved));

            if (!game.character) {
                alert("Este salvamento não possui um personagem válido. Inicie uma nova carreira.");
                return;
            }

            if (!game.party) {
                showPartyCreation();
            } else {
                showGameDashboard();
            }

            checkSave();

        } catch (error) {
            console.error("Erro ao carregar a partida:", error);
            alert("Não foi possível carregar esta partida. O salvamento foi mantido.");
        }
    }

    function startNewGame() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved && !confirm("Começar uma nova carreira? A partida anterior será substituída quando você criar o novo personagem.")) {
            return;
        }

        game = defaultGame();
        showCharacterCreation();
    }

    /* ==========================================
       CRIAÇÃO DO PERSONAGEM
    ========================================== */

    function showCharacterCreation() {
        const main = $(".main-content");
        if (!main) return;

        main.innerHTML = `
            <section class="creation-screen">

                <div class="creation-header">
                    <span class="section-tag">NOVA CARREIRA · ETAPA 01</span>
                    <h1>CRIE SUA <span>HISTÓRIA.</span></h1>
                    <p>Antes de conquistar o poder, precisamos saber quem você é e de onde veio.</p>
                </div>

                <div class="creation-form">

                    <div class="form-group">
                        <label for="character-name">NOME DO PERSONAGEM</label>
                        <input type="text" id="character-name" placeholder="Digite seu nome..." maxlength="30">
                    </div>

                    <div class="origin-heading">
                        <h2>SUA ORIGEM</h2>
                        <span>ESCOLHA UMA TRAJETÓRIA</span>
                    </div>

                    <div class="origin-cards">

                        <button class="origin-card" data-origin="cidadao">
                            <div class="origin-icon">👤</div>
                            <h3>CIDADÃO COMUM</h3>
                            <p>Uma pessoa comum que decide entrar na política e mudar o país.</p>
                            <div class="origin-stats">
                                <span>Dinheiro: baixo</span>
                                <span>Influência: baixa</span>
                            </div>
                        </button>

                        <button class="origin-card" data-origin="empresario">
                            <div class="origin-icon">💼</div>
                            <h3>EMPRESÁRIO</h3>
                            <p>Um empresário que decide transformar sua influência econômica em poder político.</p>
                            <div class="origin-stats">
                                <span>Dinheiro: alto</span>
                                <span>Influência: média</span>
                            </div>
                        </button>

                        <button class="origin-card" data-origin="lider_social">
                            <div class="origin-icon">🤝</div>
                            <h3>LÍDER SOCIAL</h3>
                            <p>Uma liderança conhecida por defender sua comunidade e mobilizar pessoas.</p>
                            <div class="origin-stats">
                                <span>Dinheiro: baixo</span>
                                <span>Influência: alta</span>
                            </div>
                        </button>

                    </div>

                    <div class="creation-actions">
                        <button id="back-to-menu" class="btn-secondary">VOLTAR</button>
                        <button id="confirm-character" class="btn-primary" disabled>
                            CONFIRMAR PERSONAGEM →
                        </button>
                    </div>

                    <p class="creation-note">
                        Sua origem influenciará sua carreira política. Nenhuma trajetória garante a vitória.
                    </p>

                </div>
            </section>
        `;

        const cards = $$(".origin-card", main);
        const confirmButton = $("#confirm-character", main);
        const nameInput = $("#character-name", main);

        let selectedOrigin = null;

        cards.forEach(card => card.addEventListener("click", () => {
            cards.forEach(item => item.classList.remove("selected"));
            card.classList.add("selected");

            selectedOrigin = card.dataset.origin;
            confirmButton.disabled = !nameInput.value.trim();
        }));

        nameInput.addEventListener("input", () => {
            confirmButton.disabled = !nameInput.value.trim() || !selectedOrigin;
        });

        confirmButton.addEventListener("click", () => {
            const name = nameInput.value.trim();

            if (!name || !selectedOrigin) return;

            createCharacter(name, selectedOrigin);
        });

        $("#back-to-menu", main).addEventListener("click", () => location.reload());
    }

    function createCharacter(name, origin) {
        const origins = {
            cidadao: {
                label: "Cidadão comum",
                money: 10000,
                influence: 10,
                reputation: 55,
                charisma: 50,
                negotiation: 40,
                leadership: 45,
                politicalKnowledge: 35
            },

            empresario: {
                label: "Empresário",
                money: 80000,
                influence: 35,
                reputation: 40,
                charisma: 45,
                negotiation: 65,
                leadership: 45,
                politicalKnowledge: 45
            },

            lider_social: {
                label: "Líder social",
                money: 5000,
                influence: 55,
                reputation: 70,
                charisma: 70,
                negotiation: 45,
                leadership: 75,
                politicalKnowledge: 50
            }
        };

        const attributes = origins[origin];

        if (!attributes) return;

        game.character = {
            name,
            origin,
            originLabel: attributes.label,
            charisma: attributes.charisma,
            negotiation: attributes.negotiation,
            leadership: attributes.leadership,
            politicalKnowledge: attributes.politicalKnowledge
        };

        game.money = attributes.money;
        game.influence = attributes.influence;
        game.reputation = attributes.reputation;
        game.approval = 50;

        saveGame();
        showPartyCreation();
    }

    /* ==========================================
       CRIAÇÃO DO PARTIDO
    ========================================== */

    function showPartyCreation() {
        const main = $(".main-content");
        if (!main) return;

        const characterName = game.character ? game.character.name : "";

        main.innerHTML = `
            <section class="creation-screen">

                <div class="creation-header">
                    <span class="section-tag">NOVA CARREIRA · ETAPA 02</span>
                    <h1>FUNDE SEU <span>PARTIDO.</span></h1>
                    <p>${characterName}, chegou a hora de criar seu próprio movimento político.</p>
                </div>

                <div class="creation-form">

                    <div class="form-group">
                        <label for="party-name">NOME DO PARTIDO</label>
                        <input type="text" id="party-name" placeholder="Ex.: Movimento Aurora..." maxlength="45">
                    </div>

                    <div class="form-group">
                        <label for="party-acronym">SIGLA</label>
                        <input type="text" id="party-acronym" placeholder="Ex.: MA" maxlength="8">
                    </div>

                    <div class="creation-actions">
                        <button id="back-to-character" class="btn-secondary">VOLTAR</button>
                        <button id="confirm-party" class="btn-primary">FUNDAR PARTIDO →</button>
                    </div>

                </div>
            </section>
        `;

        $("#confirm-party", main).addEventListener("click", () => {
            const name = $("#party-name", main).value.trim();
            const acronym = $("#party-acronym", main).value.trim();

            if (!name || !acronym) {
                alert("Preencha o nome e a sigla do partido.");
                return;
            }

            game.party = {
                name,
                acronym: acronym.toUpperCase()
            };

            saveGame();
            checkSave();
            showGameDashboard();
        });

        $("#back-to-character", main).addEventListener("click", showCharacterCreation);
    }

    /* ==========================================
       EVENTOS POLÍTICOS
    ========================================== */

    const starterEvents = [

        {
            title: "A primeira reunião do partido",
            category: "ORGANIZAÇÃO POLÍTICA",
            description: "Seu partido acaba de ser fundado, mas ainda é pequeno. Você precisa decidir como conquistar os primeiros apoiadores e construir sua presença política.",

            choices: [

                {
                    title: "Organizar núcleos comunitários",
                    description: "Aproximar o partido das comunidades e conquistar apoio popular.",
                    effects: {
                        money: -2500,
                        influence: 12,
                        reputation: 5
                    },
                    result: "O partido começa a conquistar espaço nas comunidades. Novos voluntários aparecem e sua presença política cresce."
                },

                {
                    title: "Buscar apoiadores empresariais",
                    description: "Negociar contribuições e estabelecer contatos com empresários.",
                    effects: {
                        money: 12000,
                        influence: 6,
                        reputation: -3,
                        negotiation: 4
                    },
                    result: "Você consegue novos recursos para o partido. Entretanto, alguns cidadãos começam a questionar a proximidade com empresários."
                },

                {
                    title: "Publicar um programa político",
                    description: "Apresentar suas propostas e explicar o que pretende fazer por Aurora.",
                    effects: {
                        money: -1200,
                        influence: 3,
                        reputation: 8,
                        politicalKnowledge: 6
                    },
                    result: "A apresentação das propostas melhora a imagem de organização do partido e ajuda a construir sua identidade."
                }

            ]
        },

        {
            title: "Uma entrevista decisiva",
            category: "IMPRENSA",
            description: "Um importante canal de notícias de Aurora convidou você para uma entrevista. É sua primeira oportunidade de apresentar suas ideias para milhares de pessoas.",

            choices: [

                {
                    title: "Responder com transparência",
                    description: "Explicar suas propostas, reconhecer dificuldades e evitar promessas impossíveis.",
                    effects: {
                        reputation: 7,
                        charisma: 3,
                        influence: 2
                    },
                    result: "Sua postura transmite seriedade. Parte da imprensa destaca sua disposição para responder perguntas difíceis."
                },

                {
                    title: "Apresentar grandes promessas",
                    description: "Falar sobre mudanças ambiciosas e destacar o futuro que deseja construir.",
                    effects: {
                        approval: 5,
                        reputation: -2,
                        charisma: 2
                    },
                    result: "Sua entrevista chama a atenção do público. Entretanto, jornalistas começam a cobrar explicações sobre a viabilidade das promessas."
                },

                {
                    title: "Criticar os partidos tradicionais",
                    description: "Usar a entrevista para questionar os grupos políticos que dominam Aurora.",
                    effects: {
                        influence: 5,
                        reputation: -5,
                        charisma: 1
                    },
                    result: "Sua declaração gera repercussão e atrai atenção. Ao mesmo tempo, algumas pessoas consideram sua postura excessivamente agressiva."
                }

            ]
        },

        {
            title: "A primeira visita regional",
            category: "AGENDA POLÍTICA",
            description: "Você precisa escolher onde concentrar seus primeiros esforços. Três compromissos estão disponíveis para sua agenda.",

            choices: [

                {
                    title: "Visitar uma comunidade periférica",
                    description: "Conversar com moradores e conhecer problemas locais.",
                    effects: {
                        money: -1500,
                        influence: 8,
                        reputation: 5
                    },
                    result: "A visita aproxima seu partido da população local. Moradores começam a acompanhar suas propostas."
                },

                {
                    title: "Conhecer o setor industrial",
                    description: "Visitar empresas, conversar com trabalhadores e conhecer os desafios da produção.",
                    effects: {
                        money: -1000,
                    influence: 4,
                    negotiation: 5
                },
                result: "Você estabelece contatos importantes e conhece melhor os desafios econômicos da região."
            },

            {
                title: "Realizar uma reunião pública",
                description: "Organizar um encontro aberto para apresentar suas ideias e ouvir a população.",
                effects: {
                    money: -2000,
                    influence: 5,
                    charisma: 5,
                    reputation: 2
                },
                result: "O encontro atrai apoiadores e permite que você desenvolva sua capacidade de comunicação pública."
            }

        ]
    }

    ];

    function applyEventConsequences(choice) {
        const effects = choice.effects || {};

        Object.entries(effects).forEach(([key, value]) => {
            if (key === "money") {
                game.money = Math.max(0, (game.money || 0) + value);
            } else if (["influence", "reputation", "approval"].includes(key)) {
                game[key] = clamp((game[key] || 0) + value);
            } else if (game.character && key in game.character) {
                game.character[key] = clamp((game.character[key] || 0) + value);
            }
        });

        if (!Array.isArray(game.eventHistory)) {
            game.eventHistory = [];
        }

        game.eventHistory.unshift({
            month: game.currentMonth,
            year: game.currentYear,
            event: choice.eventTitle || "",
            decision: choice.title,
            result: choice.result
        });

        saveGame();
    }

    function getEffectDescription(effects) {
        const labels = {
            money: "Recursos financeiros",
            influence: "Influência política",
            reputation: "Reputação",
            approval: "Popularidade",
            charisma: "Carisma",
            negotiation: "Negociação",
            politicalKnowledge: "Conhecimento político",
            leadership: "Liderança"
        };

        return Object.entries(effects || {}).map(([key, value]) => {
            let formattedValue;

            if (key === "money") {
                formattedValue = `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
            } else {
                formattedValue = `${value > 0 ? "+" : ""}${value}`;
            }

            return `
                <div class="impact-item">
                    <span>${labels[key] || key}</span>
                    <strong class="${value >= 0 ? "positive" : "negative"}">
                        ${formattedValue}
                    </strong>
                </div>
            `;
        }).join("");
    }

    function advanceToEvent() {
        if (game.monthStarted) {
            game.currentMonth++;

            if (game.currentMonth > 12) {
                game.currentMonth = 1;
                game.currentYear++;
            }
        } else {
            game.monthStarted = true;
        }

        const index = Number(game.eventIndex || 0);
        const event = starterEvents[index % starterEvents.length];

        game.eventIndex = index + 1;

        saveGame();
        showPoliticalEvent(event);
    }

    function showPoliticalEvent(event) {
        const main = $(".main-content");
        if (!main) return;

        const context = `${event.category} ${event.title} ${event.description}`.toLowerCase();

        let sceneType = "office";
        let sceneName = "GABINETE POLÍTICO";

        if (/imprensa|entrevista|jornal|repórter|coletiva/.test(context)) {
            sceneType = "press";
            sceneName = "SALA DE IMPRENSA";
        } else if (/comunidade|morador|regional|bairro|visita/.test(context)) {
            sceneType = "community";
            sceneName = "VISITA À COMUNIDADE";
        } else if (/reunião|partido|aliado|articulação|diretório/.test(context)) {
            sceneType = "meeting";
            sceneName = "SEDE DO PARTIDO";
        }

        main.innerHTML = `
            <section class="event-screen">

                <div class="event-scene scene-${sceneType}">
                    <span class="scene-caption">${sceneName}</span>
                </div>

                <div class="event-topline">
                    <span>${event.category}</span>
                    <span>MÊS ${game.currentMonth} · ${game.currentYear}</span>
                </div>

                <div class="event-content">
                    <div class="event-symbol">!</div>

                    <h1>${event.title}</h1>

                    <p class="event-description">${event.description}</p>

                    <div class="event-question">QUAL SERÁ SUA DECISÃO?</div>

                    <div class="event-options">
                        ${event.choices.map((choice, index) => `
                            <button class="event-option" data-choice="${index}">
                                <div class="option-letter">
                                    ${String.fromCharCode(65 + index)}
                                </div>

                                <div class="option-text">
                                    <strong>${choice.title}</strong>
                                    <span>${choice.description}</span>
                                </div>

                                <div class="option-arrow">→</div>
                            </button>
                        `).join("")}
                    </div>

                    <p class="event-note">
                        Suas decisões podem afetar o futuro da sua carreira.
                    </p>
                </div>
            </section>
        `;

        $$(".event-option", main).forEach(button => {
            button.addEventListener("click", () => {
                const choiceIndex = Number(button.dataset.choice);
                const choice = event.choices[choiceIndex];

                if (!choice) return;

                choice.eventTitle = event.title;
                applyEventConsequences(choice);
                showEventResult(event, choice);
            });
        });
    }

    function showEventResult(event, choice) {
        const main = $(".main-content");
        if (!main) return;

        main.innerHTML = `
            <section class="event-screen">

                <div class="event-scene scene-office">
                    <span class="scene-caption">RESULTADO DA DECISÃO</span>
                </div>

                <div class="event-topline">
                    <span>${event.category}</span>
                    <span>MÊS ${game.currentMonth} · ${game.currentYear}</span>
                </div>

                <div class="event-content">
                    <div class="event-symbol">✓</div>

                    <h1>DECISÃO REGISTRADA</h1>

                    <p class="event-description">
                        ${choice.title}
                    </p>

                    <div class="event-question">CONSEQUÊNCIAS</div>

                    <p class="event-description">${choice.result}</p>

                    <div class="event-impacts">
                        ${getEffectDescription(choice.effects)}
                    </div>

                    <div class="dashboard-actions">
                        <button id="return-dashboard" class="btn-primary">
                            CONTINUAR →
                        </button>
                    </div>
                </div>
            </section>
        `;

        $("#return-dashboard", main).addEventListener("click", showGameDashboard);
    }

    /* ==========================================
       MAPA E REGIÕES DE AURORA
    ========================================== */

    const auroraRegions = [
        {
            id: "planalto",
            name: "Planalto Norte",
            short: "PLANALTO",
            capital: "Alto Norte",
            population: "1,4 milhão",
            path: "M205 35 L325 25 L390 95 L360 165 L255 155 L190 105 Z",
            x: 290, y: 100,
            stats: { economy: 54, infrastructure: 43, health: 58, education: 61, security: 66 },
            issue: "Acesso à água e estradas rurais",
            description: "Comunidades rurais enfrentam períodos de seca e dificuldades para transportar sua produção.",
            news: "Moradores cobram medidas contra a falta de água",
            newsSummary: "Representantes de comunidades rurais pedem melhorias no abastecimento e nas estradas.",
            choices: [
                { title: "Construir sistemas de abastecimento", description: "Investir em poços e distribuição de água.", effects: { infrastructure: 7, health: 3, money: -7000, approval: 3 }, result: "O projeto amplia o acesso à água, mas exige recursos públicos." },
                { title: "Recuperar estradas rurais", description: "Facilitar o transporte de pessoas e mercadorias.", effects: { infrastructure: 8, economy: 5, money: -8000, influence: 2 }, result: "A recuperação melhora o transporte da produção e o acesso às comunidades." },
                { title: "Apoiar pequenos produtores", description: "Criar linhas de apoio à agricultura familiar.", effects: { economy: 7, education: 2, money: -5000, reputation: 3 }, result: "Pequenos produtores recebem apoio para ampliar sua atividade." }
            ]
        },

        {
            id: "litoral",
            name: "Litoral",
            short: "LITORAL",
            capital: "Porto das Águas",
            population: "1,8 milhão",
            path: "M325 25 L440 55 L485 145 L420 205 L360 165 L390 95 Z",
            x: 420, y: 120,
            stats: { economy: 72, infrastructure: 65, health: 62, education: 66, security: 55 },
            issue: "Poluição e atividade portuária",
            description: "O crescimento do porto aumentou a movimentação econômica, mas pescadores denunciam poluição e fiscalização insuficiente.",
            news: "Pescadores pedem fiscalização na região portuária",
            newsSummary: "Entidades locais cobram medidas para proteger a pesca e o meio ambiente.",
            choices: [
                { title: "Ampliar a fiscalização", description: "Reforçar inspeções ambientais no porto.", effects: { health: 4, security: 2, money: -4000, reputation: 3 }, result: "A fiscalização é reforçada e novas irregularidades passam a ser investigadas." },
                { title: "Modernizar o porto", description: "Investir em equipamentos e tratamento de resíduos.", effects: { economy: 8, infrastructure: 5, money: -12000, influence: 3 }, result: "A modernização melhora a estrutura portuária e pode ampliar a atividade econômica." },
                { title: "Criar apoio aos pescadores", description: "Oferecer assistência e compensações temporárias.", effects: { economy: 3, health: 2, money: -6000, approval: 5 }, result: "Os pescadores recebem apoio emergencial enquanto as medidas ambientais são discutidas." }
            ]
        },

        {
            id: "oriental",
            name: "Vale Oriental",
            short: "VALE",
            capital: "Santa Aurora",
            population: "1,3 milhão",
            path: "M420 205 L485 145 L540 235 L515 330 L445 350 L395 275 Z",
            x: 475, y: 260,
            stats: { economy: 49, infrastructure: 48, health: 52, education: 57, security: 60 },
            issue: "Abastecimento irregular",
            description: "Bairros periféricos e pequenos municípios enfrentam interrupções frequentes no abastecimento de água.",
            news: "Interrupções no abastecimento geram reclamações",
            newsSummary: "Moradores relatam dificuldades para manter o fornecimento regular de água.",
            choices: [
                { title: "Enviar caminhões-pipa", description: "Atender imediatamente as áreas mais afetadas.", effects: { health: 3, infrastructure: 1, money: -3000, approval: 2 }, result: "O atendimento emergencial reduz parte das dificuldades, mas não resolve o problema estrutural." },
                { title: "Ampliar a rede de abastecimento", description: "Executar obras de longo prazo.", effects: { infrastructure: 9, health: 5, money: -11000, influence: 2 }, result: "As obras prometem ampliar o fornecimento, embora sua conclusão exija tempo." },
                { title: "Criar um plano de conservação", description: "Reduzir desperdícios e melhorar a gestão da água.", effects: { infrastructure: 4, economy: 3, money: -2500, reputation: 4 }, result: "O plano melhora a gestão dos recursos hídricos e estabelece metas de economia." }
            ]
        },

        {
            id: "serra",
            name: "Serra Alta",
            short: "SERRA",
            capital: "Pedra Clara",
            population: "900 mil",
            path: "M190 105 L255 155 L245 260 L165 285 L95 215 L115 125 Z",
            x: 160, y: 195,
            stats: { economy: 45, infrastructure: 46, health: 55, education: 48, security: 72 },
            issue: "Dificuldade de acesso à educação",
            description: "Alunos de comunidades afastadas percorrem longas distâncias para chegar às escolas.",
            news: "Famílias reivindicam transporte escolar",
            newsSummary: "Comunidades da Serra Alta pedem melhores condições para os estudantes.",
            choices: [
                { title: "Ampliar o transporte escolar", description: "Disponibilizar veículos para comunidades distantes.", effects: { education: 8, infrastructure: 3, money: -6000, approval: 3 }, result: "Mais estudantes passam a ter acesso ao transporte escolar." },
                { title: "Reformar escolas", description: "Melhorar salas, equipamentos e instalações.", effects: { education: 9, infrastructure: 3, money: -9000, reputation: 4 }, result: "As escolas recebem melhorias estruturais e melhores condições de funcionamento." },
                { title: "Criar ensino digital complementar", description: "Levar equipamentos e conexão às escolas.", effects: { education: 6, economy: 2, money: -5000, influence: 2 }, result: "A iniciativa amplia o acesso a recursos educacionais e tecnológicos." }
            ]
        },

        {
            id: "centro",
            name: "Centro",
            short: "CENTRO",
            capital: "Nova Aurora",
            population: "3,2 milhões",
            path: "M255 155 L360 165 L420 205 L395 275 L325 325 L240 275 L245 260 Z",
            x: 325, y: 245,
            stats: { economy: 78, infrastructure: 70, health: 45, education: 76, security: 52 },
            issue: "Sobrecarga nos hospitais",
            description: "Os principais hospitais enfrentam filas, falta de leitos e demora em consultas.",
            news: "Hospitais enfrentam aumento no tempo de espera",
            newsSummary: "Pacientes relatam demora no atendimento nas principais unidades de saúde.",
            choices: [
                { title: "Contratar equipes temporárias", description: "Reforçar o atendimento nos hospitais.", effects: { health: 6, money: -6500, approval: 3 }, result: "O reforço temporário ajuda a reduzir parte das filas de atendimento." },
                { title: "Ampliar hospitais", description: "Investir em leitos e instalações.", effects: { health: 10, infrastructure: 3, money: -15000, influence: 2 }, result: "A ampliação aumenta a capacidade de atendimento, mas demanda um investimento elevado." },
                { title: "Fortalecer a atenção básica", description: "Ampliar postos e prevenção.", effects: { health: 8, economy: 2, money: -8000, reputation: 3 }, result: "O fortalecimento dos postos melhora a prevenção e reduz a pressão sobre os hospitais." }
            ]
        },

        {
            id: "fronteira",
            name: "Fronteira Oeste",
            short: "OESTE",
            capital: "Campo Novo",
            population: "1,1 milhão",
            path: "M95 215 L165 285 L150 385 L80 420 L35 330 L40 250 Z",
            x: 95, y: 325,
            stats: { economy: 58, infrastructure: 39, health: 54, education: 56, security: 59 },
            issue: "Transporte da produção agrícola",
            description: "Produtores enfrentam estradas precárias e custos elevados para transportar mercadorias.",
            news: "Produtores relatam perdas durante o transporte",
            newsSummary: "Entidades agrícolas pedem recuperação das principais rotas de escoamento.",
            choices: [
                { title: "Recuperar rodovias", description: "Melhorar as principais rotas de transporte.", effects: { infrastructure: 9, economy: 6, money: -11000 }, result: "A recuperação das rodovias melhora as condições para o transporte da produção." },
                { title: "Criar centros de distribuição", description: "Aproximar produtores dos mercados consumidores.", effects: { economy: 8, infrastructure: 4, money: -9000, influence: 3 }, result: "Os novos centros facilitam o armazenamento e a distribuição das mercadorias." },
                { title: "Apoiar cooperativas", description: "Fortalecer a organização dos produtores.", effects: { economy: 5, education: 3, money: -4000, reputation: 4 }, result: "As cooperativas ganham estrutura e maior capacidade de negociação." }
            ]
        },

        {
            id: "verde",
            name: "Vale Verde",
            short: "VERDE",
            capital: "Boa Esperança",
            population: "1,5 milhão",
            path: "M165 285 L240 275 L325 325 L305 420 L220 465 L145 390 L150 385 Z",
            x: 230, y: 375,
            stats: { economy: 52, infrastructure: 55, health: 61, education: 63, security: 68 },
            issue: "Degradação de rios e áreas verdes",
            description: "O avanço desordenado da atividade econômica ameaça rios e áreas de vegetação.",
            news: "Comunidades denunciam degradação ambiental",
            newsSummary: "Lideranças locais pedem proteção dos rios e acompanhamento das atividades econômicas.",
            choices: [
                { title: "Reforçar a fiscalização", description: "Combater atividades irregulares.", effects: { health: 4, security: 3, money: -4000, reputation: 4 }, result: "A fiscalização ganha recursos e passa a acompanhar áreas de maior risco." },
                { title: "Financiar recuperação ambiental", description: "Recuperar áreas degradadas e margens dos rios.", effects: { health: 5, infrastructure: 2, money: -8000, approval: 3 }, result: "O programa inicia ações de recuperação e proteção dos recursos naturais." },
                { title: "Apoiar atividades sustentáveis", description: "Criar alternativas econômicas para a população.", effects: { economy: 6, education: 3, money: -6000, influence: 2 }, result: "Novas atividades econômicas recebem apoio para reduzir a pressão sobre as áreas naturais." }
            ]
        },

        {
            id: "campos",
            name: "Campos do Sul",
            short: "CAMPOS",
            capital: "Estrela do Sul",
            population: "1,2 milhão",
            path: "M325 325 L395 275 L445 350 L430 445 L350 495 L305 420 Z",
            x: 370, y: 390,
            stats: { economy: 67, infrastructure: 62, health: 64, education: 59, security: 57 },
            issue: "Desemprego no setor industrial",
            description: "Fábricas reduziram turnos e algumas empresas anunciaram demissões.",
            news: "Indústria regional registra cortes de postos de trabalho",
            newsSummary: "Representantes dos trabalhadores pedem medidas para enfrentar o desemprego.",
            choices: [
                { title: "Criar cursos de qualificação", description: "Preparar trabalhadores para novas funções.", effects: { education: 7, economy: 4, money: -5000, approval: 3 }, result: "Cursos de qualificação começam a ser organizados para trabalhadores da região." },
                { title: "Oferecer incentivos produtivos", description: "Estimular empresas a manter e ampliar empregos.", effects: { economy: 8, money: -10000, reputation: -2 }, result: "Empresas recebem incentivos condicionados à manutenção e criação de postos de trabalho." },
                { title: "Ampliar programas de emprego", description: "Criar oportunidades temporárias de trabalho.", effects: { economy: 4, infrastructure: 3, money: -8000, approval: 5 }, result: "O programa oferece oportunidades imediatas, embora tenha custo relevante." }
            ]
        },

        {
            id: "costa",
            name: "Costa Dourada",
            short: "COSTA",
            capital: "Mar do Sol",
            population: "2 milhões",
            path: "M445 350 L515 330 L545 425 L465 490 L430 445 Z",
            x: 490, y: 410,
            stats: { economy: 74, infrastructure: 57, health: 66, education: 68, security: 63 },
            issue: "Alagamentos em áreas costeiras",
            description: "Chuvas fortes e marés elevadas provocam alagamentos em bairros próximos à costa.",
            news: "Bairros costeiros registram novos pontos de alagamento",
            newsSummary: "Moradores pedem obras de drenagem e planos de emergência.",
            choices: [
                { title: "Executar obras de drenagem", description: "Melhorar o escoamento da água.", effects: { infrastructure: 9, health: 3, money: -11000 }, result: "As obras começam a melhorar a drenagem nas áreas mais vulneráveis." },
                { title: "Criar plano de alerta", description: "Organizar avisos e equipes de emergência.", effects: { security: 7, infrastructure: 2, money: -4500, reputation: 3 }, result: "A região passa a contar com um plano de alerta e resposta mais organizado." },
                { title: "Reassentar famílias vulneráveis", description: "Oferecer alternativas habitacionais seguras.", effects: { health: 5, security: 3, money: -9000, approval: 2 }, result: "Famílias em áreas de risco começam a receber alternativas de moradia." }
            ]
        },

        {
            id: "metropolitana",
            name: "Metropolitana",
            short: "METRO",
            capital: "Aurora Central",
            population: "4,5 milhões",
            path: "M145 390 L220 465 L305 420 L350 495 L430 445 L465 490 L395 560 L270 590 L175 535 L120 465 Z",
            x: 290, y: 525,
            stats: { economy: 82, infrastructure: 73, health: 70, education: 79, security: 48 },
            issue: "Moradia e mobilidade urbana",
            description: "O crescimento populacional aumentou o trânsito e a procura por moradia. Trabalhadores enfrentam longos deslocamentos e aluguéis elevados.",
            news: "Mobilidade e moradia dominam debate na capital",
            newsSummary: "Moradores e especialistas cobram planejamento para acompanhar o crescimento urbano.",
            choices: [
                { title: "Ampliar o transporte coletivo", description: "Criar corredores e melhorar as linhas de ônibus.", effects: { infrastructure: 8, economy: 4, money: -12000, approval: 4 }, result: "O plano de mobilidade prioriza corredores e integração do transporte coletivo." },
                { title: "Incentivar moradia acessível", description: "Apoiar projetos habitacionais.", effects: { health: 3, infrastructure: 5, money: -14000, approval: 5 }, result: "Projetos habitacionais começam a receber apoio para ampliar a oferta de moradias." },
                { title: "Reorganizar o planejamento urbano", description: "Rever regras de ocupação e expansão da cidade.", effects: { infrastructure: 5, economy: 5, money: -5000, reputation: 4 }, result: "O planejamento urbano passa por revisão para orientar o crescimento da capital." }
            ]
        }
    ];

    /* ==========================================
       SISTEMA REGIONAL
    ========================================== */

    function initializeRegions() {
        if (!game.regions || typeof game.regions !== "object") {
            game.regions = {};
        }

        auroraRegions.forEach(region => {
            const saved = game.regions[region.id] || {};

            game.regions[region.id] = {
                stats: {
                    ...region.stats,
                    ...(saved.stats || {})
                },

                news: Array.isArray(saved.news) && saved.news.length
                    ? saved.news
                    : [{
                        headline: region.news,
                        summary: region.newsSummary,
                        month: 1,
                        year: 2026
                    }],

                lastDecisionMonth: saved.lastDecisionMonth ?? null,
                lastDecisionYear: saved.lastDecisionYear ?? null
            };
        });
    }

    function showRegionMap() {
        initializeRegions();
        saveGame();

        const main = $(".main-content");
        if (!main) return;

        main.innerHTML = `
            <section class="regional-map-screen">

                <div class="regional-header">
                    <div>
                        <span class="section-tag">REPÚBLICA DE AURORA · TERRITÓRIO</span>
                        <h1>MAPA DE <span>AURORA.</span></h1>
                        <p>Selecione uma região para conhecer sua situação política.</p>
                    </div>

                    <button id="map-back" class="btn-secondary">
                        ← VOLTAR AO GABINETE
                    </button>
                </div>

                <div class="regional-layout">

                    <div class="country-map-card">

                        <div class="map-card-heading">
                            <h2>DIVISÃO REGIONAL</h2>
                            <span>10 REGIÕES</span>
                        </div>

                        <svg class="aurora-map" viewBox="0 0 580 620"
                             role="img" aria-label="Mapa das dez regiões de Aurora">

                            ${auroraRegions.map(region => `
                                <g>
                                    <path
                                        class="map-region"
                                        data-region="${region.id}"
                                        d="${region.path}">
                                    </path>

                                    <text
                                        class="map-label"
                                        x="${region.x}"
                                        y="${region.y}">
                                        ${region.short}
                                    </text>
                                </g>
                            `).join("")}

                        </svg>

                        <p class="map-instruction">
                            SELECIONE UMA DAS REGIÕES DO MAPA
                        </p>

                    </div>

                    <aside id="region-details" class="region-details"></aside>

                </div>
            </section>
        `;

        $("#map-back", main).addEventListener("click", showGameDashboard);

        $$(".map-region", main).forEach(path => {
            path.addEventListener("click", () => {
                showRegionDetails(path.dataset.region);
            });
        });

        showRegionDetails("centro");
    }

    function showRegionDetails(regionId, feedback = "") {
        const region = auroraRegions.find(item => item.id === regionId);
        if (!region) return;

        const state = game.regions[regionId];
        const labels = {
            economy: "ECONOMIA",
            infrastructure: "INFRAESTRUTURA",
            health: "SAÚDE",
            education: "EDUCAÇÃO",
            security: "SEGURANÇA"
        };

        const statsHTML = Object.entries(state.stats).map(([key, value]) => `
            <div class="regional-stat">
                <div class="regional-stat-heading">
                    <span>${labels[key] || key}</span>
                    <strong>${value}/100</strong>
                </div>

                <div class="regional-stat-track">
                    <div class="regional-stat-fill" style="width: ${clamp(value)}%"></div>
                </div>
            </div>
        `).join("");

        const alreadyDecided =
            state.lastDecisionMonth === game.currentMonth &&
            state.lastDecisionYear === game.currentYear;

        const choicesHTML = alreadyDecided
            ? `
                <div class="regional-locked">
                    Você já tomou uma decisão nesta região neste mês.
                    Avance o calendário para poder intervir novamente.
                </div>
            `
            : region.choices.map((choice, index) => `
                <button class="regional-choice" data-choice="${index}">
                    <span class="regional-choice-letter">
                        ${String.fromCharCode(65 + index)}
                    </span>

                    <span class="regional-choice-text">
                        <strong>${choice.title}</strong>
                        <small>${choice.description}</small>
                    </span>

                    <span class="regional-choice-arrow">→</span>
                </button>
            `).join("");

        const newsHTML = state.news.slice(0, 4).map(item => `
            <article class="regional-news-item">
                <span>MÊS ${item.month} · ${item.year}</span>
                <strong>${item.headline}</strong>
                <p>${item.summary}</p>
            </article>
        `).join("");

        const details = $("#region-details");

        details.innerHTML = `
            <div class="region-detail-header">
                <span class="section-tag">REGIÃO SELECIONADA</span>
                <h2>${region.name}</h2>
                <p>Capital: ${region.capital} · População: ${region.population}</p>
            </div>

            <div class="region-indicators">
                <h3>INDICADORES REGIONAIS</h3>
                ${statsHTML}
            </div>

            <div class="region-problem">
                <span class="section-tag">PROBLEMA EM DESTAQUE</span>
                <h3>${region.issue}</h3>
                <p>${region.description}</p>
            </div>

            ${feedback ? `
                <div class="regional-feedback">
                    <strong>DECISÃO REGISTRADA</strong>
                    <p>${feedback}</p>
                </div>
            ` : ""}

            <div class="region-decisions">
                <h3>O QUE SEU PARTIDO FARÁ?</h3>
                ${choicesHTML}
            </div>

            <div class="region-news">
                <h3>NOTÍCIAS DA REGIÃO</h3>
                ${newsHTML}
            </div>
        `;

        $$(".map-region").forEach(path => {
            path.classList.toggle(
                "is-selected",
                path.dataset.region === regionId
            );
        });

        $$(".regional-choice", details).forEach(button => {
            button.addEventListener("click", () => {
                makeRegionalDecision(
                    regionId,
                    Number(button.dataset.choice)
                );
            });
        });
    }

    function makeRegionalDecision(regionId, choiceIndex) {
        const region = auroraRegions.find(item => item.id === regionId);
        if (!region || !game.regions[regionId]) return;

        const state = game.regions[regionId];

        if (
            state.lastDecisionMonth === game.currentMonth &&
            state.lastDecisionYear === game.currentYear
        ) {
            alert("Você já tomou uma decisão nesta região neste mês.");
            return;
        }

        const choice = region.choices[choiceIndex];
        if (!choice) return;

        Object.entries(choice.effects).forEach(([key, value]) => {
            if (key in state.stats) {
                state.stats[key] = clamp(state.stats[key] + value);
            } else if (key === "money") {
                game.money = Math.max(0, (game.money || 0) + value);
            } else if (["influence", "approval", "reputation"].includes(key)) {
                game[key] = clamp((game[key] || 0) + value);
            }
        });

        state.lastDecisionMonth = game.currentMonth;
        state.lastDecisionYear = game.currentYear;

        state.news.unshift({
            headline: `${region.name}: nova medida anunciada`,
            summary: choice.result,
            month: game.currentMonth,
            year: game.currentYear
        });

        state.news = state.news.slice(0, 6);

        if (!Array.isArray(game.regionalHistory)) {
            game.regionalHistory = [];
        }

        game.regionalHistory.unshift({
            region: region.name,
            decision: choice.title,
            result: choice.result,
            month: game.currentMonth,
            year: game.currentYear
        });

        saveGame();
        showRegionDetails(regionId, choice.result);
    }

    /* ==========================================
       PAINEL PRINCIPAL
    ========================================== */

    function showGameDashboard() {
        if (!game.character) {
            showCharacterCreation();
            return;
        }

        const main = $(".main-content");
        if (!main) return;

        const completedEvents = game.eventHistory.length;
        const nextEvent = starterEvents[
            Number(game.eventIndex || 0) % starterEvents.length
        ];

        const cycleNumber = Math.floor(completedEvents / starterEvents.length) + 1;
        const stageNumber = (completedEvents % starterEvents.length) + 1;

        const dashboardTitle = completedEvents === 0
            ? "O PRIMEIRO PASSO"
            : "SUA TRAJETÓRIA AVANÇA";

        const dashboardDescription = completedEvents === 0
            ? "Você acaba de iniciar sua trajetória política. Agora precisará conquistar aliados, organizar seu partido e convencer a população de que merece governar Aurora."
            : `Você já concluiu ${completedEvents} acontecimentos políticos. Seu próximo compromisso será: ${nextEvent.title}. Continue construindo sua trajetória em Aurora.`;

        main.innerHTML = `
            <section class="creation-screen">

                <div class="creation-header">
                    <span class="section-tag">
                        REPÚBLICA DE AURORA · ANO ${game.currentYear}
                    </span>

                    <h1>SUA CARREIRA <span>COMEÇOU.</span></h1>

                    <p>
                        Bem-vindo à política, ${game.character.name}.
                        O futuro de Aurora ainda está em aberto.
                    </p>
                </div>

                <div class="dashboard-cards">

                    <div class="dashboard-card">
                        <span>PERSONAGEM</span>
                        <strong>${game.character.name}</strong>
                        <small>${game.character.originLabel}</small>
                    </div>

                    <div class="dashboard-card">
                        <span>PARTIDO</span>
                        <strong>${game.party ? game.party.acronym : "SEM PARTIDO"}</strong>
                        <small>${game.party ? game.party.name : "Ainda não fundado"}</small>
                    </div>

                    <div class="dashboard-card">
                        <span>RECURSOS</span>
                        <strong>${formatMoney(game.money)}</strong>
                        <small>Recursos disponíveis</small>
                    </div>

                    <div class="dashboard-card">
                        <span>INFLUÊNCIA</span>
                        <strong>${game.influence}/100</strong>
                        <small>Influência política</small>
                    </div>

                </div>

                <div class="dashboard-message">

                    <h2>${dashboardTitle}</h2>

                    <p>${dashboardDescription}</p>

                    <small class="career-stage">
                        CICLO ${cycleNumber} · ETAPA ${stageNumber} DE ${starterEvents.length}
                    </small>

                    <div class="dashboard-actions">
                        <button id="open-region-map" class="btn-secondary">
                            MAPA DE AURORA
                        </button>

                        <button id="next-month" class="btn-primary">
                            AVANÇAR →
                        </button>
                    </div>

                </div>
            </section>
        `;

        $("#open-region-map", main).addEventListener("click", showRegionMap);
        $("#next-month", main).addEventListener("click", advanceToEvent);
    }

    /* ==========================================
       CONFIGURAÇÕES E MENU
    ========================================== */

    if (settingsButton && settingsModal) {
        settingsButton.addEventListener("click", () => {
            settingsModal.classList.remove("hidden");
        });
    }

    if (closeSettings && settingsModal) {
        closeSettings.addEventListener("click", () => {
            settingsModal.classList.add("hidden");
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener("click", event => {
            if (event.target === settingsModal) {
                settingsModal.classList.add("hidden");
            }
        });
    }

    if (newGameButton) {
        newGameButton.addEventListener("click", startNewGame);
    }

    if (continueButton) {
        continueButton.addEventListener("click", loadGame);
    }

    checkSave();

})();