export type Cargo = "admin" | "editor" | "leitor";

type UserStatus = "ativo" | "inativo" | "pendente";

export type User = {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
  status: UserStatus;
  criadoEm: string; // ISO 8601, formato que costuma vir da API/PostgreSQL
};
