var SQLGen = require("../src/SimpleSQLGenerator.js");

describe("Select generation", function() {
  
  it("should generate select and single from", function() {
    var sample = "select t1.field1, t1.field2 as f2 from MySchema.table1 as t1";
    var sqlgen = new SQLGen.SimpleSQLGenerator();
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .toSQL();
      expect(sql).toBe(sample);
  });
  
  it("should generate select with multiple tables and a join", function() {
    var sample = "select t1.field1, t1.field2 as f2 from MySchema.table1 as t1, MySchema.table2 as t2 where t1.field2 = t2.field2";
    var sqlgen = new SQLGen.SimpleSQLGenerator();
    var sql = sqlgen
      .select(["t1.field1", "t1.field2 as f2"])
      .from("MySchema.table1", "t1")
      .from("MySchema.table2", "t2")
      .where()
      .join("t1.field2", "t2.field2")
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
    var sqlgen = new SQLGen.SimpleSQLGenerator();
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
    expect(sql).toBe(sample);
  });

});
    

