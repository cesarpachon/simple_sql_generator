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
    var separator = (i < col.length-1)?", ":"";
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
 }else{
  if(typeof val === "string"){
    //avoid quoting if the string is already enclosed
    if(val.charAt(0) === "'" &&
        val.charAt(val.length-1) === "'"){
        return val;
    }else{
      //escape single character within 
      val = val.replace("'", "\\'");
      return "'"+val+"'"; 
    }
  }
  return val; 
 }
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

//reduce for having expresions
function _having(ac, el, i, col){
  ac += _expr(el);
  ac += (i<col.length-1?" and ":"");
  return ac;
};

SimpleSQL.Generator = function(){
  this.operation = null; 
  this.fields = [];
  this.tables = [];
  this.wheres = []; //array of where expresions (objects) 
  this.havings = []; //array of having expresions (field, operator, val) 
  this.group_by = []; //array of fields
  this.order_by = []; //array of fields 
  this.offset = -1; //means not present in the sql
  this._limit = null; //number
  this._values = [];
  this._update_set = null;
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

/*
 * if called as table_name, fields(array of strings): will set the table name
 * if no table_name (first arg is an array) will APPEND the fields
 * so you can call it multiple times to append new fields.
 * @see values
 */
SimpleSQL.Generator.prototype.insertInto = function(table_name, fields){
  var _self = this;
  this.operation = "insert"; 
  if(typeof table_name === "string" && fields){
    this.tables = [table_name];
  }else{
    //invokated as insertInto(array) 
    fields = table_name; 
  }
  fields.forEach(function(field){
    _self.fields.push(field);  
  });
  return this;
}

/*
 */
SimpleSQL.Generator.prototype.update = function(table_name){
  this.operation = "update"; 
  this.tables = [table_name];
  this._update_set = {};
  return this; 
}

/**
 *
 */ 
SimpleSQL.Generator.prototype.deleteFrom = function(table_name){
  this.operation = "delete"; 
  this.tables = [table_name];
  return this; 
}

/**
 * set fields for update operations.
 * support the following modes: 
 * - one by one: set(field, value) 
 *
 */ 
SimpleSQL.Generator.prototype.set = function(field, value){
  var _self = this; 
  if(typeof field === "string"){ 
    //expects string, val. @todo: validations
    this._update_set[field] = value; 
  }else{
    //expects an object. @todo: validate
   Object.keys(field).forEach(function(key){
    _self._update_set[key] = field[key];
   }); 
  }  
  return this; 
}

/**
 * values: array of json objects, with attributes expected to match
 * the fields array (@see insertInto).
 * multiple calls to values will append to the existing collection. 
* if called with empty arguments, will return the internal values
* array, for direct manipulation. 
*/
SimpleSQL.Generator.prototype.values = function(values){
  if(!values){
    return this._values; 
  }
  this._values = this._values.concat(values); 
  return this; 
}



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
SimpleSQL.Generator.prototype.having = function(field, operator, value){
 this.havings.push({
  field: field,
  operator: operator,
  value: value
 });
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

/**
 * @private
 */ 
SimpleSQL.Generator.prototype._select_toSQL = function(){
  var sql = ""; 
  sql += this.operation + " ";
  if(this.fields && this.fields.length){
    sql += _arrayToCSL(this.fields);
  }else{
    sql += "*"; 
  }
  sql += " from "  + this.tables.reduce(_from, "");
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
    sql += " having ";
    sql += this.havings.reduce(_having, "");
    sql += " "; 
  }
  if(this.order_by.length){
    sql += " order by ";
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
  return sql; 
};

/**
 * @private
 */ 
SimpleSQL.Generator.prototype._insert_toSQL = function(){
  var _self = this; 
  var sql = "insert into "+ this.tables[0]; 
  sql += " (";
  sql += _arrayToCSL(this.fields);
  sql += ") values ";
  if(this.fields.length ===1){
    var field_name = this.fields[0];
    //generate an array of unquoted strings
    var single_fields = this._values.map(function(el){
      return el[field_name];
    });
    sql += "(";
    sql += _arrayToCSL(single_fields, true);
    sql += ")";
  }else{

    this._values.forEach(function(value, i){
      var row_vals = _self.fields.map(function(field){
        return value[field]; 
      });
      if(i>0){
        sql += ", ";
      }
      sql += "(" + _arrayToCSL(row_vals, true) + ")";
    });
  } 
  return sql; 
};

/**
 * @private
 */ 
SimpleSQL.Generator.prototype._update_toSQL = function(){
  var _self = this; 
  var sql = "update " + this.tables[0] + " set ";
  sql += Object.keys(this._update_set).map(function(field){
    return field + " = "+ _q(_self._update_set[field]);
  }).join(", ");
  if(this.wheres.length){
    sql += " where ";
    sql += this.wheres.reduce(_wheres, "");
    sql += " ";
  }
  return sql; 
};


/**
 * @private
 */ 
SimpleSQL.Generator.prototype._delete_toSQL = function(){
  var _self = this; 
  var sql = "delete from "+ this.tables[0]; 
  if(this.wheres.length){
    sql += " where ";
    sql += this.wheres.reduce(_wheres, "");
    sql += " ";
  }
  return sql;
};

/*
 * generate a SQL string using the current state of the object.  
 */
SimpleSQL.Generator.prototype.toSQL = function(){
  var sql = null; 
  if(this.operation === "select"){
    sql=  this._select_toSQL();
  }else if(this.operation === "insert"){
    sql = this._insert_toSQL();
  }else if(this.operation === "update"){
    sql = this._update_toSQL();
  }else if(this.operation === "delete"){
    sql = this._delete_toSQL();
  }
  //a last attempt to fix duplicated spaces
  if(sql){
    sql = sql.replace("  ", " ");
    sql = sql.trim();
  }
  return sql; 
};

return SimpleSQL;

})();

//for Node.js
if(typeof module !== 'undefined' && module.exports){
  module.exports.Generator = SimpleSQL.Generator; 
};
