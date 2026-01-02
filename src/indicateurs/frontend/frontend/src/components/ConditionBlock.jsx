import Block from "./Block";

export default function ConditionBlock({ conds, setConds }) {
  function addSimple() {
    setConds([...conds, { col: "", op: "=", value: "" }]);
  }

  return (
    <Block title="Conditions">
      {conds.map((c, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          <input
            placeholder="Colonne"
            value={c.col}
            onChange={e => {
              const newConds = [...conds];
              newConds[i].col = e.target.value;
              setConds(newConds);
            }}
          />
          <select
            value={c.op}
            onChange={e => {
              const newConds = [...conds];
              newConds[i].op = e.target.value;
              setConds(newConds);
            }}
          >
            {["=", "!=", "<", "<=", ">", ">="].map(op => <option key={op}>{op}</option>)}
          </select>
          <input
            placeholder="Valeur"
            value={c.value}
            onChange={e => {
              const newConds = [...conds];
              newConds[i].value = e.target.value;
              setConds(newConds);
            }}
          />
        </div>
      ))}
      <button onClick={addSimple}>Ajouter condition</button>
    </Block>
  );
}
