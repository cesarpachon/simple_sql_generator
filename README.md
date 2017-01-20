# simple_sql_generator
javascript simple SQL generator library

This is a small library in pure javascript, intended to assist with the building of SQL strings. No intentions of becoming an ORM!

##installation
this module can be installed via npm: 

```bash
npm install simple_sql_generator
```

##justification
my main need for writing this library was supporting the decorator pattern on my SQL queries.
in a decorator pattern, objects can be chained and each element in the chain can add or modify stuff without worring about what are doing the other elements.

a typical example is adding auditory to every field on a database: 
suppose you want to have organization_id, user_id in all your tables.. instead of adding those columns to every SQL sentence, you simply pass a object that represents the partially constructed query, and let other elements in the chain to add the required fields.

the key idea is that you should be able to remove the auditory element of the chain and the query still should be work (it should be SQL-valid, at least) 
also, the auditory element may follow rules, like affecting the values or organization_id and user_id based on the role.
i.e: 
- if role is superadmin, you won't add where filters because you want to get all the records.
- if the role is admin, you will add a where filter only for organization, but will return data of all users of the given organization.
- if the role is user, you will add both organization and user ids, returning a small subset of data. 

That's why you will find examples (specially at the insert section) where there is delayed insertion of fields and values: that is the feature that allowed me to implement auditory as a decorator pattern.  

##examples

###simple select

javascript: 

```javascript
  //load the module
  var SimpleSQL = require("SimpleSQL.js");
  //create a instance of the generator
  var sqlgen = new SimpleSQL.Generator();
  var sql = sqlgen
      .select()
      .from("MySchema.table1", "t1")
      .toSQL();
```

SQL: 

```SQL
select * from MySchema.table1 as t1
```
###select specifying fields

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


###select with simple join

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
  .having("relevance", "=", 3)
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
###simple insert

```javascript
var sql = sqlgen
  .insertInto("t1", ["f1"])
  .values([{f1:"v1"}, {f1:"v2"}, {f1:"v3"}])
  .toSQL();
```

```SQL
insert into t1 (f1) values ('v1', 'v2', 'v3')
```

###insert with multiple fields

```javascript
var sql = sqlgen
  .insertInto("t1", ["f1", "f2"])
  .values([{f1:"v11", f2:"v12"}, {f1:"v21", f2:"v22"}])
  .toSQL();
```

```SQL
 insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))
```
###insert with delayed fields

```javascript
sqlgen
  .insertInto("t1", ["f1"]);

//appending a new field before adding values
var sql = sqlgen.insertInto(["f2"])
  .values([{f1:"v11", f2:"v12"}, {f1:"v21", f2:"v22"}])
  .toSQL();
```

```SQL
insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))
```
###insert with delayed values

```javascript
sqlgen
  .insertInto("t1", ["f1", "f2"])
  .values([{f1:"v11", f2:"v12"}]);

  //appending more values, sometime later.. 
  var sql = sqlgen.values([{f1:"v21", f2:"v22"}])
  .toSQL();
```

```SQL
insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))
```
##tests

###insert with delayed fields and values

```javascript
//at this point, we only know a field, so we populate values with it.
sqlgen
  .insertInto("t1", ["f1"])
  .values([{f1:"v11"}, {f1: "v12"}]);

//later, we need to add a new field.. and set the new field on the existing values
sqlgen.insertInto(["f2"]);
//passing no arguments will return the internal values array
sqlgen.values().forEach(function(val, i){
  val.f2 = "v2"+(i+1);
});
 var sql = sqlgen.toSQL();
```

```SQL
insert into t1 (f1, f2) values (('v11', 'v21'), ('v12', 'v22'))
```
jasmine tests are located in the specs folder. 
run them with: 
jasmine-node specs/

