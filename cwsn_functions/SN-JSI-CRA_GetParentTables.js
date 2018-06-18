*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_GetParentTables									By: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function uses input table to get an array of all its extended tables including it.
Inputs:
	1	table <String> (required) (e.g. 'cmdb_ci_server', 'alm_asset')
Output:
	<Array> : the list of class name of the parent tables including it


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_GetParentTables(table) {
	var list = [table];
	var grq = new GlideRecord('sys_db_object');
	grq.addQuery('name', table);
	grq.query();
	if(grq.next()) {
		if(grq.getValue('super_class')) {
			return CRA_GetParentTables(grq.super_class.name).concat(list);
		} else {
			return list;
		}
	} else {
		return [];
	}
}

//---------------------------------------------------------------------------------------------------

// Test 1
var testArray = CRA_GetParentTables('cmdb_ci_server');

// Test 2
//var testArray = CRA_GetParentTables('alm_asset');

// Test 3
//var testArray = CRA_GetParentTables('<<< invalid table >>>');

// Print
var z = '';
for(var i = 0; i < testArray.length; i++) {
	z += '\n' + (i+1) + ' > ' + testArray[i];
}
gs.print(z);



*/ How to apply this in a filter condition
-----------------------------------------------------------------------------------------------------

/*
	This has been applied in some reports of CRA Metadata.
*/

> Table [sys_db_object] {
	name {is} javascript:CRA_GetParentTables('cmdb_ci_server');
}

> Dictionary [sys_dictionary] {
	table {is} javascript:CRA_GetParentTables('cmdb_ci_server');
}

