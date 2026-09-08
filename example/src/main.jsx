import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

// Имена компонентов — это то, что плагин читает с узла и кладёт в заметку.
// Здесь они нарочно осмысленные: в заметке будет видно
// `App › Rail › RoomList › RoomRow`, и по такой цепочке строка находится сразу.

function RoomRow({ name, unread }) {
  return (
    <button type="button" className="room">
      <span className="room-name">{name}</span>
      {unread > 0 && <span className="badge">{unread}</span>}
    </button>
  );
}

function RoomList() {
  return (
    <div className="rooms">
      <RoomRow name="# general" unread={0} />
      <RoomRow name="# design" unread={3} />
      <RoomRow name="# releases" unread={12} />
    </div>
  );
}

function Rail() {
  return (
    <aside className="rail">
      <div className="rail-title">Channels</div>
      <RoomList />
    </aside>
  );
}

function Message({ who, text }) {
  return (
    <div className="message">
      <div className="who">{who}</div>
      <div className="text">{text}</div>
    </div>
  );
}

function Thread() {
  return (
    <main className="thread">
      <Message who="Ada" text="The channel list slides under the profile instead of scrolling." />
      <Message who="Grace" text="Point at it and say so — the note goes straight to NOTES.md." />
    </main>
  );
}

function App() {
  return (
    <div className="app">
      <header className="head">
        <strong>agent-ui-kit</strong>
        <span className="hint">
          hold <kbd>Alt</kbd>, click an element, type what is wrong, press <kbd>Enter</kbd>
        </span>
      </header>
      <div className="body">
        <Rail />
        <Thread />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
