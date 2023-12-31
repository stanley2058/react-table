import { useEffect, useRef, useState } from "react";
import {
  TableBodyCellRenderer,
  TableHeadCellRenderer,
  useTable,
} from "./table";
import { v4 } from "uuid";

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
      .then((todos: Todo[]) => {
        const arr: Todo[] = [];
        for (let i = 0; i < 50; i++) {
          for (let j = 0; j < todos.length; j++) {
            const todo = structuredClone(todos[j]);
            todo.id = i * todos.length + j;
            arr.push(todo);
          }
        }
        setTodos(arr);
      });
  }, []);

  return todos;
}

const Completed: TableBodyCellRenderer<Todo> = (_, data, update) => (
  <input
    style={{ width: "100%" }}
    type="checkbox"
    checked={data.completed}
    onChange={(e) => {
      update({
        ...data,
        completed: e.target.checked,
      });
    }}
  />
);

let desc = true;
const TitleRenderer: TableHeadCellRenderer<Todo> = (core) => {
  return (
    <span
      onClick={() => {
        core.updateFn.updateAll(
          Array.from(core.data).sort(
            (a, b) => a.data.title.localeCompare(b.data.title) * (desc ? 1 : -1)
          )
        );
        desc = !desc;
      }}
    >
      Title
    </span>
  );
};
const IdRenderer: TableHeadCellRenderer<Todo> = (core) => {
  return (
    <span
      style={{ width: "80px", display: "inline-block" }}
      onClick={() => {
        core.updateFn.updateAll(
          Array.from(core.data).sort(
            (a, b) => (a.data.id - b.data.id) * (desc ? 1 : -1)
          )
        );
        desc = !desc;
      }}
    >
      ID
    </span>
  );
};

let selected = false;
const CompletedRenderer: TableHeadCellRenderer<Todo> = (core) => {
  return (
    <span
      onClick={() => {
        selected = !selected;
        core.updateFn.updateAll(
          Array.from(core.data).map((d) => ({
            id: v4(),
            data: { ...d.data, completed: selected },
          }))
        );
      }}
    >
      Completed
    </span>
  );
};

let reset = false;
const UserIdRenderer: TableHeadCellRenderer<Todo> = (core) => {
  return (
    <span
      onClick={() => {
        if (reset) {
          core.updateFn.resetToInitial();
        } else {
          core.updateFn.updateAll(
            Array.from(core.data).filter((d) => d.data.userId === 1)
          );
        }
        reset = !reset;
      }}
    >
      UserId
    </span>
  );
};

export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const todos = useTodoData();
  const { table, recalculateDisplayable } = useTable(todos, {
    viewportRef: ref,
    virtualScrollInitial: 10,
    virtualScrollOffset: 25,
    virtualScrollElementMarginTop: 30,
    virtualScrollElementMarginBottom: 30,
    tableName: "todo",
    bodyRenderer: {
      completed: Completed,
    },
    headRenderer: {
      title: TitleRenderer,
      id: IdRenderer,
      completed: CompletedRenderer,
      userId: UserIdRenderer,
    },
    headers: ["completed", "userId", "id", "title"],
  });

  return (
    <div
      ref={ref}
      onScroll={recalculateDisplayable}
      style={{
        maxHeight: "100vh",
        overflow: "auto",
      }}
    >
      {table}
    </div>
  );
}
