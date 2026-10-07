import { columns, users } from "../constants/data";
import { DataTableHeader } from "./DataTableHeader";
import { MoveVertical } from "lucide-react";
import BadgeIcon from "./BadgeIcon";
import Badge from "./Badge";
import Active from "./Active";

export default function DataTable() {
  return (
    <div>
      <header>
        <DataTableHeader />
      </header>
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
            {users.map((user) => (
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
        <footer className="flex p-4">
          <div className="flex gap-1">
            <span className="text-text-foreground">Mostrando</span>
            <span>1-5</span>
            <span className="text-text-foreground">de</span>
            <span>23</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
