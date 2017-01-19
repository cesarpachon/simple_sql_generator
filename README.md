# simple_sql_generator
javascript simple SQL generator library

This is a small library in pure javascript, intended to assist with the building of SQL strings. No intentions of becoming an ORM!


##examples

###simple select

javascript: 
´´´
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .toSQL();
´´´
SQL: 

´´´
select t1.field1, t1.field2 as f2 from MySchema.table1 as t1
´´´

##tests
jasmine tests are located in the specs folder. 
run them with: 
jasmine-node specs/

