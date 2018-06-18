*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_FilterChangeAwareness								By: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This is to enhance the report of Change Awareness.
This provides records of 'change_request' table that a group approved but never be assigned.
For more understanding, please see the metadata of '[CHG015A] Change Awareness by Group' report.
Inputs:
	1	groups <Array> (required) : the list of name of 'sys_user_group' table
		(e.g. ['AMS-NOVUS','MSSQL-SUPPORT','ALB'])
	2	eq_1x <String> (optional) : extended condition of query 1 from 'sysapproval_group' table
	3	eq_2x <String> (optional) : extended condition of query 2 from 'change_request' table
	4	eq_3x <String> (optional) : extended condition of query 3 from 'change_task' table
Output:
	<Array> : the list of sys_id of 'change_request' table
	

*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_FilterChangeAwareness(groups, eq_1x, eq_2x, eq_3x) {
	if(groups.length > 0) {
		// global variables
		var result = [];
		var curr_chg_si = '';
		var prev_chg_si = '';
		var eq_1a = 'parent.sys_class_name=change_request';
		var eq_1b = '^assignment_group.nameIN'+groups.join();
		var eq_1c = '^parent.assignment_group.name!='+groups.join('^parent.assignment_group.name!=');
		var eq_3b = eq_1b;
		// query 1 : base condition (including filter)
		var grq_1 = new GlideRecord('sysapproval_group');
		grq_1.addEncodedQuery(eq_1a+eq_1b+eq_1c+(eq_1x||''));
		grq_1.orderByDesc('parent.number');
		grq_1.orderByDesc('assignment_group');
		grq_1.orderByDesc('number');
		grq_1.query();
		// loop 1
		while(grq_1.next()) {
			// cluster key checker of loop 1
			curr_chg_si = grq_1.parent.sys_id;
			if(curr_chg_si == prev_chg_si) {
				continue;
			} else {
				prev_chg_si = curr_chg_si;
			}
			// query 2 : extended condition of change request (including filter)
			if(eq_2x) {
				var eq_2a = 'sys_id='+curr_chg_si;
				var grq_2 = new GlideRecord('change_request');
				grq_2.addEncodedQuery(eq_2a+(eq_2x||''));
				grq_2.query();
				if(!grq_2.hasNext()) {
					continue;
				}
			}
			// query 3 : rejection condition of change task (excluding filter)
			var eq_3a = 'parent.sys_id='+curr_chg_si;
			var grq_3 = new GlideRecord('change_task');
			grq_3.addEncodedQuery(eq_3a+eq_3b+(eq_3x||''));
			grq_3.query();
			if(grq_3.hasNext()) {
				continue;
			}
			// add sys_id in the result
			result.push(curr_chg_si);
		}
		return result;
	} else {
		return [];
	}
}

//---------------------------------------------------------------------------------------------------

var groups = ['AMS-NOVUS','MSSQL-SUPPORT','ALB'];

var z = CRA_FilterChangeAwareness(groups, '', '^closed_at>='+gs.beginningOfLastMonth());

for(var i=0; i<z.length; i++) {
	gs.print((i+1)+' > '+z[i]);
}



*/ How to apply this in a filter condition
-----------------------------------------------------------------------------------------------------

> Table: Change Request [change_request]

	[Sys ID] is javascript:CRA_FilterChangeAwareness(['ORACLE-SUPPORT','MSSQL-SUPPORT'])
	
	[Sys ID] is javascript:CRA_FilterChangeAwareness(['AMS-NOVUS','MSSQL-SUPPORT','ALB'],'^^approval!=cancelled','^^short_descriptionLIKEtest')
	

/* CannotUse (Need more experiment)
	[Sys ID] is javascript:CRA_FilterChangeAwareness(['AMS-NOVUS','MSSQL-SUPPORT','ALB'],'','^^closed_at>='+javascript:gs.beginningOfLastMonth())
*/

/* EQ Examples

	parent.sys_class_name=change_request
	^assignment_group.nameINAMS-NOVUS,MSSQL-SUPPORT,ALB
	^parent.assignment_group.name!=AMS-NOVUS
	^parent.assignment_group.name!=MSSQL-SUPPORT
	^parent.assignment_group.name!=ALB

	parent.sys_class_name=change_request
	^assignment_group.nameINORACLE-SUPPORT,MSSQL-SUPPORT
	^parent.assignment_group.name!=ORACLE-SUPPORT
	^parent.assignment_group.name!=MSSQL-SUPPORT

*/



