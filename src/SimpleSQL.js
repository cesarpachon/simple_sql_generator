"use strict"; 

var SimpleSQL = (function(){

 var SimpleSQL = {};

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
 if(val === "null" || val === "NULL"){
  return val;
 }else
 return (typeof val === "string")? "'"+val+"'": val; 
}

/**
 * returns "a" = "b" 
 */ 
function _join(params){
  return params.a + " = " + params.b; 
};

/**
 * returns "field" in ("value1", "value2", .. )
 */
function _in(params){
  var s = params.field + " in (";
    s = params.values.reduce(function(ac, el, i, col){
    ac += _q(el);
    ac += (i < col.length -1)?", ":"";
    return ac; 
  }, s);
  s += ")";
  return s; 
};

function _expr(params){
  return params.field+" "+params.operator+" "+_q(params.value);
}

function _and(params){
 return " and " + _expr(params);
};

function _or(params){
  return " or " + _expr(params);
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

//generating where clauses. use with reduce. 
function _wheres(acc, el, i, col){
  var s; 
  if(el.exp instanceof Function){
    s = el.exp(el);
  }else{
    s = el;
  }
  if(i > 0){ //needs conector prefix
    if(s.indexOf(" and ") === 0 || s.indexOf(" or ")=== 0){
     //already has conector. skip.
    }else{
      s = " and " + s;   
    }
  }
  //  s += (i<col.length-1?" and ":"");
  return acc + s;
};

//generate list of order by fields. use with reduce.
function _order_by(ac, el, i, col){
  ac += el.field;
  if(el.mode){
    ac += " ";
    ac += el.mode; 
  }
  ac += (i<col.length-1?", ":"");
  return ac;
};

SimpleSQL.Generator = function(){
  this.operation = null; 
  this.fields = [];
  this.tables = [];
  this.wheres = []; //array of where expresions (objects) 
  this.havings = []; //array of having expresions (just strings) 
  this.group_by = []; //array of fields
  this.order_by = []; //array of fields 
  this.offset = -1; //means not present in the sql
  this._limit = null; //number
};

/**
 * @param fields: {Array} of strings
 * or no params to produce "select *"
 * */
SimpleSQL.Generator.prototype.select = function(fields){
  var _self = this; 
  this.operation = "select"; 
  if(fields){
    fields.forEach(function(field){
      _self.fields.push(field); 
    });
  }
  return this; 
};

SimpleSQL.Generator.prototype.from= function(table_name, alias){
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
SimpleSQL.Generator.prototype.where= function(field, operator, value){
  //this.wheres = [];
  if(field && operator){
    this.wheres.push({
      field: field,
      operator: operator,
      value: value,
      exp: _expr   
    });
  }
  return this;
};

/*
 * assuming a,b are fields, not values, they are not going
 * to be quoted
 */
SimpleSQL.Generator.prototype.join= function(a, b){
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
SimpleSQL.Generator.prototype.in = function(field, values){
  this.wheres.push({
    field: field,
    values: values,
    exp: _in
  });
  return this;
};

SimpleSQL.Generator.prototype.and = function(field, operator, value){
 this.wheres.push({
  field: field,
  operator: operator,
  value: value,
  exp: _and
 });
 return this;
};

SimpleSQL.Generator.prototype.or = function(field, operator, value){
 this.wheres.push({
  field: field,
  operator: operator,
  value: value,
  exp: _or
 });
 return this;
};

/*
 * 
 */
SimpleSQL.Generator.prototype.groupBy= function(fields){
 this.group_by = fields; 
 return this; 
};

//adds an expresion to the having clause
SimpleSQL.Generator.prototype.having = function(expresion){
 this.havings.push(expresion);
 return this; 
};


/**
 * fields: array of fields
 * mode: "desc", "asc" or null.
 */ 
SimpleSQL.Generator.prototype.orderBy = function(field, mode){
  this.order_by.push({
    field: field,
    mode: mode
  });
  return this; 
};

/** 
 * if passed a single parameter, it will be taken as limit, and 
 * offset will not be generated in the query. 
 */
SimpleSQL.Generator.prototype.limit = function(offset, limit){
  if(arguments.length === 1){
    this._limit = offset; 
  }else{
    this.offset = offset; 
    this._limit = limit;
  }
  return this;
};

/*
 * generate a SQL string using the current state of the object.  
 */
SimpleSQL.Generator.prototype.toSQL = function(){
  var sql = ""; 
  sql += this.operation + " ";
  if(this.fields && this.fields.length){
    sql += _arrayToCSL(this.fields);
  }else{
    sql += "* "; 
  }

  sql += "from "  + this.tables.reduce(_from, "");
  
  if(this.wheres.length){
    sql += "where ";
    sql += this.wheres.reduce(_wheres, "");
    sql += " ";
  }
  if(this.group_by.length){
    sql += "group by ";
    sql += _arrayToCSL(this.group_by);
  }
  
  if(this.havings.length){
    sql += "having ";
    sql += this.havings.join(" and ");
    sql += " "; 
  }

  if(this.order_by.length){
    sql += "order by ";
    sql += this.order_by.reduce(_order_by, "");
    sql += " ";
  }

  if(this._limit){
    sql += "limit ";
    if(this.offset > -1){
      sql += this.offset + ", ";
    }
    sql += this._limit; 
  }
  return sql.trim(); 
};

return SimpleSQL;

})();

//for Node.js
if(typeof module !== 'undefined' && module.exports){
  module.exports.Generator = SimpleSQL.Generator; 
};
