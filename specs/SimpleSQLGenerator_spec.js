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
});
    

