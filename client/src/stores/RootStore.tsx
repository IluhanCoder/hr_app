

import React, { createContext, useContext } from "react";
import authStore from "./AuthStore";

class RootStore {
  authStore = authStore;
}

const rootStore = new RootStore();

const StoreContext = createContext(rootStore);

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within StoreProvider");
  }
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
};

export default rootStore;
