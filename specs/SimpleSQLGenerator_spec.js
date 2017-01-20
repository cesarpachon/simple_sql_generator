var SimpleSQL = require("../src/SimpleSQL.js");

describe("Select generation", function() {
  
  it("should generate select *", function() {
    var sample = "select * from MySchema.table1 as t1";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .select()
      .from("MySchema.table1", "t1")
      .toSQL();
      expect(sql).toBe(sample);
  });

  it("should generate select and single from", function() {
    var sample = "select t1.field1, t1.field2 as f2 from MySchema.table1 as t1";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .toSQL();
      expect(sql).toBe(sample);
  });

  it("should generate select with and and or where expresions", function() {
    var sample = "select t1.field1, t1.field2 as f2, t1.field3 from MySchema.table1 as t1";
    sample += " where t1.field > 0 and t1.field3 equals 'bar' or f2 is null";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2", "t1.field3"])
      .from("MySchema.table1", "t1")
      .where("t1.field", ">", 0)
      .and("t1.field3", "equals", "bar")
      .or("f2", "is", "null")
      .toSQL();
      expect(sql).toBe(sample);
  });
  
  it("should generate select with multiple tables and a join", function() {
    var sample = "select t1.field1, t1.field2 as f2 from MySchema.table1 as t1, MySchema.table2 as t2 where t1.field2 = t2.field2 and t1.field1 = 5 or t2.field2 is NULL";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .from("MySchema.table2", "t2")
      .where()
      .join("t1.field2", "t2.field2")
      .and("t1.field1", "=", 5)
      .or("t2.field2", "is", "NULL")
      .toSQL();
      expect(sql).toBe(sample);
  });

  it("should generate select with in, having and order by", function(){
    var sample = "select pic.idpicture, pic.name, pic.mime_type, pic.s3key, count(0) as relevance ";
    sample += "from MediaLib.pictures as pic, MediaLib.pictures_tags as tag ";
    sample += "where pic.idpicture = tag.idpicture and ";
    sample += "tag.tag in ('no_distraction', 'appliances', 'lamp') ";
    sample += "group by pic.idpicture, pic.name, pic.mime_type, pic.s3key ";
    sample += "having relevance = 3 ";
    sample += "order by relevance desc limit 100";
    var sqlgen = new SimpleSQL.Generator();
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
    expect(sql).toBe(sample);
  });
});

describe("Insert generation", function() {
  it("should support inserts with single field", function(){
   var sample = "insert into t1 (f1) values ('v1', 'v2', 'v3')";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .insertInto("t1", ["f1"])
      .values([{f1:"v1"}, {f1:"v2"}, {f1:"v3"}])
      .toSQL();
    expect(sql).toBe(sample);
  });
  
  it("should support inserts with multiple fields", function(){
   var sample = "insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))";
    var sqlgen = new SimpleSQL.Generator();
    var sql = sqlgen
      .insertInto("t1", ["f1", "f2"])
      .values([{f1:"v11", f2:"v12"}, {f1:"v21", f2:"v22"}])
      .toSQL();
    expect(sql).toBe(sample);
  });

  it("should support inserts with delayed fields", function(){
   var sample = "insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))";
    var sqlgen = new SimpleSQL.Generator();
    sqlgen
      .insertInto("t1", ["f1"]);
    var sql = sqlgen.insertInto(["f2"])
      .values([{f1:"v11", f2:"v12"}, {f1:"v21", f2:"v22"}])
      .toSQL();
      expect(sql).toBe(sample);
  });

  it("should support inserts with delayed values", function(){
   var sample = "insert into t1 (f1, f2) values (('v11', 'v12'), ('v21', 'v22'))";
    var sqlgen = new SimpleSQL.Generator();
    sqlgen
      .insertInto("t1", ["f1", "f2"])
      .values([{f1:"v11", f2:"v12"}]);
     var sql = sqlgen.values([{f1:"v21", f2:"v22"}])
      .toSQL();
    expect(sql).toBe(sample);
  });
  
  it("should support inserts with delayed fields and values", function(){
   var sample = "insert into t1 (f1, f2) values (('v11', 'v21'), ('v12', 'v22'))";
    var sqlgen = new SimpleSQL.Generator();
    sqlgen
      .insertInto("t1", ["f1"])
      .values([{f1:"v11"}, {f1: "v12"}]);
    sqlgen.insertInto(["f2"]);
    //passing no arguments will return the internal values array
    sqlgen.values().forEach(function(val, i){
      val.f2 = "v2"+(i+1);
    });
     var sql = sqlgen.toSQL();
    expect(sql).toBe(sample);
  });
});
    

