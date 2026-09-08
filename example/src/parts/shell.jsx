// Каркас приложения. Компоненты нарочно разделены мелко и названы так, как
// называют их в настоящих проектах: в заметке видна цепочка вроде
// `Dashboard › Content › StatRow › StatCard › StatDelta`, и по ней строка
// в исходнике находится одним поиском.

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark" />
      <strong>Northwind</strong>
    </div>
  );
}

export function SearchBox() {
  return (
    <label className="search">
      <span className="search-icon">⌕</span>
      <input placeholder="Search orders, customers, invoices…" readOnly />
      <kbd>/</kbd>
    </label>
  );
}

export function NotificationBell({ count }) {
  return (
    <button type="button" className="icon-button">
      ✻{count > 0 && <span className="dot">{count}</span>}
    </button>
  );
}

export function Avatar({ name }) {
  const initials = name.split(" ").map((part) => part[0]).join("");
  return <span className="avatar">{initials}</span>;
}

export function TopBar() {
  return (
    <header className="topbar">
      <Logo />
      <SearchBox />
      <div className="topbar-right">
        <NotificationBell count={4} />
        <Avatar name="Ada Lovelace" />
      </div>
    </header>
  );
}

export function NavItem({ icon, label, badge, active }) {
  return (
    <button type="button" className={active ? "nav-item is-active" : "nav-item"}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

export function NavGroup({ title, children }) {
  return (
    <div className="nav-group">
      <div className="nav-group-title">{title}</div>
      {children}
    </div>
  );
}

export function SideNav() {
  return (
    <nav className="sidenav">
      <NavGroup title="Workspace">
        <NavItem icon="◉" label="Overview" active />
        <NavItem icon="▤" label="Orders" badge="128" />
        <NavItem icon="◫" label="Products" />
        <NavItem icon="☺" label="Customers" />
      </NavGroup>
      <NavGroup title="Money">
        <NavItem icon="≡" label="Invoices" badge="9" />
        <NavItem icon="↯" label="Payouts" />
        <NavItem icon="⌗" label="Taxes" />
      </NavGroup>
      <NavGroup title="Settings">
        <NavItem icon="⚙" label="Team" />
        <NavItem icon="⛨" label="Permissions" />
      </NavGroup>
    </nav>
  );
}
