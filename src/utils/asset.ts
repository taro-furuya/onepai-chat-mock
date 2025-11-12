// public/ 配下のファイルを、Viteの base に追従するURLで返す
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
