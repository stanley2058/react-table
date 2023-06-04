import { useEffect, useState } from "react";
import {
  TableBodyCellRenderer,
  TableData,
  TableHeadCellRenderer,
  useTable,
} from "./table";

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

function useTodoData() {
  const [todos, setTodos] = useState<Todo[]>([]);
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos")
      .then((res) => res.json())
      .then(setTodos);
  }, []);

  return todos;
}

const CompletedRenderer: TableBodyCellRenderer<Todo> = ({ data }, update) => {
  return (
    <input
      style={{ width: "100%" }}
      type="checkbox"
      checked={data.completed}
      onClick={() => {
        update({
          data: {
            ...data,
            completed: !data.completed,
          },
        });
      }}
    />
  );
};

function getIdRenderer(): TableHeadCellRenderer<Todo> {
  return (_, store) => (
    <span
      style={{ width: "100%" }}
      onClick={() => {
        store.set({
          sortBy: "id",
          sortDir: store.getValue("sortDir") === "DESC" ? "ASC" : "DESC",
        });
      }}
    >
      ID
    </span>
  );
}
function getTitleRenderer(): TableHeadCellRenderer<Todo> {
  return (_, store) => (
    <span
      style={{ width: "100%" }}
      onClick={() => {
        store.set({
          sortBy: "title",
          sortDir: store.getValue("sortDir") === "DESC" ? "ASC" : "DESC",
        });
      }}
    >
      Title
    </span>
  );
}

export default function App() {
  const todos = useTodoData();
  const [Table, updateFn] = useTable({
    data: todos,
    bodyRenderer: {
      completed: CompletedRenderer,
    },
    headRenderer: {
      id: getIdRenderer(),
      title: getTitleRenderer(),
    },
    sorter: {
      id: (a, b) => a.id - b.id,
      userId: (a, b) => a.userId - b.userId,
      title: (a, b) => a.title.localeCompare(b.title),
    },
  });
  useEffect(() => {
    updateFn({ data: todos });
  }, [todos]);

  return <div>{Table}</div>;
}
