
var SimpleSQL = require("../src/SimpleSQL.js");

/*
 * just a bunch of more sample queries to be sure 
 * all works as expected
 */
describe("Sample queries 02", function() {

  it("should match the query 1", function(){
   var sample = "select idpicture, avg(score) as total_score, count(0) as total_comments ";
   sample += "from picture_comments where idpicture in (0, 1, 2) group by idpicture order by idpicture desc limit 100"; 
   var sqlgen = new SimpleSQL.Generator();
   var sql = sqlgen.select(["idpicture", "avg(score) as total_score", "count(0) as total_comments"])
     .from("picture_comments")
     .where()
     .in("idpicture", [0, 1, 2])
     .groupBy(["idpicture"])
     .orderBy("idpicture", "desc")
     .limit(100)
     .toSQL();
   expect(sql).toBe(sample);
  });
  it("should match the query 2", function(){
   var sample = "insert into picture_comments (idpicture, score, comment) values (890, 20, 'not so good')";
   var sqlgen = new SimpleSQL.Generator();
   var sql = sqlgen
     .insertInto("picture_comments", ["idpicture", "score", "comment"])
     .values([{idpicture: 890, score: 20, comment:"not so good"}])
     .toSQL();
   expect(sql).toBe(sample);
  });
});
