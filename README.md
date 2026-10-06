# Projeto 02 — Painel de usuários (consumo de API REST)

**Foco:** `useEffect` com limpeza, estados de requisição, busca com debounce, cancelamento e componente genérico com TypeScript.

---

## O problema real

Toda tela administrativa é a mesma coisa: uma tabela com busca, ordenação e paginação resolvidas no servidor. E junto vem uma coleção de bugs clássicos:

- a cada tecla digitada sai uma requisição nova;
- o usuário digita "ana", depois "bruno", e **a resposta de "ana" chega por último** e sobrescreve a tela com o resultado errado;
- pesquisar estando na página 4 deixa a tela vazia;
- `loading`, `error` e `data` como três `useState` soltos acabam se contradizendo (carregando **e** com erro ao mesmo tempo).

Este projeto é sobre resolver os quatro.

---

## O que você vai treinar

| Conceito | Onde aparece |
|---|---|
| `useEffect` e sua **função de limpeza** | debounce e requisição |
| `AbortController` / `AbortSignal` | cancelar requisição antiga |
| Race condition e como evitar | o ponto central do projeto |
| Union discriminada para estado de request | `carregando \| sucesso \| erro` |
| Custom hooks (extrair lógica do componente) | `useDebounce`, `useRequisicao` |
| **Generics em componente TSX** | `<DataTable<T> />` |
| Função como prop (render prop) | coluna que sabe se desenhar |
| Estados que precisam ser resetados juntos | mudar a busca volta para a página 1 |

---

## Como criar o projeto

```bash
npm create vite@latest painel-usuarios -- --template react-ts
```

```bash
cd painel-usuarios && npm install && npm run dev
```

Você **não precisa de backend**. Escreva um `api.ts` que devolve dados fixos dentro de uma `Promise` com `setTimeout` — assim você simula latência e consegue sentir o loading e a race condition de verdade.

---

## Estrutura de arquivos sugerida

```
src/
├── tipos.ts
├── api.ts                     servidor falso, com atraso artificial
├── useDebounce.ts
├── useRequisicao.ts
├── componentes/
│   ├── DataTable.tsx          tabela genérica
│   └── Paginacao.tsx
└── PainelUsuarios.tsx         a tela que amarra tudo
```

---

## Tipos para começar

```ts
export type Cargo = 'admin' | 'editor' | 'leitor'

export type Usuario = {
  id: number
  nome: string
  email: string
  cargo: Cargo
  ativo: boolean
  criadoEm: string
}

// Envelope de paginação — o formato que a maioria das APIs REST devolve
export type Pagina<T> = {
  itens: T[]
  total: number
  pagina: number
  porPagina: number
}

export type CampoOrdenavel = 'nome' | 'email' | 'cargo' | 'criadoEm'
export type Direcao = 'asc' | 'desc'

export type ListagemParams = {
  pagina: number
  porPagina: number
  busca: string
  ordenarPor: CampoOrdenavel
  direcao: Direcao
}
```

O estado da requisição, que é o tipo mais importante do projeto:

```ts
export type EstadoRequisicao<T> =
  | { status: 'carregando' }
  | { status: 'sucesso'; dados: T }
  | { status: 'erro'; mensagem: string }
```

> **Por que não `{ carregando, erro, dados }`?** Porque com três campos soltos existem estados impossíveis: carregando com erro, dados velhos ao lado de um erro novo. Com a union, esses estados **não podem ser escritos**, e o TypeScript te obriga a tratar cada caso no JSX.

---

## Funcionalidades

### 1. API falsa com latência
Escreva `listarUsuarios(params, signal?)` que devolve uma `Promise<Pagina<Usuario>>`. Ela deve:
- filtrar por nome ou e-mail (ignorando maiúsculas);
- ordenar pelo campo e direção pedidos;
- fatiar o resultado conforme `pagina` e `porPagina`;
- responder depois de um `setTimeout` de uns 300ms;
- respeitar o `AbortSignal` — se ele for abortado, a promise rejeita com um erro cujo `name` é `'AbortError'`.

Crie uns 23 usuários fixos. Com 5 por página dá 5 páginas, o que já expõe erros de arredondamento.

### 2. Campo de busca com debounce
A busca só dispara requisição depois que o usuário para de digitar por 300ms. Use um hook `useDebounce(valor, 300)`.

### 3. Tabela genérica
Um componente `DataTable<T>` que **não sabe nada sobre usuário**. Ele recebe:

```ts
type Coluna<T> = {
  chave: string
  titulo: string
  ordenavel?: boolean
  renderizar: (linha: T) => React.ReactNode
}

type DataTableProps<T> = {
  colunas: Coluna<T>[]
  linhas: T[]
  chaveDaLinha: (linha: T) => string | number
  ordenacao: { chave: string; direcao: Direcao } | null
  onOrdenar: (chave: string) => void
  mensagemVazia?: string
}
```

Colunas marcadas como `ordenavel` viram botão no cabeçalho e mostram `▲` ou `▼` quando são a coluna ativa.

### 4. Ordenação
Clicar num cabeçalho ordenável: se já é a coluna atual, **inverte** a direção; se é outra coluna, começa em `asc`.

