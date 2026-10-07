import type { User } from "../types/user";

export function ListUsers(params, signal?): Promise<Page<User[]>> {
  setTimeout(() => {}, 300);
}
