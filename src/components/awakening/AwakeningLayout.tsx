import { Outlet } from "react-router-dom";
import AwakeningBottomNav from "./AwakeningBottomNav";

const AwakeningLayout = () => (
  <>
    <Outlet />
    <AwakeningBottomNav />
  </>
);

export default AwakeningLayout;
