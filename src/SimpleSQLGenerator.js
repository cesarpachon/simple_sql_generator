"use strict"; 
/**
 * array to comma separated list.
 * if quoted, strings will be quoted.
 */
function _arrayToCSL(values, quoted){
  var s = ""; 
  values.forEach(function(val, i, col){
    var separator = (i < col.length-1)?", ":" ";
    s += quoted?_q(val):val;
    s += separator;
  });
  return s; 
};

/*
 * enclose val in quotes if is a string
 * */
function _q(val){
 return val instanceof String? "'"+val+"'": val; 
}

/**
 * returns "a" = "b" 
 */ 
function _join(params){
  return _q(params.a) + " = " + _q(params.b); 
};

/**
 * if params is an array, 
 * returns "field" in ("value1", "value2", .. )
 * if params is an string, assume it is a subquery
 * and append like this: in (params) 
 */
function _in(params){
  if(typeof params === "string")
  {
    return " in ( " + params + " ) ";
  }
  else
  {
    var s = _q(params.field) + " in (";
    s += _arrayToCSL(params.values, true);
    s += ")";
    return s; 
  }
};

//returns list of "name" [as "alias"]. use with reduce.
function _from(ac, el, i, col){
    var s = ac + el.name; 
    if(el.alias){
      s += " as ";
      s += el.alias;
    }
    s += (i < col.length -1)?", ":" ";
    return s; 
}

var SimpleSQLGenerator = function(){
  this.operation = null; 
  this.fields = [];
  this.tables = [];
  this.wheres = []; //array of where expresions (objects) 
  this.havings = []; //array of having expresions (just strings) 
  this.group_by = []; //array of fields
  this.order_by = []; //array of fields 
};

/**
 * @param fields: {Array} of strings
 */
SimpleSQLGenerator.prototype.select = function(fields){
  var _self = this; 
  this.operation = "select"; 
  fields.forEach(function(field){
    _self.fields.push(field); 
  });
  return this; 
};

SimpleSQLGenerator.prototype.from= function(table_name, alias){
  this.tables.push({
    name: table_name,
    alias: alias
  });
  return this; 
};

/**
 * if no params, do nothing, but helps to visualize better the query chaining
 * if params, add expresion as a literal. 
 * can be called many times. 
*/
SimpleSQLGenerator.prototype.where= function(expresion){
  //this.wheres = [];
  if(expresion){
    this.wheres.push({
      exp: expresion   
    });
  }
  return this;
};

SimpleSQLGenerator.prototype.join= function(a, b){
  this.wheres.push({
       a: a,
       b: b,
       exp: _join
  });
  return this;
};

/**
 * @param field: {String}
 * @param values: {Array}
 */ 
SimpleSQLGenerator.prototype.in = function(field, values){
  this.wheres.push({
    field: field,
    values: values,
    exp: _in
  });
  return this;
};

/*
 * 
 */
SimpleSQLGenerator.prototype.groupBy= function(fields){
 this.group_by = fields; 
 return this; 
};

//adds an expresion to the having clause
SimpleSQLGenerator.prototype.having = function(expresion){
 this.havings.push(expresion);
 return this; 
};


/**
 * fields: array of fields
 * mode: "desc", "asc" or null.
 * limit: numeric limit. optional
 */ 
SimpleSQLGenerator.prototype.orderBy = function(fields, mode){
  this.order_by.push({
    fields: fields,
    mode: mode
  });
  return this; 
};

SimpleSQLGenerator.prototype.limit = function(limit){
  this.limit = limit;
  return this;
};

/*
 * generate a SQL string using the current state of the object.  
 */
SimpleSQLGenerator.prototype.toSQL = function(){
  var sql = ""; 
  sql += this.operation + " ";
  sql += _arrayToCSL(this.fields);

  sql += "from "  + this.tables.reduce(_from, "");
  

  if(this.wheres.length){
    sql += "where ";
    sql += this.wheres.map(function(params, i, wheres){
      var s = "";
      if(params.exp instanceof Function){
        s += params.exp(params);
      }else{
        s += params;
      }
      s += (i<wheres.length-1?" and ":"");
      return s;
    });
    sql += " ";
  }
  if(this.group_by.length){
    sql += "group by ";
    sql += _arrayToCSL(this.group_by);
    sql += " ";
  }
  if(this.havings.length){
    
  }
  if(this.order_by.length){
    sql += "order by ";
    sql += _arrayToCSL(this.order_by);
    sql += " ";
  }
  return sql.trim(); 
};

if(typeof module !== 'undefined' && module.exports){
  module.exports.SimpleSQLGenerator = SimpleSQLGenerator; 
};
