*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_Use												By: Chaisup Wongsaroj		Version: 2.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to use PA Script to call another function for reporting purpose.
To use the feature of 'cwsn_scripts', this function must be installed in the instance.
The defined function in PA Script must be named as 'CRA_JSF', 'CRA_JSC', or 'CRA_JSO' only.
	'CRA_JSF' is for all users to make an advanced filter with a JavaScript function.
	'CRA_JSC' is for PA users to build a field calculation on a job, metric, or business rule.
	'CRA_JSO' is for PA users to apply an operation script on an object.
Inputs
	1 :	js <String> : Name of PA Script with only 1 function (e.g. 'CRA-JSF-GetGroupMembers')
	2 :	arg <Anything> : Argument of any data type (e.g. ['ALB', 'REPORTING-SERVICE-MGMT-TH'])
Output
	<Anything> : The result of the function in the PA Script.


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_Use(js, arg) {
	var grq_ps = new GlideRecord('pa_scripts');
	grq_ps.addQuery('name', js);
	grq_ps.query();
	if(grq_ps.next()) {
		eval(grq_ps.script);
		if(typeof CRA_JSF === 'function') {
			if(typeof arg === 'undefined') { return CRA_JSF(); } else { return CRA_JSF(arg); }
		} else if(typeof CRA_JSC === 'function') {
			if(typeof arg === 'undefined') { return CRA_JSC(); } else { return CRA_JSC(arg); }
		} else if(typeof CRA_JSO === 'function') {
			if(typeof arg === 'undefined') { CRA_JSO(); } else { CRA_JSO(arg); }
		}
	}
}

//---------------------------------------------------------------------------------------------------

// Test
var testArray = CRA_Use('CRA-JSF-GetGroupMembers', ['ALB', 'REPORTING-SERVICE-MGMT-TH']);

// Print
var z = '';
for(var i = 0; i < testArray.length; i++) {
	z += '\n' + (i+1) + ' > ' + testArray[i];
}
gs.print(z);


*/ How to apply this in a filter condition
-----------------------------------------------------------------------------------------------------

> Change Request
	Opened by.Sys ID {is} javascript:CRA_Use('CRA-JSF-GetGroupMembers', ['ALB', 'REPORTING-SERVICE-MGMT-TH'])


*/ Example of a PA Script
-----------------------------------------------------------------------------------------------------

> Name: 
	CRA-JSF-GetGroupMembers

> Description: 
	This function is to get user members of one or more groups.
	Input
		1 :	groups <Array(String)> : List of group names (e.g. ['ALB', 'REPORTING-SERVICE-MGMT-TH'])
	Output
		<Array(SysID)> : An array of sys_id of users in those groups.

> Facts table: 
	Script [pa_scripts] // Actually, we can set it as any table because we do not use it.
	
> Script: 
	function CRA_JSF(groups) {
		var list = [];
		var value = '';
		var grq = new GlideRecord('sys_user_grmember');
		grq.addEncodedQuery('group.nameIN'+groups.toString());
		grq.addNotNullQuery('user');
		grq.query();
		while(grq.next()) {
			value = grq.user.sys_id;
			if(list.indexOf(value) == -1) {
				list.push(value);
			}
		}
		return list;
	}

