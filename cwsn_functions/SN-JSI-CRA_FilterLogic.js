*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_FilterLogic										By: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to filter data by applying a logical expression of fields from any table.
"table" is name. <String>
  (e.g. 'incident')
"logexp" is a logical expression of fields. <Boolean>
  (e.g. "grq.category == 'network'", "grq.resolved_at > grq.closed_at")
The result is a list of 'sys_id' that conforms to "logexp".


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_FilterLogic(table, logexp) {
	var grq;
	var key = 'sys_id';
	var list = [];
	var validY = /(grq.)/.test(logexp);
	var validN1 = /[@#$:;]/.test(logexp);
	var validN2 = /\s[=]\s/.test(logexp);
	if(validY && !validN1 && !validN2) {
		grq = new GlideRecord(table);
		grq.orderBy(key);
		grq.query();
		while(grq.next()) {
			if(eval(logexp)) {
				list.push(grq[key].getDisplayValue());
			}
		}
	}
	return list;
}

//-----------------------------------------------------------------------

// Test1 : 1 field
var testArray = CRA_FilterLogic(
	'incident', "grq.category == 'network'"
);

// Test2 : 2 fields
var testArray = CRA_FilterLogic(
	'incident', "grq.resolved_at > grq.closed_at"
);

// Test3 : 2 fields (days-diff of 2 dates < 7 days)
var logexp = "gs.dateDiff("
				+ "grq.opened_at.getDisplayValue(), "
				+ "grq.sys_updated_on.getDisplayValue(), "
				+ "true) < 7*24*60*60";
var testArray = CRA_FilterLogic(
	'incident', logexp
);

// Test4 : 3 fields (days-diff of 2 not-null dates > priority-score)
var logexp = "!grq.closed_at.nil() && gs.dateDiff("
				+ "grq.opened_at.getDisplayValue(), "
				+ "grq.closed_at.getDisplayValue(), "
				+ "true) > Math.pow(grq.priority,2)*24*60*60";
var testArray = CRA_FilterLogic(
	'incident', logexp
);


/*
// TestError1 : validY
var testArray = CRA_FilterLogic(
	'incident', "1 == 1"
);

// TestError2 : validN1
var testArray = CRA_FilterLogic(
	'incident', "var a;"
);

// TestError3 : validN2
var testArray = CRA_FilterLogic(
	'incident', "grq.priority = 1"
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

> Knowledge

	Logical Operators
	&&	is AND
	||	is OR
	!	is NOT
	==	is Equal (Do not use =)
	!=	is NotEqual
	
	{ === , !== , > , >= , < , <= }		are available
	
	Logical Operands
	true	is TRUE
	false	is FALSE
	{ 0 , '' , NaN , null , undefined }	are false
	{ -1 , ' ' , 'false' , [] , {} }	are true	
	
	
> Test 1
Sys ID {is} javascript:CRA_FilterLogic('incident', "grq.category == 'network'");

> Test 2

Sys ID {is} javascript:CRA_FilterLogic('incident', "grq.opened_at > grq.closed_at");   // 24    Opened but not closed yet.
Sys ID {is} javascript:CRA_FilterLogic('incident', "grq.opened_at < grq.closed_at");   // 30

> Test 3
Sys ID {is} javascript:CRA_FilterLogic('incident', "gs.dateDiff(grq.opened_at.getDisplayValue(), grq.sys_updated_on.getDisplayValue(), true) < 7*24*60*60");


*/ Mong's Experiment
-----------------------------------------------------------------------------------------------------

javascript:CRA_FilterLogic('incident', "grq.resolved_at > grq.closed_at")   // R>C 20  |
javascript:CRA_FilterLogic('incident', "grq.resolved_at < grq.closed_at")   // R<C 10  |  n< 8 ,  k< 2     (n = null , k = constant)
javascript:CRA_FilterLogic('incident', "grq.resolved_at == grq.closed_at")  // R=C 24  |  n=n 24

javascript:CRA_FilterLogic('incident', "gs.dateDiff(grq.resolved_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true) > 0")  // Rk<Ck  2
javascript:CRA_FilterLogic('incident', "gs.dateDiff(grq.resolved_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true) < 0")  // Rk>Ck  20  

javascript:CRA_FilterLogic('incident', "(gs.dateDiff(grq.resolved_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true) || gs.dateDiff(grq.opened_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true)) < 10*24*60*60")  // 10 days

javascript:CRA_FilterLogic('incident', "(gs.dateDiff(grq.resolved_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true) || gs.dateDiff(grq.opened_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true)) < 5*60*60")  // 5 hrs

javascript:CRA_FilterLogic('incident', "(grq.resolved_at <= grq.closed_at) && (grq.opened_at <= grq.closed_at) && ((gs.dateDiff(grq.resolved_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true) || gs.dateDiff(grq.opened_at.getDisplayValue(), grq.closed_at.getDisplayValue(), true)) < 10*24*60*60)")  // 10 days

// GMT
gs.now();
gs.nowNoTZ();
// Local
gs.nowDateTime();

*/ Muay's Test
-----------------------------------------------------------------------------------------------------

javascript:CRA_FilterLogic('change_request', "grq.closed_at < grq.start_date")

javascript:CRA_FilterLogic('change_request', "grq.end_date")

javascript:CRA_FilterLogic('alm_asset', "grq.cost")

javascript:CRA_FilterLogic('alm_asset', "grq.cost >= 0")

javascript:CRA_FilterLogic('change_request', "grq.closed_at")

javascript:CRA_FilterLogic('change_request', "grq.closed_at && grq.end_date")

javascript:CRA_FilterLogic('change_request', "grq.closed_at < grq.end_date")    // 68

javascript:CRA_FilterLogic('change_request', "grq.end_date < '2016-08-01'")    // 19

javascript:CRA_FilterLogic('change_request', "grq.closed_at <= grq.end_date")   // 82

javascript:CRA_FilterLogic('change_request', "grq.end_date < grq.closed_at")    //  2

javascript:CRA_FilterLogic('change_request', "grq.end_date && grq.end_date < grq.closed_at")   // 1

javascript:CRA_FilterLogic('change_request', "(grq.end_date || grq.opened_at) < '2016-08-01'")  // 12

javascript:CRA_FilterLogic('change_request', "(grq.end_date || grq.opened_at) < gs.now()")  // 12

javascript:CRA_FilterLogic('change_request', "(grq.closed_at || gs.nowDateTime()) && grq.closed_at >= grq.end_date")

