
/**
 * array to comma separated list.
 * if quoted, strings will be quoted.
 */
function _arrayToCSL(values, quoted){
  var s = ""; 
  var separator = ""; 
  values.forEach(function(val){
    s += separator + quoted?_q(val):val;
    separator = ",";
  });
  return s; 
};

/*
 * enclose val in quotes if is a string
 * */
function _q(val){
 return val typeof String? "'"+val+"'": val; 
}

/**
 * returns "a" = "b" 
 */ 
function _join(params){
  return _q(params.a) + " = " + _q(params.b); 
};

/**
 * returns "field" in ("value1", "value2", .. )
 */
function _in(params){
  var s = _q(params.field) + " in (";
  s += _arrayToCSL(params.values, true);
  s += ")";
  return s; 
};

//returns "name" [as "alias"]. use with map.
function _from(table, i, tables){
  var s = _q(table.name);
  if(table.alias){
    s+= " as " + alias; 
  }
  if(i < tables.length -1 )
    s += ", ";
  return s; 
};


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
 * do nothing, but helps to visualize better the query chaining
*/
SimpleSQLGenerator.prototype.where= function(){
  //this.wheres = [];
  return this;
};

SimpleSQLGenerator.prototype.join= function(a, b){
  this.wheres.push(
       a: a,
       b: b,
       exp: _join
      );
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
  sql += _arrayToCSL(this.fields)+ " ";
  sql += "from "+ _arrayToCSL(this.tables.map(_from)) + " ";
  if(this.wheres.length){
    sql += "where ";
    sql += this.wheres.map(function(params, i, wheres){
      return params.exp(params) + (i<wheres.length-1?" and ":"");
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

};
