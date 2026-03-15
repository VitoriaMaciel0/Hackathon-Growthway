## 🖥️ Frontend Stack

O frontend do **Flueet** foi desenvolvido utilizando tecnologias modernas voltadas para aplicações web rápidas e escaláveis.

A aplicação utiliza **React + TypeScript + Vite** para garantir uma experiência de desenvolvimento eficiente, tipagem segura e alto desempenho no carregamento da interface.

### Tecnologias utilizadas

- **React** — construção da interface e componentes da aplicação  
- **TypeScript** — tipagem estática para maior segurança e manutenção do código  
- **Vite** — bundler e servidor de desenvolvimento rápido  
- **Client tipado para API REST** — comunicação estruturada com os serviços de backend e IA  
- **Deploy na Vercel** — hospedagem da aplicação web com suporte a proxy server-side

O frontend é responsável por toda a experiência do usuário, incluindo autenticação, fluxo de diagnóstico, visualização de progresso e interação com o sistema de treinamento.

---

# 🤖 Experiência com IA (Interface)

Embora a lógica de inteligência artificial seja executada nos serviços de backend, o **frontend do Flueet é responsável por orquestrar toda a experiência de interação com a IA**.

A interface permite que o usuário realize uma sessão de diagnóstico por voz e visualize os resultados gerados pela análise.

### 🎤 Sessão de diagnóstico

Durante o diagnóstico inicial, o usuário interage por voz com um agente conversacional. A interface captura a interação e exibe a conversa em tempo real.

Após a sessão, o sistema apresenta ao usuário um **relatório estruturado de desempenho**, incluindo:

- análise de **pronúncia**
- avaliação de **fluência**
- uso de **vocabulário**
- correções de **gramática**

Essas informações são exibidas na interface em formato de **scorecards e feedback textual**, permitindo ao usuário entender claramente seus pontos fortes e pontos de melhoria.

---

# 📚 Plano de Aprendizado Personalizado

Com base no diagnóstico inicial, o sistema gera um **currículo de aprendizado personalizado**, que é apresentado ao usuário diretamente na interface da plataforma.

O frontend organiza esse plano em um fluxo visual de sessões de prática, normalmente entre **6 e 8 atividades**, cada uma focada em corrigir um aspecto específico da comunicação detectado durante o diagnóstico.

Cada sessão apresentada na interface possui:

- objetivo pedagógico específico
- foco em uma habilidade detectada no diagnóstico
- ordem progressiva de dificuldade
- acompanhamento de conclusão

A progressão não é genérica: cada usuário recebe um caminho único baseado no seu desempenho.

---

# 📊 Acompanhamento de Progresso

O frontend também apresenta as telas de acompanhamento da evolução do usuário, permitindo visualizar:

- sessões concluídas
- progresso nas lições
- histórico de atividades
- feedback recebido ao longo do tempo

Essas informações ajudam o usuário a acompanhar sua evolução dentro da plataforma.

---

# 🧠 Evolução Contínua do Treinamento

A cada sessão concluída, novos feedbacks são exibidos na interface, refletindo a evolução do usuário ao longo do uso da plataforma.

Com isso, o usuário consegue visualizar:

- melhorias alcançadas
- padrões de erros recorrentes
- próximos pontos de foco no aprendizado

Essa abordagem cria um ciclo contínuo de prática, análise e evolução dentro da experiência do produto.

---

# 🎯 Papel do Frontend no Flueet

O frontend do Flueet funciona como a **camada de experiência e interação do usuário**, conectando a interface de treinamento com os serviços de análise e geração de conteúdo pedagógico.

Ele é responsável por:

- gerenciar o fluxo de uso da plataforma
- apresentar os resultados gerados pela IA
- organizar o plano de aprendizado
- acompanhar a evolução do usuário ao longo do tempo
