export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  active: boolean;
  orderIndex: number;
  createdAt: string;
};

export type CategoryNode = CategoryRow & {
  level: 1 | 2 | 3;
  children: CategoryNode[];
};
