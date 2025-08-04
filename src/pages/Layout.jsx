import { Navbar } from "../components/Navbar";
import { Outlet } from "react-router-dom";

export const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};
