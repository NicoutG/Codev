import { Outlet } from "react-router-dom";
import Header from "./Header";
import "../../styles/theme.css";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        <div className="main-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
