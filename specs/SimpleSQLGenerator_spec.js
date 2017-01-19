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

});
    

