class JsonToSqlTranslator:
    def __init__(self, spec: dict):
        self.spec = spec

    # ---------- PUBLIC ----------
    def to_sql(self) -> str:
        select_clauses = []
        group_by_clauses = []

        for col in self.spec["colonnes"]:
            if col["type"] == "group_by":
                expr = self._expr(col["expr"])
                select_clauses.append(f"{expr} AS \"{col['titre']}\"")
                group_by_clauses.append(expr)
            elif col["type"] == "case":
                case_sql = self._case(col)
                select_clauses.append(f"{case_sql} AS \"{col['titre']}\"")
                group_by_clauses.append(case_sql)
            elif col["type"] == "aggregation":
                expr = self._aggregation_expr(col["expr"])
                select_clauses.append(f"{expr} AS \"{col['titre']}\"")

        from_clause = self._from()
        where_clause = self._where()
        group_by_clause = self._group_by(group_by_clauses)

        sql = "SELECT\n  " + ",\n  ".join(select_clauses)
        sql += "\n" + from_clause
        if where_clause:
            sql += "\n" + where_clause
        if group_by_clause:
            sql += "\n" + group_by_clause

        return sql + ";"

    # ---------- FROM / WHERE ----------
    def _from(self) -> str:
        tables = self.spec["sujet"]["tables"]
        if len(tables) == 1:
            return f"FROM {tables[0]}"
        join_sql = tables[0]
        for t in tables[1:]:
            join_sql = f"{join_sql} JOIN {t} ON {tables[0]}.idEtudiant = {t}.idEtudiant"
        return "FROM " + join_sql

    def _where(self) -> str | None:
        conditions = self.spec["sujet"].get("conditions")
        if not conditions:
            return None
        return "WHERE " + self._condition(conditions)

    def _group_by(self, clauses: list[str]) -> str | None:
        if not clauses:
            return None
        return "GROUP BY " + ", ".join(clauses)

    # ---------- EXPRESSIONS ----------
    def _expr(self, expr) -> str:
        if isinstance(expr, (int, float)):
            return str(expr)
        if isinstance(expr, bool):
            return "1" if expr else "0"
        if isinstance(expr, str):
            return f"'{expr}'"
        if isinstance(expr, dict) and "col" in expr:
            return expr["col"]
        raise ValueError(f"Expression inconnue : {expr}")

    # ---------- AGGREGATIONS ----------
    def _aggregation_expr(self, expr: dict) -> str:
        if "op" in expr:
            args = [
                self._aggregation_expr(arg) if isinstance(arg, dict) else self._expr(arg)
                for arg in expr["args"]
            ]
            op = expr["op"]
            if op == "/" and len(args) == 2 and args[0].replace('.', '', 1).isdigit() and float(args[0]) == 100:
                args[0] = "100.0"
            return "(" + f" {op} ".join(args) + ")"
        elif "agg" in expr:
            return self._aggregation(expr)
        else:
            return self._expr(expr)

    def _aggregation(self, agg: dict) -> str:
        func = agg["agg"].upper()
        col = agg.get("col", "1")

        subject = agg.get("subject")
        if subject:
            tables = subject.get("tables", [])
            conditions = subject.get("conditions")
            from_clause = ", ".join(tables)
            where_clause = ""
            if conditions:
                where_clause = " WHERE " + self._condition(conditions)
            return f"(SELECT {func}({col}) FROM {from_clause}{where_clause})"

        condition = agg.get("condition")
        if not condition or condition == []:
            # Aucun filtre → COUNT(1) ou autre agrégat simple
            return f"{func}({col})"

        # Agrégation avec condition
        cond_sql = self._condition(condition)
        return f"{func}(CASE WHEN {cond_sql} THEN {col} END)"

    # ---------- CASE ----------
    def _case(self, col: dict) -> str:
        parts = ["CASE"]
        for c in col["cases"]:
            when = self._condition(c["when"])
            then = f"'{c['label']}'"
            parts.append(f"  WHEN {when} THEN {then}")
        parts.append("END")
        return " ".join(parts)

    # ---------- CONDITIONS ----------
    def _condition(self, cond: dict) -> str:
        if not cond:
            return "1=1"  # Pas de condition → vrai
        if isinstance(cond, list):
            # Liste vide ou liste de conditions → AND
            if not cond:
                return "1=1"
            return "(" + " AND ".join(self._condition(c) for c in cond) + ")"
        if "and" in cond:
            return "(" + " AND ".join(self._condition(c) for c in cond["and"]) + ")"
        if "or" in cond:
            return "(" + " OR ".join(self._condition(c) for c in cond["or"]) + ")"
        for op, values in cond.items():
            left, right = values
            left_expr = self._expr(left) if isinstance(left, dict) or isinstance(left, str) else str(left)
            right_expr = self._expr(right) if isinstance(right, dict) or isinstance(right, str) else str(right)
            
            # Gérer les comparaisons avec NULL
            if right is None or right_expr.upper() == "NONE" or right_expr.upper() == "NULL":
                if op == "=" or op == "==":
                    return f"{left_expr} IS NULL"
                elif op == "!=" or op == "<>":
                    return f"{left_expr} IS NOT NULL"
                else:
                    # Pour les autres opérateurs avec NULL, utiliser IS NULL/IS NOT NULL
                    return f"{left_expr} IS NOT NULL"
            
            # Gérer les opérateurs spéciaux
            if op == "==":
                op = "="
            elif op == "!=":
                op = "<>"
            
            return f"{left_expr} {op} {right_expr}"
        raise ValueError(f"Condition inconnue : {cond}")
