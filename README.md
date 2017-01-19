# simple_sql_generator
javascript simple SQL generator library

This is a small library in pure javascript, intended to assist with the building of SQL strings. No intentions of becoming an ORM!


##examples

###simple select

javascript: 

```javascript
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .toSQL();
```

SQL: 

```SQL
select t1.field1, t1.field2 as f2 from MySchema.table1 as t1
```

###simple join

javascript: 

```javascript
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .from("MySchema.table2", "t2")
      .where()
      .join("t1.field2", "t2.field2")
      .toSQL();
```

SQL: 

```SQL
select t1.field1, t1.field2 as f2 from MySchema.table1 as t1, MySchema.table2 as t2 where t1.field2 = t2.field2
```

##tests
jasmine tests are located in the specs folder. 
run them with: 
jasmine-node specs/