*/ Test Result
-----------------------------------------------------------------------------------------------------

/*
var z = CRA_FilterChangeAwareness(groups, '', '^closed_at>='+gs.beginningOfLastMonth());  // 2017-06-01 00:00:00
*** Script: 1 > b73001da13a3b6049c89b53a6144b007
*** Script: 2 > 5b622d26135bbe809c89b53a6144b00c
*** Script: 3 > 2a9c4224139f72809c89b53a6144b079
*** Script: 4 > 4aececd413dffa00f05c7e276144b086
*** Script: 5 > 87fa6c9413dffa00f05c7e276144b0cb
*** Script: 6 > 2b3b920a13c7fe009c89b53a6144b07f
*** Script: 7 > c3304394130bf2009c89b53a6144b0fe
*** Script: 8 > 2c464648134b72009c89b53a6144b0cd
*** Script: 9 > 20258e84134b72009c89b53a6144b0b5
*** Script: 10 > 37fe993a133abec0f05c7e276144b0e9
*** Script: 11 > 15e3499e13f23ec0f05c7e276144b06d
*** Script: 12 > be9846b513b63ac0f05c7e276144b0e7
[0:00:01.469] Total Time


var z = CRA_FilterChangeAwareness(groups, '^approval!=cancelled', '^short_descriptionLIKEtest');
*** Script: 1 > 2a9c4224139f72809c89b53a6144b079
*** Script: 2 > 87fa6c9413dffa00f05c7e276144b0cb
*** Script: 3 > a97e551e13763ec0f05c7e276144b041
*** Script: 4 > 85acfab313d5a2009c89b53a6144b0e2
*** Script: 5 > cd4a767313d5a2009c89b53a6144b004
*** Script: 6 > 1a59fe3313d5a2009c89b53a6144b0a0
*** Script: 7 > 0971b4e3131962009c89b53a6144b0d7
*** Script: 8 > c98f281a1311a2009c89b53a6144b099
*** Script: 9 > 6ffb2c561311a2009c89b53a6144b06d
*** Script: 10 > f8c8ef71131562009c89b53a6144b0e0
*** Script: 11 > ac95277d13d162009c89b53a6144b0dc
*** Script: 12 > 41073c8013d1a2409c89b53a6144b0b9
*** Script: 13 > e2047ccc1391a2409c89b53a6144b095
*** Script: 14 > 1d23f0cc1391a2409c89b53a6144b0a2
*** Script: 15 > 2a5e60c81391a2409c89b53a6144b065
*** Script: 16 > 969a98bf134d2240f05c3e276144b076
*** Script: 17 > 7f06d4fb134d2240f05c3e276144b074
*** Script: 18 > 721410bb134d2240f05c3e276144b099
*** Script: 19 > aa12d83b134d2240f05c3e276144b035
*** Script: 20 > 8fddc477134d2240f05c3e276144b0bc
*** Script: 21 > 1d0a08f3134d2240f05c3e276144b047
*** Script: 22 > 47778073134d2240f05c3e276144b0d8
*** Script: 23 > b5f64c33134d2240f05c3e276144b0df
*** Script: 24 > 48310c3f130d2240f05c3e276144b014
*** Script: 25 > 221b332b130d2240f05c3e276144b092
*** Script: 26 > 26287fa7130d2240f05c3e276144b012
*** Script: 27 > 3845b767130d2240f05c3e276144b0ac
*** Script: 28 > 17b23763130d2240f05c3e276144b05b
*** Script: 29 > b310e2ef138162409c89b53a6144b0d2
*** Script: 30 > b3dee69313cdee00f05c3e276144b021
*** Script: 31 > 254366db138dee00f05c3e276144b068
*** Script: 32 > c612e69b138dee00f05c3e276144b0ce
*** Script: 33 > 6500ea1b138dee00f05c3e276144b0c6
*** Script: 34 > e0eed6d7138dee00f05c3e276144b02f
*** Script: 35 > d0675653138dee00f05c3e276144b028
*** Script: 36 > f12824f613c5ae00f05c3e276144b093
*** Script: 37 > 09b88c721385ae00f05c3e276144b006
[0:00:01.267] Total Time
*/

