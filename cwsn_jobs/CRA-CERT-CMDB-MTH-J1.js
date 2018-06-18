`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name: CRA-CERT-CMDB-MTH-J1 Run ETL
Run : Monthly - 4th - 04:45:00 GMT
Relative : 0 months ago - 0 months ago


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

// Input Variable
var z_arg = {
	// Condition of the source table [cmdb_rel_ci]
	filter	:	'parent.sys_class_name=cmdb_ci_service^child.sys_class_name!=cmdb_ci_service^parent.departmentISNOTEMPTY'
			  +'^parent.u_config_managed=yes',
	scope	:  '^child.u_config_managed=yes'
};

// Main Variables
var z_now = gs.nowNoTZ();
var z_data_bu = {};
var z_data_ci = {};
var z_log_node = [0,0,0,0];

// Main Program
runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -100);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_NOW | '+z_now+' GMT', -99);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_ARGUMENTS | '+JSON.stringify(z_arg, null, 4), -90);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_COLLECT_0 | '+collect_0(), -60);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_COLLECT_N | '+collect_n(), -50);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_WRITE_DATA | '+write_data(), -40);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_CALL_JOBS | '+callJobs(), -20);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -10);
}

// Scheduling Functions
function callJobs() {
	// check the condition for some jobs that may not run
	var J23 = isOnMonths(z_now, 1, 7);
	// schedule all next jobs
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CERT-CMDB-MTH-J21 Run PA', -21, 10, {});
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CERT-CMDB-MTH-J22 Run PA', -22, 1200, {});
	callJobIfRun(J23, [current.sys_id, 'CRA-CERT-CMDB-MTH-J23 Run PA', -23, 2400, {}]);
}

function callJobIfRun(yes, Arg) {
	if(yes) {
		CRA_PA_CallNextJob(Arg[0], Arg[1], Arg[2], Arg[3], Arg[4]);
	} else {
		CRA_PA_WriteJobLog(Arg[0], 'NOT CALLED JOB: '+Arg[1], Arg[2]);
	}
}

function isOnMonths(dt, m1, m2) {
	return (+dt.substr(5,2) == m1) || (+dt.substr(5,2) == m2);
}

// Processing Functions
function collect_0() {
	// collect ancestor CIs 
	var grq = new GlideRecord('cmdb_rel_ci');
	grq.addEncodedQuery(z_arg.filter);
	grq.orderBy('child.sys_id');
	grq.orderBy('parent.sys_id');
	grq.query();
	grq.next();
	// @First : set up the list
	var y_CI = get_CI(grq);
	var y_BU = [get_BU(grq)];
	while(grq.next()) {
		// @Same : collect item
		if(get_CI(grq) == y_CI) {
			var new_BU = get_BU(grq);
			if(y_BU.indexOf(new_BU) == -1) y_BU.push(new_BU);
		// @Change : write the previous list then reset it
		} else {
			node_build(y_CI, y_BU);
			y_CI = get_CI(grq);
			y_BU = [get_BU(grq)];
		}
	}
	// @Last : write the current list
	node_build(y_CI, y_BU);
	return 'completed'
		+'\n'+z_log_node[0]+' nodes were built.';
}

function collect_n() {
	// collect children CIs in all levels by each ancestor CI using a recursive algorithm
	var i = 0;
	for(var y_CI in z_data_ci) {
		collect_r(y_CI);
		if(++i === z_log_node[0]) break;
	}
	return 'completed'
		+'\n'+z_log_node[1]+' nodes were inserted.'
		+'\n'+z_log_node[2]+' nodes were updated.';
}

function collect_r(y_CI) {
	// set up the parent-children query
	var grq_r = new GlideRecord('cmdb_rel_ci');
	grq_r.addEncodedQuery('parent.sys_id='+y_CI+'^child.sys_class_name!=cmdb_ci_service'+z_arg.scope);
	grq_r.query();
	while(grq_r.next()) {
		var x_CI = grq_r.child.sys_id+'';
		// check if the child is already exists in z collection
		if(z_data_ci[x_CI]) {
			// (u) : update it
			node_update(x_CI, y_CI);
		} else {
			// (i) : insert it and do recursive
			node_insert(x_CI, y_CI);
			collect_r(x_CI);
		}
	}
}

function node_build(key_CI, arr_BU) {
	// collect BU data
	var key = ++z_log_node[0];
	z_data_bu[key] = arr_BU.toString();
	// collect CI data
	z_data_ci[key_CI] = [z_data_bu[key]];
}

function node_insert(x_CI, y_CI) {
	// collect CI data
	z_data_ci[x_CI] = [z_data_ci[y_CI]];
	z_log_node[1]++;
}

function node_update(x_CI, y_CI) {
	// collect CI data
	z_data_ci[x_CI].push(z_data_ci[y_CI]);
	z_log_node[2]++;
}

function write_data() {
	// write CI data of certification breakdown : Impacted Division
	for(var key in z_data_ci) {
		if(hasCert_Elem(key)) {
			// get the record
			var gru = new GlideRecord('u_report_cmdb_completeness');
			gru.addQuery('u_configuration_item', key);
			gru.query();
			if(gru.next()) {
				// extend the code with plus (+)
				var code = gru.u_completion_code;
				var plus = code.indexOf('+');
				if(plus > -1) {
					code = code.substring(0, plus);
				}
				gru.u_completion_code = code+'+B7['+getCleanData(key)+']';
				gru.autoSysFields(false);
				gru.setWorkflow(false);
				gru.update();
				z_log_node[3]++;
			}
		}
	}
	return 'completed'
		+'\n'+z_log_node[3]+' nodes were written as extended completion code.';
}

function get_BU(grq) {
	return mapInt_PartnerBU(grq.parent.department);
}

function get_CI(grq) {
	return grq.child.sys_id+'';
}

function hasCert_Elem(ci) {
	var grq = new GlideRecord('cert_element');
	grq.addQuery('configuration_item', ci);
	grq.query();
	return grq.hasNext();
}

// Supporting Functions
function getCleanData(key) {
	var result = removeDup(z_data_ci[key].toString().split(',')).toString();
	if(result.indexOf(',,') > -1) {
		return removeLoop(result);
	} else {
		return result;
	}
}

function removeDup(arr) {
	return arr.filter(function (item, pos) {return (arr.indexOf(item) == pos);});
}

function removeLoop(str) {
	if(str.indexOf(',,') > -1) {
		return removeLoop(str.replace(',,',','));
	} else {
		return str;
	}
}

function mapInt_PartnerBU(dept) {
	// Input : Department [cmn_department]
	var sbu_id = dept.u_sbu.id;
	var div_id = dept.u_division.id;
	if(div_id == 'C1003') {
		var NAME = dept.name.toUpperCase();
		if(NAME.indexOf('NAWM') > -1 || NAME.indexOf('WEALTH') > -1) { return 12; // NAWM
		} else {
			return 1; // F&R
		}
	} else if(div_id == 'C1327') { return 2; // IP&S
	} else if(div_id == 'C1328') { return 3; // TRL
	} else if(div_id == 'C6731') { return 4; // TRTA
	} else if(sbu_id == '10454') { return 5; // EBS
	} else if(sbu_id == 'C1369') { return 6; // ITS
	} else if(div_id == 'C6730') { return 7; // REUTERS
	} else if(div_id == 'C1002') { return 8; // GGO
	} else if(sbu_id == 'C6724') { return 9; // PLATFORM
	} else if(sbu_id == '10978') { return 14; // DCO
	} else if(sbu_id == 'C6661') { return 14; // DCO
	} else if(sbu_id == '12346') { return 15; // ENT
	} else if(div_id == 'C1005') { return 10; // CORPORATE
	} else {
		return 0; // UNKNOWN
	}
}

// Testing Functions
function test() {
	gs.print(collect_0());
	gs.print(collect_n());
	gs.print(JSON.stringify(z_data_ci ,null,4));
	gs.print(JSON.stringify(z_data_bu ,null,4));
	test_write();
}

function test_write() {
	var t_obj = {};
	for(var key in z_data_ci) {
		t_obj[key] = getCleanData(key);
	}
	return gs.print(JSON.stringify(t_obj ,null,4));
}
