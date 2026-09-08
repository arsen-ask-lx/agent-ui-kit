// Содержимое страницы: показатели, график, таблица и лента событий.
// Всё нарочно плотно — на разреженном макете не видно, ради чего нужен
// указатель: когда элементов три, их можно описать словами.

export function StatDelta({ value }) {
  const up = value.startsWith("+");
  return <span className={up ? "delta up" : "delta down"}>{value}</span>;
}

export function StatCard({ label, value, delta, hint }) {
  return (
    <article className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        <StatDelta value={delta} />
      </div>
      <div className="stat-hint">{hint}</div>
    </article>
  );
}

export function StatRow() {
  return (
    <section className="stat-row">
      <StatCard label="Revenue" value="$48,120" delta="+12.4%" hint="vs. last week" />
      <StatCard label="Orders" value="1,284" delta="+3.1%" hint="vs. last week" />
      <StatCard label="Refunds" value="$1,940" delta="-8.0%" hint="vs. last week" />
      <StatCard label="Open tickets" value="37" delta="+22.5%" hint="needs attention" />
    </section>
  );
}

export function ChartBar({ height, label, muted }) {
  return (
    <div className="bar-slot">
      <div className={muted ? "bar is-muted" : "bar"} style={{ height: `${height}%` }} />
      <span className="bar-label">{label}</span>
    </div>
  );
}

export function ChartPanel() {
  const days = [
    ["Mon", 42], ["Tue", 58], ["Wed", 36], ["Thu", 74],
    ["Fri", 91], ["Sat", 48], ["Sun", 29],
  ];
  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <h2>Revenue this week</h2>
        <div className="segmented">
          <button type="button" className="seg is-on">7d</button>
          <button type="button" className="seg">30d</button>
          <button type="button" className="seg">90d</button>
        </div>
      </div>
      <div className="chart">
        {days.map(([label, height]) => (
          <ChartBar key={label} label={label} height={height} muted={label === "Sun"} />
        ))}
      </div>
    </section>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

export function RowActions() {
  return (
    <div className="row-actions">
      <button type="button" className="mini">Open</button>
      <button type="button" className="mini ghost">⋯</button>
    </div>
  );
}

export function OrderRow({ id, customer, total, status }) {
  return (
    <tr className="order-row">
      <td className="mono">{id}</td>
      <td>
        <div className="cell-user">
          <span className="avatar small">{customer.split(" ").map((p) => p[0]).join("")}</span>
          {customer}
        </div>
      </td>
      <td className="mono">{total}</td>
      <td><StatusPill status={status} /></td>
      <td><RowActions /></td>
    </tr>
  );
}

export function OrderTable() {
  const rows = [
    ["#10241", "Grace Hopper", "$1,240.00", "paid"],
    ["#10240", "Alan Turing", "$318.40", "pending"],
    ["#10239", "Katherine Johnson", "$2,910.00", "paid"],
    ["#10238", "Edsger Dijkstra", "$84.00", "failed"],
    ["#10237", "Barbara Liskov", "$640.25", "paid"],
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Latest orders</h2>
        <button type="button" className="mini ghost">Export</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.map(([id, customer, total, status]) => (
            <OrderRow key={id} id={id} customer={customer} total={total} status={status} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ActivityItem({ who, what, when }) {
  return (
    <li className="activity">
      <span className="avatar small">{who.split(" ").map((p) => p[0]).join("")}</span>
      <div>
        <div className="activity-text"><strong>{who}</strong> {what}</div>
        <div className="activity-when">{when}</div>
      </div>
    </li>
  );
}

export function ActivityFeed() {
  return (
    <aside className="panel side-panel">
      <div className="panel-head"><h2>Activity</h2></div>
      <ul className="activity-list">
        <ActivityItem who="Grace Hopper" what="refunded order #10238" when="2 min ago" />
        <ActivityItem who="Alan Turing" what="left a note on #10240" when="18 min ago" />
        <ActivityItem who="Ada Lovelace" what="changed payout schedule" when="1 h ago" />
        <ActivityItem who="Barbara Liskov" what="invited a teammate" when="3 h ago" />
      </ul>
    </aside>
  );
}
