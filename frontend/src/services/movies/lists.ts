export type UserListItem = {
  id: string;
  title: string;
  img?: string;
  type: 'movie' | 'series';
  provider?: string;
};

export type UserList = {
  id: string;
  name: string;
  items: UserListItem[];
};

const KEY = 'phimhub:lists';

function load(): UserList[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(lists: UserList[]) {
  localStorage.setItem(KEY, JSON.stringify(lists));
}

export const ListsService = {
  getAll(): UserList[] {
    return load();
  },
  create(name: string): UserList {
    const lists = load();
    const list: UserList = { id: `l${Date.now()}`, name, items: [] };
    lists.push(list);
    save(lists);
    return list;
  },
  getOrCreateDefault(): UserList {
    const lists = load();
    if (lists.length) return lists[0];
    return this.create('Danh sách 1');
  },
  addItem(listId: string, item: UserListItem): void {
    const lists = load();
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx === -1) return;
    const exists = lists[idx].items.some((x) => x.id === item.id && x.type === item.type);
    if (!exists) {
      lists[idx].items.unshift(item);
      save(lists);
    }
  },
  removeItem(listId: string, itemId: string): void {
    const lists = load();
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx === -1) return;
    lists[idx].items = lists[idx].items.filter((x) => x.id !== itemId);
    save(lists);
  },
  rename(listId: string, name: string): void {
    const lists = load();
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx === -1) return;
    lists[idx].name = name;
    save(lists);
  },
  removeList(listId: string): void {
    const lists = load().filter((l) => l.id !== listId);
    save(lists);
  }
};


