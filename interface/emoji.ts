export interface Image {
  path: string;
  width: number;
  id: number;
  height: number;
  desc: Desc
}

type Desc = string | null
