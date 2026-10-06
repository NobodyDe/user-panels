function DataTableHeader() {
  return (
    <header>
      <input
        type="text"
        name=""
        id=""
        placeholder="Buscar por nome ou e-mail"
        className=""
      />
    </header>
  );
}

export default function DataTable() {
  return (
    <div>
      <DataTableHeader />
    </div>
  );
}
