*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_FilterRegExp										By: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to filter data by matching the field from any table with RegExp.
"table" and "field" are name. <String>
  (e.g. 'incident', 'short_description')
"regY" and "regN" are Regular expression. <RegExp><Optional>
  (e.g. /SAP/, /email/i, /\d/, /./, /.*/, /[0-9]|[*-+]|\s/, /[0-9]$/)
The result is a list of 'sys_id' that matches with regY but regN.

// Note: ServiceNow still has bug in RegExp.
	1. Some RegExp symbols (ex: ^, <, >) are broken. // use {starts with} instead
	2. RegExp of {} can be only used as [x]{m,n} (ex: /[A-Z]{5}/, /[0-9]{1,3}$/).


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_FilterRegExp(table, field, regY, regN) {
	var grq, w, bY, bN;
	var key = 'sys_id';
	var list = [];
	if(table && field && (regY || regN)) {
		grq = new GlideRecord(table);
		grq.orderBy(key);
		grq.query();
		if(regY && regN) {
			while(grq.next()) {
				w = grq[field].getDisplayValue();
				bY = regY.test(w);
				bN = regN.test(w);
				if(bY && !bN) {
					list.push(grq[key].getDisplayValue());
				}
			}
		} else if(regY) {
			while(grq.next()) {
				w = grq[field].getDisplayValue();
				bY = regY.test(w);
				if(bY) {
					list.push(grq[key].getDisplayValue());
				}
			}
		} else if(regN) {
			while(grq.next()) {
				w = grq[field].getDisplayValue();
				bN = regN.test(w);
				if(!bN) {
					list.push(grq[key].getDisplayValue());
				}
			}
		}
	}
	return list;
}

//-----------------------------------------------------------------------

// Test1 : Y
var testArray = CRA_FilterRegExp(
	'incident', 'cmdb_ci', 
	/^[A-Za-z]+$/
);

// Test2 : Y, N
/*
var testArray = CRA_FilterRegExp(
	'incident', 'cmdb_ci', 
	/./, 
	/[0-9]|[*-+]|\s/
);
*/

// Print
var z = '';
for(var i = 0; i < testArray.length; i++) {
	z += '\n' + (i+1) + ' > ' + testArray[i];
}
gs.print(z);



*/ How to apply this in a filter condition
-----------------------------------------------------------------------------------------------------

> Lv 1
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'short_description', /[A-Z]{2}/);

> Lv 2
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /./, /[0-9]|[*-+]|\s/);

> Do not use
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'short_description', /^SAP/);  //error (because of ^)
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /^[A-Za-z]+$/);  //error (because of ^)


> Knowledge

	There are 5 groups of characters.
	[A-Z]	= Uppercase
	[a-z]	= Lowercase
	[0-9]	= Number
	[_]		= Underscore
	\W		= Others (Not in 4 groups above)
	
	For case insensitive mode, add letter "i" after RegExp.
	/.../i	= Anycase
	
	References
	[1]	Web:	http://www.tutorialspoint.com/javascript/javascript_regexp_object.htm
	[2] Slide:	'28-regular-expressions.ppt'
	
	
> Examples

// contains only [A-Z]
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /./, /[a-z0-9_]|\W/)

// contains only [0-9]
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'sys_mod_count', /./, /[A-Za-z_]|\W/)

// contains only [A-Z]|\W
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /./, /[0-9a-z_]/)

// must contain "Unknown" (case insensitive)
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /Unknown/i)

// must not contain "Unknown" (case insensitive)
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /./, /Unknown/i)

// must not contain "Unknown" (case insensitive) or null
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', false, /Unknown/i)

// contains some words like "Can't", "Can`t", "Cannot" (case insensitive)
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'short_description', /can(not|.t)/i)

// ends with a non-number following with 1-3 numbers
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /\D\d{1,3}$/)



	Notes
	1.	For a core-fields completeness requirement including 'Correct' or 'Incorrect',
		We can apply an operator ( {is} or {is not} ) and remain the same RegExp.
	2.	To achieve performance, try to apply RegExp to obtain minimum number of result.
	3.	Some simple conditions can be applied without RegExp.
		See some additional examples below.
	4.	Do you notice a value of false at parameter "regY"? 
		It means "including null". Program will allow all records ignoring matching with regY.
		Instead of false, you can also use: /.*/ or 0


// is not null
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /./)
= Configuration item {is not empty}

// is null
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', false, /./)
= Configuration item {is empty}

// ends with
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /_DUP$/)
= Configuration item {ends with} _DUP

// starts with
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /^SAP/)          //error in ServiceNow
Sys ID {is} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /SAP/, /.SAP/)   //use this instead
= Configuration item {starts with} SAP

// not starts with
Sys ID {is not} javascript:CRA_FilterRegExp('incident', 'cmdb_ci', /SAP/, /.SAP/)
( /* No normal filter is available. */ )


