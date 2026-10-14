import { useCallback, useState } from "react";
import { ListUsers, type ListParams } from "./api/api";
import DataTable from "./datatable/DataTable";
import Header from "./layout/Header";
import Title from "./layout/Title";
import { useRequisicao } from "./hooks/useRequisição";
import { DataTableHeader } from "./datatable/DataTableHeader";

const INITIALS_PARAMS: ListParams = {
  busca: "",
  pagina: 1,
  porPagina: 5,
  ordenarPor: "nome",
  direcao: "asc",
};

function App() {
  const [params, setParams] = useState<ListParams>(INITIALS_PARAMS);
  const buscarUsuarios = useCallback(
    (signal: AbortSignal) => ListUsers(params, signal),
    [params],
  );
  const estado = useRequisicao(buscarUsuarios);
  const estadoCarregando = { status: "carregando" };

  function changeParams(mudanca: Partial<ListParams>) {
    setParams((anterior) => ({ ...anterior, ...mudanca }));
  }
  return (
    <main className="min-h-screen min-w-screen ">
      <Header />
      <div className="px-22 py-12 flex flex-col gap-4">
        <Title />
        <header>
          <DataTableHeader
            onSearch={(search: string) =>
              changeParams({ busca: search, pagina: 1 })
            }
            buscaAtual={params.busca}
          />
        </header>

        <DataTable
          estado={estado}
          params={params}
          onParamsChange={changeParams}
        />
      </div>
    </main>
  );
}

export default App;
