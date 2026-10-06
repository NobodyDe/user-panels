import DataTable from "./datatable/DataTable";
import Header from "./layout/Header";
import Title from "./layout/Title";

function App() {
  return (
    <main className="min-h-screen min-w-screen ">
      <Header />
      <div className="px-22 py-12">
        <Title />
        <DataTable />
      </div>
    </main>
  );
}

export default App;