### 5. Paginação
Botões **Anterior** e **Próxima**, desabilitados nos extremos, e um texto "Página X de Y".

### 6. Estados de tela
- carregando: mostre um aviso;
- erro: mostre a mensagem e nada mais;
- sucesso com lista vazia: "Nenhum usuário encontrado";
- sucesso com dados: a tabela.

O **campo de busca fica sempre visível**, inclusive durante o carregamento.

---

## Regras de negócio

- Mudar o texto da busca **volta para a página 1**. Sem isso, pesquisar algo com 2 resultados estando na página 4 deixa a tela vazia.
- Clicar para ordenar também volta para a página 1.
- `totalPaginas = Math.max(1, Math.ceil(total / porPagina))` — com zero resultados ainda é "Página 1 de 1".
- Uma resposta de requisição **cancelada ou superada** nunca pode atualizar a tela.

---

## Passo a passo sugerido

**1. `useDebounce`** — seis linhas, e ensina a limpeza do `useEffect`:

```ts
export function useDebounce<T>(valor: T, atrasoMs: number): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(id)   // <- cancela o agendamento anterior
  }, [valor, atrasoMs])
  return atrasado
}
```

O `return` do efeito é a função de limpeza: o React a chama **antes** de rodar o efeito de novo. É ela que faz o debounce funcionar.

**2. `useRequisicao`** — o coração do projeto:

```ts
export function useRequisicao<T>(
  buscar: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): EstadoRequisicao<T>
```

Comportamento esperado:
1. começa em `{ status: 'carregando' }`;
2. promise resolvida vira `sucesso`, rejeitada vira `erro` com `erro.message`;
3. quando `deps` muda, volta para `carregando` e dispara de novo;
4. a resposta de uma requisição antiga é **descartada**;
5. erro com `name === 'AbortError'` é ignorado — foi você que cancelou, não é falha.

A estrutura:

```ts
useEffect(() => {
  const controller = new AbortController()
  let cancelado = false

  setEstado({ status: 'carregando' })
  buscar(controller.signal)
    .then((dados) => { if (!cancelado) setEstado({ status: 'sucesso', dados }) })
    .catch((erro) => {
      if (cancelado || erro.name === 'AbortError') return
      setEstado({ status: 'erro', mensagem: erro.message })
    })

  return () => { cancelado = true; controller.abort() }
}, deps)
```

**3. `Paginacao`** — puro cálculo, sem estado.

**4. `DataTable`** — o genérico.

**5. `PainelUsuarios`** — junta tudo. Aqui ficam os quatro `useState`: `busca`, `pagina`, `ordenarPor`, `direcao`.

---

## O ponto mais importante: por que o `AbortController` sozinho não basta

`controller.abort()` **pede** para a requisição parar, mas não garante que a promise não vá resolver. Um `fetch` que já foi respondido, um cliente HTTP que ignora o signal, um mock — qualquer um deles pode entregar o resultado mesmo assim.

A variável `cancelado`, capturada pelo closure **daquele** efeito específico, é o que realmente impede o `setState` atrasado. Cada execução do efeito tem a sua própria cópia dessa variável, e a limpeza marca só a dela.

Os dois existem por motivos diferentes: o `AbortController` economiza rede, a flag `cancelado` garante a correção da tela.

---

## Armadilhas

**Não coloque `buscar` nas dependências do efeito.** Ela é uma arrow function nova a cada renderização — o efeito rodaria para sempre. Quem controla o disparo é o array `deps`.

**Não desmonte o campo de busca durante o loading.** Se o `<input>` sai do DOM, ele perde o foco e o usuário não consegue digitar a segunda letra.

**`Math.ceil(0 / 5)` é 0.** Trate o caso de zero resultados.

**Genérico em arquivo `.tsx`:** escreva `function DataTable<T>(props: DataTableProps<T>)`. Com arrow function o parser confunde `<T>` com JSX e você precisaria de `<T,>` — mais um motivo para usar `function` aqui.

---

## Checklist de conclusão

- [ ] Digitar rápido no campo de busca dispara **uma** requisição, não uma por tecla
- [ ] Aumentar a latência da API falsa e digitar "a" e depois "b" rápido mostra o resultado de "b"
- [ ] Trocar a busca estando na página 3 volta para a página 1
- [ ] Clicar duas vezes no mesmo cabeçalho inverte a ordem
- [ ] Os botões de paginação ficam desabilitados na primeira e na última página
- [ ] Com zero resultados aparece "Página 1 de 1" e a mensagem de tabela vazia
- [ ] A `DataTable` não tem nenhuma menção ao tipo `Usuario` dentro dela
- [ ] Simular uma falha na API mostra a mensagem de erro

---

## Desafios extras

1. Guardar busca, página e ordenação na URL (`URLSearchParams` + `history.replaceState`), para que F5 mantenha o estado. É o que toda tela administrativa de verdade faz.
2. Mostrar os dados antigos enquanto recarrega, em vez de sumir com a tabela. Exige um quarto caso na union: `{ status: 'recarregando'; dados: T }`.
3. Refazer tudo com TanStack Query e comparar quanto código sumiu — você vai entender exatamente que problema essa biblioteca resolve.
