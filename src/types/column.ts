import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  title: string;
  order?: boolean;
  render: (row: T) => ReactNode;
};
