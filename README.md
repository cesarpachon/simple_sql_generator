# simple_sql_generator
javascript simple SQL generator library

This is a small library in pure javascript, intended to assist with the building of SQL strings. No intentions of becoming an ORM!

##installation
this module can be installed via npm: 

```bash
npm install simple_sql_generator
```

##examples

###simple select

javascript: 

```javascript
  //load the module
  var SimpleSQL = require("SimpleSQL.js");
  //create a instance of the generator
  var sqlgen = new SimpleSQL.Generator();
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
select t1.field1, t1.field2 as f2 
from MySchema.table1 as t1, MySchema.table2 as t2 
where t1.field2 = t2.field2
```

###select with explicit first where clause, "and" and "or":

```javascript
var sql = sqlgen
  .select(["t1.field1", "t1.field2 as f2", "t1.field3"])
  .from("MySchema.table1", "t1")
  .where("t1.field", ">", 0)
  .and("t1.field3", "equals", "bar")
  .or("f2", "is", "null")
```

```SQL
select t1.field1, t1.field2 as f2, t1.field3 
from MySchema.table1 as t1
where t1.field > 0 and t1.field3 equals 'bar' or f2 is null
```
###select with in, having, group by, order by, limit

```javascript
var sql = sqlgen
  .select(["pic.idpicture", "pic.name", "pic.mime_type", "pic.s3key", "count(0) as relevance"])
  .from("MediaLib.pictures", "pic")
  .from("MediaLib.pictures_tags", "tag")
  .where()
  .join("pic.idpicture", "tag.idpicture")
  .in("tag.tag", ["no_distraction", "appliances", "lamp"])
  .groupBy(["pic.idpicture", "pic.name", "pic.mime_type", "pic.s3key"])
  .having("relevance = 3")
  .orderBy("relevance", "desc")
  .limit(100)
  .toSQL();
```

```SQL
select pic.idpicture, pic.name, pic.mime_type, pic.s3key, count(0) as relevance 
from MediaLib.pictures as pic, MediaLib.pictures_tags as tag  
where pic.idpicture = tag.idpicture 
and  tag.tag in ('no_distraction', 'appliances', 'lamp') 
group by pic.idpicture, pic.name, pic.mime_type, pic.s3key 
having relevance = 3 
order by relevance desc 
limit 100
```


##tests
jasmine tests are located in the specs folder. 
run them with: 
jasmine-node specs/

