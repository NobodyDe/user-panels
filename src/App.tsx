import { useCallback } from "react";
import { ListUsers, type ListParams } from "./api/api";
import DataTable from "./datatable/DataTable";
import Header from "./layout/Header";
import Title from "./layout/Title";
import { useRequisicao } from "./hooks/useRequisição";

const PARAMS: ListParams = {
  busca: "",
  pagina: 1,
  porPagina: 5,
  ordenarPor: "nome",
  direcao: "asc",
};

function App() {
  const buscarUsuarios = useCallback(
    (signal: AbortSignal) => ListUsers(PARAMS, signal),
    [],
  );
  const estado = useRequisicao(buscarUsuarios);
  return (
    <main className="min-h-screen min-w-screen ">
      <Header />
      <div className="px-22 py-12">
        <Title />
        {estado.status === "carregando" && <p>Carregando usuários...</p>}
        {estado.status === "erro" && <p>Erro: {estado.mensagem}</p>}
        {estado.status === "sucesso" && (
          <DataTable users={estado.dados.itens} />
        )}
      </div>
    </main>
  );
}

export default App;
