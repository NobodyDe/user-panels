import { columns } from "../constants/data";
import { ChevronLeft, ChevronRight, MoveVertical } from "lucide-react";
import BadgeIcon from "./BadgeIcon";
import Badge from "./Badge";
import Active from "./Active";
import type { User } from "../types/user";
import type { ListParams, Page } from "../api/api";

type DataTableProps = {
  estado: Page<User>;
  total: number;
  params: ListParams;
  onParamsChange: (mudanca: Partial<ListParams>) => void;
};

export default function DataTable({ estado, onParamsChange }: DataTableProps) {
  const users = estado.itens;
  const previosButtonDisabled = estado.pagina <= 1;
  const nextButtonDisabled = estado.pagina >= estado.totalPaginas;
  return (
    <div>
      <div className="rounded-xl border border-border">
        <table className="w-full min-w-[800px] border-collapse  text-left [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
          <thead className="rounded-xl">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th key={col.key}>
                  <div className="flex gap-2 items-center">
                    {col.title.toLocaleUpperCase()}
                    {col.order && (
                      <button className="">
                        <MoveVertical size={16} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user: User) => (
              <tr key={user.id} className="bg-superface">
                <td>
                  <div className="flex gap-2 items-center">
                    <BadgeIcon name={user.nome} />
                    {user.nome}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <Badge cargo={user.cargo} />
                </td>
                <td>{<Active status={user.status} />}</td>
                <td>{user.criadoEm}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="flex p-4 items-center justify-between">
          <div className="flex gap-1">
            <span className="text-text-foreground">Mostrando</span>
            <span>{`1 - ${estado.porPagina}`}</span>
            <span className="text-text-foreground">de</span>
            <span>{estado.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={previosButtonDisabled}
              onClick={() => onParamsChange({ pagina: estado.pagina - 1 })}
              className="rounded-lg border border-border flex p-2 bg-button items-center gap-2 px-4 disabled:border-border/20 disabled:bg-button/20 "
            >
              <ChevronLeft
                className={`size-4 ${previosButtonDisabled ? "text-white/10" : ""} `}
              />
              <span
                className={`font-semibold ${previosButtonDisabled ? "text-white/10 " : ""} `}
              >
                Anterior
              </span>
            </button>
            <span className="font-semibold text-text-foreground">{`Página ${estado.pagina} de ${estado.totalPaginas}`}</span>
            <button
              onClick={() => onParamsChange({ pagina: estado.pagina + 1 })}
              disabled={nextButtonDisabled}
              className="rounded-lg border border-border flex p-2 bg-button items-center gap-2 px-4 disabled:border-border/20 disabled:bg-button/20"
            >
              <ChevronRight
                className={`size-4 ${nextButtonDisabled ? "text-white/10" : ""} `}
              />
              <span
                className={`font-semibold ${nextButtonDisabled ? "text-white/10 " : ""} `}
              >
                Próxima
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
