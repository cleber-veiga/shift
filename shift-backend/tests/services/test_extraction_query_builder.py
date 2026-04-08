import unittest

from app.models.data_source import DataSourceType
from app.services.extraction_query_builder import build_paginated_custom_sql


class BuildPaginatedCustomSqlTests(unittest.TestCase):
    def test_postgresql_wraps_with_limit_offset(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.POSTGRESQL,
            user_sql="SELECT id, name FROM customers",
            batch_size=100,
            offset=200,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT id, name FROM customers) AS user_query LIMIT 100 OFFSET 200",
        )

    def test_mysql_wraps_with_limit_offset(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.MYSQL,
            user_sql="SELECT * FROM products",
            batch_size=50,
            offset=0,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT * FROM products) AS user_query LIMIT 50 OFFSET 0",
        )

    def test_sqlite_wraps_with_limit_offset(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.SQLITE,
            user_sql="SELECT * FROM logs",
            batch_size=10,
            offset=30,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT * FROM logs) AS user_query LIMIT 10 OFFSET 30",
        )

    def test_sqlserver_uses_offset_fetch(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.SQLSERVER,
            user_sql="SELECT col1 FROM t",
            batch_size=20,
            offset=40,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT col1 FROM t) AS user_query "
            "ORDER BY (SELECT NULL) OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY",
        )

    def test_oracle_uses_offset_fetch(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.ORACLE,
            user_sql="SELECT col1 FROM t",
            batch_size=25,
            offset=75,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT col1 FROM t) user_query OFFSET 75 ROWS FETCH NEXT 25 ROWS ONLY",
        )

    def test_removes_trailing_semicolon_and_whitespace(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.POSTGRESQL,
            user_sql=" SELECT * FROM users;  \n",
            batch_size=5,
            offset=10,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT * FROM users) AS user_query LIMIT 5 OFFSET 10",
        )

    def test_removes_multiple_trailing_semicolons(self) -> None:
        sql = build_paginated_custom_sql(
            source_type=DataSourceType.MYSQL,
            user_sql="SELECT * FROM users;;;",
            batch_size=3,
            offset=6,
        )
        self.assertEqual(
            sql,
            "SELECT * FROM (SELECT * FROM users) AS user_query LIMIT 3 OFFSET 6",
        )

    def test_raises_for_unsupported_source_type(self) -> None:
        with self.assertRaises(ValueError):
            build_paginated_custom_sql(
                source_type=DataSourceType.SNOWFLAKE,
                user_sql="SELECT 1",
                batch_size=10,
                offset=0,
            )

    def test_raises_for_empty_sql(self) -> None:
        with self.assertRaises(ValueError):
            build_paginated_custom_sql(
                source_type=DataSourceType.POSTGRESQL,
                user_sql=" ;  ",
                batch_size=10,
                offset=0,
            )


if __name__ == "__main__":
    unittest.main()
