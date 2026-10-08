import { useEffect, useState } from "react";

type EstadoRequisicao<T> =
  | { status: "carregando" }
  | { status: "sucesso"; dados: T }
  | { status: "erro"; mensagem: string };

export function useRequisicao<T>(
  buscar: (signal: AbortSignal) => Promise<T>,
): EstadoRequisicao<T> {
  const [estado, setEstado] = useState<EstadoRequisicao<T>>({
    status: "carregando ",
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelado = false;
    setEstado({ status: "carregando" });

    buscar(controller.signal)
      .then((dados) => {
        if (!cancelado) setEstado({ status: "sucesso", dados });
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        if (erro instanceof Error && erro.name === "AbortError") return;

        setEstado({
          status: "erro",
          mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
        });
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [buscar]);
  return estado;
}
