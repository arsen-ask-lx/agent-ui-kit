import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";
import { ActivityFeed, ChartPanel, OrderTable, StatRow } from "./parts/content.jsx";
import { SideNav, TopBar } from "./parts/shell.jsx";

// Пример нарочно похож на рабочее приложение: панель показателей, график,
// таблица заказов, лента событий. На разреженном макете смысл указателя не
// виден — три элемента можно описать и словами.

function Breadcrumbs() {
  return (
    <div className="crumbs">
      Workspace <span className="crumb-sep">/</span> Northwind{" "}
      <span className="crumb-sep">/</span> <strong>Overview</strong>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="page-head">
      <div>
        <Breadcrumbs />
        <h1>Overview</h1>
      </div>
      <div className="page-actions">
        <button type="button" className="button ghost">Filters</button>
        <button type="button" className="button primary">New order</button>
      </div>
    </div>
  );
}

function Content() {
  return (
    <main className="content">
      <PageHeader />
      <StatRow />
      <div className="split">
        <ChartPanel />
        <ActivityFeed />
      </div>
      <OrderTable />
    </main>
  );
}

function Dashboard() {
  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <SideNav />
        <Content />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
