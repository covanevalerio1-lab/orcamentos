# Orçamento App — MVP

App móvel de controlo de orçamento e gastos mensais, feita com **React Native (Expo)** + **Firebase**.

## Funcionalidades incluídas

- Autenticação (registo/login por email e password)
- Registo manual de gastos (valor, categoria, nota, data)
- Registo semi-automático via SMS do M-Pesa (partilha nativa ou colar texto)
- Categorias predefinidas
- Definição de orçamento mensal (a UI de definir orçamento ainda falta — ver "Próximos passos")
- Dashboard com total gasto, barra de progresso e gráfico por categoria
- Histórico de gastos do mês

## Funcionalidade: Registo automático via M-Pesa (Moçambique)

A app reconhece SMS de confirmação do M-Pesa e pré-preenche o gasto automaticamente. Duas formas de usar:

1. **Partilha nativa (recomendado):** seleciona o SMS do M-Pesa no telemóvel → "Partilhar" → escolhe a app "Orçamento". Os dados (valor, data, destinatário) são extraídos automaticamente.
2. **Colar manualmente:** no ecrã "Novo gasto", cola o texto do SMS na caixa "Colar SMS do M-Pesa" e toca em "Ler".

O parser está em `src/services/mpesaParser.js` — como o formato exato dos SMS pode variar ligeiramente, pode ser necessário ajustar as expressões regulares depois de testares com os teus próprios SMS reais.

> **Importante:** a funcionalidade de partilha usa o pacote `expo-share-intent`, que é um **módulo nativo**. Isto significa que **não funciona no Expo Go** (a app genérica da loja) — precisas de criar uma **development build** própria (ver secção seguinte). Todas as outras funcionalidades da app continuam a funcionar normalmente no Expo Go.

### Criar a development build (necessário para a partilha funcionar)

Como o projeto agora tem um módulo nativo, usa o **EAS Build** da Expo (gratuito, corre na cloud — não precisa de Android Studio no teu portátil):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

Isto gera um `.apk` que instalas no telemóvel Android como uma app normal, substituindo o Expo Go. Depois corres `npx expo start --dev-client` e liga-te a essa build. Para iOS, o processo é semelhante mas requer conta de developer Apple (`eas build --platform ios`).

---

## Como correr o projeto (via GitHub Codespaces — recomendado para PCs mais fracos)

Se o teu computador tem pouca RAM (ex: 4GB), evita instalar tudo localmente. Usa o **GitHub Codespaces**, que corre o projeto na cloud e só precisas de um browser.

### 1. Criar o repositório
1. Cria uma conta em https://github.com (se ainda não tiveres)
2. Clica em **New repository**, dá um nome (ex: `orcamento-app`) e cria-o
3. Faz upload de todos estes ficheiros para esse repositório (arrasta a pasta toda para a página do GitHub, ou usa "Add file → Upload files")

### 2. Abrir o Codespace
1. No repositório, clica no botão verde **Code**
2. Separador **Codespaces** → **Create codespace on main**
3. Aguarda — abre um VS Code completo no browser, já com terminal

### 3. Instalar dependências e correr
No terminal do Codespace:
```bash
npm install
npx expo start --tunnel
```
Usa `--tunnel` (em vez do modo normal) porque o Codespace corre remotamente — o tunnel garante que o teu telemóvel consegue ligar-se ao servidor Expo através da internet.

Aparece um QR code no terminal — digitaliza com a app **Expo Go** no telemóvel e a app abre ao vivo.

> Nota: o plano gratuito do Codespaces inclui ~60 horas/mês, o que costuma ser suficiente para desenvolvimento pessoal.

---

## Como correr o projeto localmente (alternativa, requer mais RAM)

### 1. Pré-requisitos
- Node.js instalado (18+)
- Conta gratuita no [Firebase](https://console.firebase.google.com/)
- App **Expo Go** no telemóvel (ou emulador Android/iOS)

### 2. Instalar dependências
```bash
cd orcamento-app
npm install
```

### 3. Configurar o Firebase
1. Cria um projeto em https://console.firebase.google.com/
2. Ativa **Authentication** → método "Email/Password"
3. Ativa **Firestore Database** (modo de produção ou teste)
4. Nas definições do projeto, copia a configuração da app web
5. Cola os valores em `src/services/firebase.js` (substitui os "TODO")

### 4. Correr a app
```bash
npx expo start
```
Depois digitaliza o QR code com a app **Expo Go** no telemóvel, ou pressiona `a`/`i` para abrir num emulador.

## Estrutura do projeto
```
orcamento-app/
├── App.js                     # Navegação principal
├── src/
│   ├── screens/                # Ecrãs (Login, Dashboard, AddExpense, History)
│   ├── contexts/AuthContext.js # Gestão de autenticação
│   ├── services/
│   │   ├── firebase.js         # Configuração Firebase
│   │   └── expenses.js         # Funções de gastos e orçamentos (Firestore)
│   └── constants/categories.js # Categorias de gastos
```

## Próximos passos sugeridos

1. **Ecrã de definir orçamento mensal** — falta a UI (a função `setBudget` já existe em `services/expenses.js`)
2. **Regras de segurança do Firestore** — importante antes de lançar, para garantir que cada utilizador só acede aos seus próprios dados:
   ```
   match /expenses/{id} {
     allow read, write: if request.auth.uid == resource.data.userId;
   }
   ```
3. **Edição/eliminação de gastos**
4. **Notificações** quando se aproxima do limite do orçamento
5. **Integração Open Banking** (fase 2) — ver conversa para detalhes sobre Tink/GoCardless/Plaid

## Nota sobre custos
Firebase tem um plano gratuito generoso (Spark) suficiente para o MVP e testes iniciais.
