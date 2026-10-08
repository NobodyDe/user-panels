# Guia — API falsa com latência (Funcionalidade 1)

Guia de estudo para construir `listarUsuarios(params, signal?)` em `src/api/api.ts`.

---

## Sumário

1. [O objetivo](#1-o-objetivo)
2. [E o `fetch`?](#2-e-o-fetch)
3. [Anatomia do `listarUsuarios`](#3-anatomia-do-listarusuarios)
4. [De onde vem a busca: o `params`](#4-de-onde-vem-a-busca-o-params)
5. [Etapa A — filtrar](#5-etapa-a--filtrar)
6. [Etapa B — ordenar](#6-etapa-b--ordenar)
7. [Etapa C — fatiar](#7-etapa-c--fatiar)
8. [Etapa D — latência e abort](#8-etapa-d--latência-e-abort)
9. [Tipos necessários](#9-tipos-necessários)
10. [Erros encontrados na primeira versão](#10-erros-encontrados-na-primeira-versão)
11. [Como testar sem tela](#11-como-testar-sem-tela)
12. [Checklist](#12-checklist)

---

## 1. O objetivo

`listarUsuarios(params, signal?)` devolve uma `Promise<Pagina<Usuario>>` e deve:

- filtrar por nome ou e-mail (ignorando maiúsculas);
- ordenar pelo campo e direção pedidos;
- fatiar conforme `pagina` e `porPagina`;
- responder depois de um `setTimeout` de ~300ms;
- respeitar o `AbortSignal`: se abortado, rejeitar com um erro cujo `name` é `'AbortError'`.

---

## 2. E o `fetch`?

A assinatura do hook no README é:

```ts
useRequisicao<T>(buscar: (signal: AbortSignal) => Promise<T>, deps)
```

**O hook não sabe — e não deve saber — se existe `fetch`.** Ele só recebe "uma função que aceita um signal e devolve uma Promise". Quem sabe de onde os dados vêm é a camada `api.ts`.

```
PainelUsuarios ──► useRequisicao ──► listarUsuarios(params, signal)
                   (não sabe nada)       │
                                         ├─ hoje:   setTimeout + array fixo
                                         └─ amanhã: fetch('/api/usuarios?...', { signal })
```

Por isso a regra de rejeitar com `name === 'AbortError'`: **é exatamente o que o `fetch` faz** quando o signal é abortado. A API falsa **imita o contrato do `fetch`**. Quando existir backend, você troca só o miolo de `listarUsuarios` — hook e tela não mudam. Isso é separação de responsabilidades.

Como ficaria a versão real, no futuro:

```ts
const resposta = await fetch(`/api/usuarios?${query}`, { signal })
if (!resposta.ok) throw new Error(`Erro ${resposta.status}`) // fetch NÃO rejeita em 404/500!
return resposta.json()
```

> **Quer `fetch` real já agora?** A ferramenta é o **MSW (Mock Service Worker)**: intercepta o `fetch` no navegador e tem `delay()` para simular latência. Neste projeto, a recomendação é seguir com a função falsa para enxergar cada peça; MSW fica como desafio extra.

---

## 3. Anatomia do `listarUsuarios`

É uma linha de montagem — cada etapa recebe o resultado da anterior:

```
usuarios ─► filtrar(busca) ─► ordenar(campo, direção) ─► fatiar(página) ─► esperar 300ms ─► resolve
                                                                                │
                                                       signal abortado? ─► reject(AbortError)
```

Cada etapa é uma função pequena e **pura** (recebe uma lista, devolve uma lista). O `listarUsuarios` só encadeia:

```ts
export function listarUsuarios(params: ListagemParams, signal?: AbortSignal) {
  const filtrados = filtrar(usuarios, params.busca)
  const ordenados = ordenar(filtrados, params.ordenarPor, params.direcao)
  const itens = fatiar(ordenados, params.pagina, params.porPagina)
  // ... Promise com setTimeout que resolve { itens, total, pagina, porPagina }
}
```

---

## 4. De onde vem a busca: o `params`

A API **nunca** lê o `<input>`. Ela não sabe que existe tela, React ou campo de texto. Ela recebe um objeto dizendo o que fazer:

```
<input> ──► useState busca ──► useDebounce ──► params.busca ──► listarUsuarios
 (tela)       (componente)      (hook)          (objeto)          (api.ts)
```

O `PainelUsuarios` guarda o texto e monta o objeto na chamada:

```ts
listarUsuarios({ pagina, porPagina: 5, busca: buscaAtrasada, ordenarPor, direcao }, signal)
```

Dentro da API, pegue com desestruturação:

```ts
const { busca, pagina, porPagina, ordenarPor, direcao } = params
```

O `params` faz o papel da query string de um backend real (`/api/usuarios?busca=ana&pagina=1`).

### E se o usuário não buscar nada?

Não precisa de tratamento especial. Teste no console (F12):

```js
"ana beatriz souza".includes("")   // true — toda string contém a string vazia
```

Com `busca = ""`, todos passam no filtro. **A paginação não sabe se houve busca** — ela fatia a lista que receber:

| busca   | depois do filtro | página 1 | `total` | páginas na tela               |
|---------|------------------|----------|---------|-------------------------------|
| `""`    | 24               | 5 itens  | 24      | 5                             |
| `"ana"` | 2+ *             | ...      | ...     | ...                           |
| `"zzz"` | 0                | `[]`     | 0       | 1 (pelo `Math.max(1, ...)`)   |

\* "Ana" também está dentro de "Mari**ana**" — o `includes` traz mais gente do que parece. Não é bug.

### Dois cuidados

1. **Espaços:** `" ana"` com espaço não casa com nada. Use `.trim()` na busca.
2. **Busca nova estando na página 4:** isso **não** é problema da API. É regra do componente: mudar a busca volta `pagina` para 1. A API apenas obedece ao `params`; pedir a página 4 de uma lista com 2 itens devolve `itens: []`, sem erro — e está certo.

---

## 5. Etapa A — filtrar

### Como pensar a função

Toda função pequena começa com três perguntas:

| Pergunta          | Resposta                                                   |
|-------------------|------------------------------------------------------------|
| O que entra?      | a lista de usuários e o texto da busca                     |
| O que sai?        | uma lista de usuários (talvez menor)                       |
| Qual o trabalho?  | manter só quem tem a busca no nome ou no e-mail            |

A assinatura sai direto da tabela:

```ts
function filtrar(lista: User[], busca: string): User[] {
  // passo 1: normalizar a busca (uma vez só)
  // passo 2: devolver a lista filtrada
}
```

### Por que cada decisão

1. **Receber a lista como parâmetro** (em vez de importar lá dentro) deixa a função **pura**: o resultado depende só do que entra, e dá para testar com 3 usuários inventados.
2. **Receber só `busca: string`**, não o `params` inteiro: peça só o que você usa.
3. **Normalizar a busca antes do `.filter()`**: o `.filter()` roda uma vez por usuário. Converter a busca lá dentro repete o mesmo trabalho 24 vezes. Faça uma vez e guarde numa constante (`termo`).
4. **Os campos do usuário também precisam de `.toLowerCase()`**: `"Ana Beatriz".includes("ana")` é `false` por causa do "A" maiúsculo. Os dois lados precisam estar no mesmo formato.

### Peças para montar

- `.trim()` e `.toLowerCase()` na busca;
- `lista.filter((usuario) => ...)`;
- dentro do filter: `nome` **contém** termo `||` `email` **contém** termo, cada um com `.toLowerCase().includes(termo)`.

São 2 linhas de corpo. **Sem ternário** — a busca vazia já funciona sozinha.

---

## 6. Etapa B — ordenar

- **Armadilha:** `.sort()` **muta o array original**. Ordenar o array importado direto estraga o "banco" para as próximas chamadas. Trabalhe numa cópia (`[...lista]` ou `.toSorted()`). Repare que o `.filter()` da etapa A já devolve um array novo — pense se isso basta.
- Textos com acento (Olívia, Vinícius): `a.localeCompare(b, 'pt-BR')`.
- `criadoEm` está em ISO (`2024-02-14`): **ordem alfabética = ordem cronológica**, então o mesmo `localeCompare` resolve.
- Direção: calcule o resultado em `asc` e multiplique por `-1` quando for `desc`.

---

## 7. Etapa C — fatiar

```
inicio = (pagina - 1) * porPagina
.slice(inicio, inicio + porPagina)
```

**Erro comum:** o `total` da resposta é o tamanho **depois do filtro e antes do fatiamento**. Se usar o tamanho da fatia, a paginação mostra sempre "Página 1 de 1".

---

## 8. Etapa D — latência e abort

O `setTimeout` **não devolve Promise** — ele só agenda e segue em frente. É preciso embrulhá-lo:

```ts
return new Promise((resolve, reject) => {
  // 1. já chegou abortado? rejeita na hora
  // 2. agenda o resolve para daqui a 300ms (guarde o id do timeout!)
  // 3. escuta o evento 'abort' do signal: limpa o timeout e rejeita
})
```

O erro com o `name` certo, do mesmo tipo que o navegador usa:

```ts
new DOMException('Requisição cancelada', 'AbortError')
```

Dica: `signal.addEventListener('abort', fn, { once: true })`.

### Perguntas para responder ao escrever

1. Por que checar `signal.aborted` **antes** de agendar? Num signal que já chega abortado, o evento `abort` dispararia de novo?
2. Por que `clearTimeout` ao abortar, se o `reject` já resolveu a Promise? Pense em quem continua rodando.
3. O `signal` é opcional (`signal?`). O que acontece com `signal.addEventListener` quando ele é `undefined`? Dica: `?.`

---

## 9. Tipos necessários

```ts
export type CampoOrdenavel = 'nome' | 'email' | 'cargo' | 'criadoEm'
export type Direcao = 'asc' | 'desc'

export type ListagemParams = {
  pagina: number
  porPagina: number
  busca: string
  ordenarPor: CampoOrdenavel
  direcao: Direcao
}

export type Pagina<T> = {
  itens: T[]
  total: number
  pagina: number
  porPagina: number
}
```

O retorno é `Promise<Pagina<User>>` — **não** `Pagina<User[]>`, porque `itens` já é `T[]`; com `User[]` viraria `User[][]` (lista de listas).

---

## 10. Erros encontrados na primeira versão

Versão revisada:

```ts
function filter(users: User[], search: string): User[] {
  const normalizeSearch = search.toLowerCase().trim() as string;

  const find = users.includes(normalizeSearch)
    ? users.filter((user) => user.nome || user.email === normalizeSearch)
    : users;
  return find;
}
```

Rastreando `filter(users, "ana")`:

### `users.includes(normalizeSearch)`
`users` é uma lista de **objetos**. A pergunta feita é "a lista contém a string `"ana"`?" — sempre `false`. O ternário sempre cai em `: users` e **nada é filtrado**. O TypeScript acusa erro aqui (`string` não é `User`). E o ternário nem precisa existir: `"x".includes("")` já resolve a busca vazia.

### `user.nome || user.email === normalizeSearch`
- **Precedência:** `===` é avaliado antes de `||`. O JS lê `user.nome || (user.email === normalizeSearch)`. Como `user.nome` é uma string não vazia (*truthy*), **todo mundo passa**.
- **`===` não é "contém":** `user.email === "ana"` só é verdadeiro se o e-mail for exatamente `"ana"`. O certo é `.includes()` **na string do campo**:
  ```ts
  user.nome.toLowerCase().includes(termo)
  ```
- Faltava `.toLowerCase()` nos campos do usuário.

### `as string`
`.toLowerCase().trim()` já devolve `string` — o `as` não faz nada. Cuidado com o hábito: `as` **cala** o TypeScript, e quando ele reclama quase sempre está certo.

### Nomes
- `normalizeSearch` soa como ação (verbo), mas é um valor → `term` / `termo`.
- O parâmetro `users` tem o mesmo nome do `users` importado (*shadowing*) → use `list` / `lista`.
- `ListUsers` em PascalCase é convenção de componente/tipo → função comum é camelCase: `listarUsuarios` / `listUsers`.

### Outros pontos

| Problema                         | Por quê                                                                                      |
|----------------------------------|----------------------------------------------------------------------------------------------|
| `"dsc"`                          | O padrão é `"desc"`. Quando a tela mandar `"desc"`, nada casa.                               |
| `ordenarPor: string`             | Aceita até `"batata"`. Use a union `CampoOrdenavel`.                                         |
| `ListParamsProps`                | Sufixo `Props` é para props de **componente**. Aqui é `ListParams`.                          |
| `signal?` sem tipo               | Vira `any` implícito. O tipo é `AbortSignal`.                                                |
| `Page<User[]>`                   | `Page` não existe ainda e o certo é `Page<User>`.                                            |
| Função sem `return`              | O `setTimeout` solto não devolve Promise.                                                    |
| Dados em `constants/data.tsx`    | Os usuários (o "banco") estão junto das colunas com JSX. Vale separar dados de interface.    |

---

## 11. Como testar sem tela

Antes de ligar no React, teste a função isolada (um `console.log` temporário no `main.tsx`):

```ts
// filtro
console.log(filtrar(usuarios, "").length)       // 24
console.log(filtrar(usuarios, "  ANA ").length) // igual ao de "ana"
console.log(filtrar(usuarios, "zzz"))           // []

// API completa
listarUsuarios({ pagina: 1, porPagina: 5, busca: 'ana', ordenarPor: 'nome', direcao: 'asc' })
  .then(console.log)

// abort
const c = new AbortController()
listarUsuarios({ pagina: 1, porPagina: 5, busca: '', ordenarPor: 'nome', direcao: 'asc' }, c.signal)
  .catch((e) => console.log(e.name)) // "AbortError"
c.abort()
```

Casos a conferir:
- página 5 com 5 por página → **4** itens (24 usuários);
- busca `"zzz"` → `itens: []`, `total: 0`;
- `"ANA"` acha o mesmo que `"ana"`.

> Dica: rode os testes do filtro **na versão com bug** antes de corrigir — os três devolvem 24. É assim que se prova que o bug existe.

---

## 12. Checklist

- [ ] Tipos `Pagina`, `ListagemParams`, `CampoOrdenavel`, `Direcao` criados
- [ ] `filtrar` — 2 linhas, sem ternário, `.includes()` nos campos
- [ ] `ordenar` — trabalha numa cópia, usa `localeCompare`, respeita a direção
- [ ] `fatiar` — `(pagina - 1) * porPagina`
- [ ] `total` calculado depois do filtro, antes do fatiamento
- [ ] `listarUsuarios` devolve uma `Promise` que resolve após ~300ms
- [ ] Abort: rejeita na hora se já abortado; `clearTimeout` + `reject` ao abortar
- [ ] Erro de abort tem `name === 'AbortError'`
- [ ] Respondidas as três perguntas da etapa D
