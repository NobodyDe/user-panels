import { users } from "../constants/data";
import type { User } from "../types/user";

export interface ListParams {
  busca: string;
  pagina: number;
  porPagina: number;
  ordenarPor: string;
  direcao: "asc" | "desc";
}

function filter(users: User[], search: string): User[] {
  const normalizeSearch = search.toLowerCase().trim() as string;

  return (
    users.filter(
      (user) =>
        user.nome.toLowerCase().includes(normalizeSearch) ||
        user.nome.toLowerCase().includes(normalizeSearch),
    ) ?? users
  );
}

console.log(filter(users, "")); // 24
console.log(filter(users, "  ANA ").length); // igual ao de "ana"
console.log(filter(users, "zzz")); // []

// export function ListUsers(params: ListParams, signal?): Promise<Page<User[]>> {
//   const filtrados = filter(users, params.busca);
//   setTimeout(() => {}, 300);
// }
