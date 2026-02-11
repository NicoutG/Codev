from app.utils.normalization import normalize_text_value


class JsonToSqlTranslator:
    def __init__(self, spec: dict):
        self.spec = spec

    # ---------- PUBLIC ----------
    def to_sql(self) -> str:
        select_clauses = []
        group_by_clauses = []

        for col in self.spec.get("colonnes", []):
            if col["type"] == "group_by":
                expr = self._expr(col.get("expr"))
                select_clauses.append(f"{expr} AS \"{col['titre']}\"")
                group_by_clauses.append(expr)
            elif col["type"] == "case":
                case_sql = self._case(col)
                select_clauses.append(f"{case_sql} AS \"{col['titre']}\"")
                group_by_clauses.append(case_sql)
            elif col["type"] == "aggregation":
                expr = self._aggregation_expr(col.get("expr", {}))
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
        tables = self.spec.get("sujet", {}).get("tables", [])
        if not tables:
            raise ValueError("Aucune table dans le sujet")
        if len(tables) == 1:
            return f"FROM {tables[0]}"
        join_sql = tables[0]
        for t in tables[1:]:
            join_sql = f"{join_sql} JOIN {t} ON {tables[0]}.id_polytech = {t}.id_polytech"
        return "FROM " + join_sql

    def _where(self) -> str | None:
        conditions = self.spec.get("sujet", {}).get("conditions")
        if not conditions:
            return None
        return "WHERE " + self._condition(conditions)

    def _group_by(self, clauses: list[str]) -> str | None:
        if not clauses:
            return None
        return "GROUP BY " + ", ".join(clauses)

    # ---------- EXPRESSIONS ----------
    def _expr(self, expr) -> str:
        if expr is None:
            return "NULL"
        if isinstance(expr, (int, float)):
            return str(expr)
        if isinstance(expr, bool):
            return "TRUE" if expr else "FALSE"
        if isinstance(expr, str):
            normalized = normalize_text_value(expr)
            escaped = normalized.replace("'", "''")
            return f"'{escaped}'"
        if isinstance(expr, dict) and "col" in expr:
            return expr["col"]
        raise ValueError(f"Expression inconnue : {expr}")

    # ---------- AGGREGATIONS ----------
    def _aggregation_expr(self, expr: dict) -> str:
        if not expr:
            return "NULL"

        if "op" in expr:
            args = [
                self._aggregation_expr(arg) if isinstance(arg, dict) else self._expr(arg)
                for arg in expr.get("args", [])
            ]
            op = expr["op"]
            if op == "/" and len(args) == 2 and args[0].replace(".", "", 1).isdigit() and float(args[0]) == 100:
                args[0] = "100.0"
            return "(" + f" {op} ".join(args) + ")"

        elif "agg" in expr:
            return self._aggregation(expr)

        else:
            return self._expr(expr)

    def _aggregation(self, agg: dict) -> str:
        func = agg.get("agg", "").upper()  # sum, avg, min, max, count...
        col = agg.get("col", "1")

        subject = agg.get("subject") or {}
        tables = subject.get("tables", [])
        conditions = subject.get("conditions")

        if tables:
            from_clause = ", ".join(tables)
            where_clause = f" WHERE {self._condition(conditions)}" if conditions else ""
            return f"(SELECT {func}({col}) FROM {from_clause}{where_clause})"

        condition = agg.get("condition") or None
        if not condition:
            return f"{func}({col})"

        cond_sql = self._condition(condition)
        return f"{func}(CASE WHEN {cond_sql} THEN {col} END)"

    # ---------- CASE ----------
    def _case(self, col: dict) -> str:
        parts = ["CASE"]
        for c in col["cases"]:
            when = self._condition(c["when"])
            label_norm = normalize_text_value(c["label"])
            label_escaped = label_norm.replace("'", "''")
            then = f"'{label_escaped}'"
            parts.append(f"  WHEN {when} THEN {then}")
        parts.append("END")
        return " ".join(parts)

    # ---------- CONDITIONS ----------
    def _condition(self, cond) -> str:
        if not cond:
            return "1=1"

        if isinstance(cond, list):
            if not cond:
                return "1=1"
            return "(" + " AND ".join(self._condition(c) for c in cond) + ")"
        if "and" in cond:
            return "(" + " AND ".join(self._condition(c) for c in cond["and"]) + ")"
        if "or" in cond:
            return "(" + " OR ".join(self._condition(c) for c in cond["or"]) + ")"

        for op, values in cond.items():
            left, right = values

            left_is_col = isinstance(left, dict) and "col" in left
            right_is_col = isinstance(right, dict) and "col" in right

            left_expr = self._expr(left) if left_is_col or isinstance(left, str) else str(left)
            right_expr = self._expr(right) if right_is_col or isinstance(right, str) else str(right)

            # NULL handling
            if right is None or right_expr.upper() in ("NONE", "NULL"):
                if op in ("=", "=="):
                    return f"{left_expr} IS NULL"
                elif op in ("!=", "<>"):
                    return f"{left_expr} IS NOT NULL"
                else:
                    return f"{left_expr} IS NOT NULL"

            # LIKE handling
            if op in ("like", "LIKE"):
                if not right_expr.startswith("'") or not right_expr.endswith("'"):
                    normalized = normalize_text_value(str(right))
                    escaped = normalized.replace("'", "''")
                    right_expr = f"'{escaped}'"
                return f"{left_expr} ILIKE {right_expr}"
            elif op in ("not_like", "NOT_LIKE"):
                if not right_expr.startswith("'") or not right_expr.endswith("'"):
                    normalized = normalize_text_value(str(right))
                    escaped = normalized.replace("'", "''")
                    right_expr = f"{escaped}"
                return f"{left_expr} NOT ILIKE {right_expr}"

            # Nouvelle logique : "=" ou "!=" avec % devient ILIKE / NOT ILIKE
            if op in ("=", "==", "!=", "<>"):
                is_like = False
                if isinstance(right, str) and "%" in right:
                    normalized = normalize_text_value(str(right))
                    escaped = normalized.replace("'", "''")
                    right_expr = f"'{escaped}'"
                    is_like = True
                elif isinstance(left, str) and "%" in left:
                    normalized = normalize_text_value(str(left))
                    escaped = normalized.replace("'", "''")
                    left_expr = f"'{escaped}'"
                    is_like = True

                if is_like:
                    if op in ("=", "=="):
                        return f"{left_expr} ILIKE {right_expr}"
                    elif op in ("!=", "<>"):
                        return f"{left_expr} NOT ILIKE {right_expr}"

            # opérateurs classiques
            if op == "==":
                op = "="
            elif op == "!=":
                op = "<>"

            return f"{left_expr} {op} {right_expr}"

        raise ValueError(f"Condition inconnue : {cond}")
