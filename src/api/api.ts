import { users } from "../constants/data";
import type { User } from "../types/user";

type Page<T> = {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
};

export interface ListParams {
  busca: string;
  pagina: number;
  porPagina: number;
  ordenarPor: SortParams["field"];
  direcao: "asc" | "desc";
}

function filter(users: User[], search: string): User[] {
  const termo = search.trim().toLowerCase();

  return users.filter(
    (user) =>
      user.nome.toLowerCase().includes(termo) ||
      user.email.toLowerCase().includes(termo),
  );
}

type SortParams = {
  list: User[];
  field: "nome" | "email" | "cargo" | "criadoEm";
  direction: "asc" | "desc";
};
function sort({ list, field, direction }: SortParams) {
  return list.toSorted((a, b) => {
    const resultado = a[field].localeCompare(b[field], "pt-br");
    return direction === "asc" ? resultado : -resultado;
  });
}

type PaginationtParams = {
  list: User[];
  page: number;
  perPage: number;
};

function pagination({ list, page, perPage }: PaginationtParams) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return list.slice(start, end);
}

console.log(filter(users, "")); // 24
console.log(filter(users, "  ANA ").length); // igual ao de "ana"
console.log(filter(users, "zzz")); // []

export function ListUsers(params: ListParams, signal?): Promise<Page<User[]>> {
  const filtrados = filter(users, params.busca);
  const order = sort({
    list: filtrados,
    field: params.ordenarPor,
    direction: params.direcao,
  });
  const itens = pagination({
    list: order,
    page: params.pagina,
    perPage: params.porPagina,
  });

  const page: Page<User> = {
    itens,
    total: filtrados.length,
    pagina: params.pagina,
    porPagina: params.porPagina,
  };

  return new Promise((resolve, reject) => {
    const erroCancelamento = () =>
      new DOMException("Requisição cancelada", "AbortError");
    if (signal?.aborted) {
      reject(erroCancelamento());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancelar);
      resolve(page);
    }, 300);

    function cancelar() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancelar);
      reject(erroCancelamento());
    }
    signal?.addEventListener("abort", cancelar, { once: true });
  });
}
