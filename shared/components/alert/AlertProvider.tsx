import type { PropsWithChildren } from "react";
import AlertModal from "./AlertModal";

const AlertProvider: React.FC<PropsWithChildren> = ({ children }) => (
  <>
    {children}
    <AlertModal />
  </>
);

export default AlertProvider;
