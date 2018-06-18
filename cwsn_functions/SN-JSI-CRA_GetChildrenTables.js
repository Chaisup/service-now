*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_GetChildrenTables									By: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function uses input table to get an array of all tables that extend it including it.
Input:
	1	table <String> (required) (e.g. 'cmdb_ci_server',
 'alm_asset')
Output:
	<Array> : the list of class name of the children tables including it


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_GetChildrenTables(table) {
	var list = [];
	var level = '';
	var grq;
	for(var l=0; l<100; l++) {
		grq = new GlideRecord('sys_db_object');
		grq.addQuery(level+'name', table);
		grq.query();
		if(grq.hasNext()) {
			while(grq.next()) {
				list.push(grq.name+'');
			}
			level += 'super_class.';
		} else {
			break;
		}
	}
	return list;
}

//---------------------------------------------------------------------------------------------------

// Test 1
// var z = CRA_GetChildrenTables('task');

// Test 2
var z = CRA_GetChildrenTables('cmdb_ci_server');

// Test 3
// var z = CRA_GetChildrenTables('sys_user');

// Test 4
// var z = CRA_GetChildrenTables('xxx');

// Print
for(var i=0; i<z.length; i++) {
	gs.print(z[i]);
}


*/ Result
-----------------------------------------------------------------------------------------------------

/* Test 1
*** Script: task
*** Script: reconcile_duplicate_task
*** Script: change_phase
*** Script: stale_ci_remediation
*** Script: chat_queue_entry
*** Script: sc_req_item
*** Script: cert_follow_on_task
*** Script: vtb_task
*** Script: orphan_ci_remediation
*** Script: service_task
*** Script: change_task
*** Script: change_request
*** Script: sc_task
*** Script: kb_submission
*** Script: sysapproval_group
*** Script: problem_task
*** Script: recommended_field_remediation
*** Script: reclassification_task
*** Script: release_task
*** Script: incident
*** Script: std_change_proposal
*** Script: ticket
*** Script: release_phase
*** Script: sc_request
*** Script: incident_task
*** Script: required_field_remediation
*** Script: problem
*** Script: cert_task
*** Script: change_request_imac
*** Script: kb_knowledge_base_request
[0:00:00.008] Total Time
*/

/* Test 2
*** Script: cmdb_ci_server
*** Script: cmdb_ci_server_hardware
*** Script: cmdb_ci_netware_server
*** Script: cmdb_ci_mainframe
*** Script: cmdb_ci_unix_server
*** Script: cmdb_ci_lb
*** Script: cmdb_ci_win_server
*** Script: cmdb_ci_mainframe_lpar
*** Script: cmdb_ci_storage_server
*** Script: cmdb_ci_osx_server
*** Script: cmdb_ci_linux_server
*** Script: cmdb_ci_cim_server
*** Script: cmdb_ci_virtualization_server
*** Script: cmdb_ci_chassis_server
*** Script: cmdb_ci_net_app_server
*** Script: cmdb_ci_tape_server
*** Script: cmdb_ci_hpux_server
*** Script: cmdb_ci_aix_server
*** Script: cmdb_ci_solaris_server
*** Script: cmdb_ci_lb_ace
*** Script: cmdb_ci_lb_a10
*** Script: cmdb_ci_lb_network
*** Script: cmdb_ci_lb_alteon
*** Script: cmdb_ci_lb_f5_gtm
*** Script: cmdb_ci_lb_cisco_csm
*** Script: cmdb_ci_lb_radware
*** Script: cmdb_ci_lb_netscaler
*** Script: cmdb_ci_lb_isa
*** Script: cmdb_ci_lb_cisco_css
*** Script: cmdb_ci_lb_bigip
*** Script: cmdb_ci_lb_f5_ltm
*** Script: cmdb_ci_vcenter_server_obj
*** Script: cmdb_ci_hyper_v_server
*** Script: cmdb_ci_esx_server
[0:00:00.013] Total Time
*/

/* Test 3
*** Script: sys_user
[0:00:00.007] Total Time
*/

/* Test 4
[0:00:00.001] Total Time
*/


*/ How to apply this in a filter condition
-----------------------------------------------------------------------------------------------------

/*
	This has been applied in some reports of CRA Metadata.
*/

> Table [sys_db_object] {
	Name {is} javascript:CRA_GetChildrenTables('task');
}

> Dictionary [sys_dictionary] {
	table {is} javascript:CRA_GetChildrenTables('cmdb_ci_server');
}

