import "./PageHeader.css";

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="page-header">
      {breadcrumb && (
        <nav className="breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={index}>
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              {item.link ? (
                <a href={item.link} className="breadcrumb-link">
                  {item.label}
                </a>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
