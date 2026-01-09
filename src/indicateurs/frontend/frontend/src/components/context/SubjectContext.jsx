import { createContext, useContext } from "react";

const SubjectContext = createContext({
  sujet: { tables: [], conditions: null },
  setSujet: () => {}
});

export function useSubject() {
  return useContext(SubjectContext);
}

// Provider global pour l’indicateur
export function SubjectProvider({ sujet, setSujet, children }) {
  return (
    <SubjectContext.Provider value={{ sujet, setSujet }}>
      {children}
    </SubjectContext.Provider>
  );
}
