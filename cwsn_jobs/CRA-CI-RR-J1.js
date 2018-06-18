`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-CI-RR-J1 Run ETL
Run : Daily - 05:00:00 GMT
Relative : 0 months ago - 0 months ago


*/ Description
-------------------------------------------------------------------------------------------------------------------------

This ETL job calculates RR data into 'u_report_cmdb_completeness' table from 'cmdb_ci' table.
The result of a calculation is the string of codes that indicates the completeness each installation.
Version: 4.0
	Add 'iv' term for the 2nd tab.
	Change the condition of y_BS ('Bigfix' and 'FireEye') to use sys_id instead.
Version: 4.1 (Current)
	Change ci.addEncodedQuery to 'operational_statusNOT IN5,9' // Pending use, Decommissioned
	Use ETL Engine : EEZM_UI to be able to run separately from 'CRA-CI-J' sequence.
	Add 'NonRR' term for 'operational_status=8' // Pending decommission
Version: 4.2
	Add !is_ESX to exclude 'cmdb_ci_esx_server' from "In Scope" to "Out Of Scope" // Requirement: TASK0271148
Version: 4.3
	Add 'exclude:perfstat' and 'Exclude:FireEye' tags
	Add 'NonRR' term for 'operational_status=6' // Installed
	Change the schedule to run daily
	Fix 'NonRR'
Version: 4.4.1
	Change RR condition to have the bigfix exclusion tag // exclude:bigfix
Example of the installation code:
	'RR-B1[8,9,10]-B2[10]-B3[1,3]-PSt1-PSiy-BFt0-BFiy-FEt0-FEon', 
	'RR-B1[0,10]-B2[10]-B3[0,3]-PSt1x-PSiy-BFt0-BFin-FEt0x-FEon-iv1',
	'RR-B1[]-B2[0]-B3[]-PSt0x-PSin-BFt0x-BFin-FEt0-FEon-iv1-iv2-iv3'
Meaning:
	'RR'		: Just a label for the RR dashboard
	'NonRR'		: A record excluded from the RR calculation
	'B1'		: Breakdown 1 : Business Service Division
	'B2'		: Breakdown 2 : Config Admin Division
	'B3'		: Breakdown 3 : Business Service Criticality
	'[...]'		: Has 1 or more owner (See: Mapping - Business Partner)
	'[]'		: No owner
	'PS'		: PerfStat
	'BF'		: BigFix
	'FE'		: FireEye
	't0'		: No Tag
	't1'		: Tag - Support
	't2'		: Tag - Not Support
	'x'			: Tag - Excluded
	'i'			: In Scope
	'o'			: Out Of Scope
	'y'			: Installed
	'n'			: Not Installed
	'iv1'		: Invalid Business Service Division (Breakdown 1 has 'UNKNOWN')
	'iv2'		: Invalid Config Admin Division (Breakdown 2 is 'UNKNOWN')
	'iv3'		: Invalid Cost Center (Null or Unapproved or Out of valid_from/to Range)
	'-'			: Sub Delimiter for RR
Mapping - Business Partner:
//	Value		Label		Mapping
	1			F&R			Division = 'Financial & Risk - ALL'
	2			IP&S		Division = 'IP & Science - ALL'
	3			TRL			Division = 'Legal - ALL'
	4			TRTA		Division = 'Tax & Accounting - ALL'
	5			EBS			Sub-BU = 'Technology & Ops EBS'	
	6			ITS			Sub-BU = 'Technology & Ops- IT Services'
	7			REUTERS		Division = 'Reuters - ALL'
	8			GGO			Division = 'GGO - ALL'
	9			PLATFORM	Sub-BU = 'Technology & Ops - Platform'
	10			CORPORATE	Division = 'Thomson Reuters Corporate -ALL'  // Mapped Last : Excluded EBS, ITS, and PLATFORM
	12			NAWM		Name contains 'NAWM' or 'Wealth' // Mapped First
	0			UNKNOWN		<ELSE>
Mapping - Criticality:
//	Value		Label
	1			High
	2			Medium
	3			Low
	4			Not Assessed
	0			Unknown
Maintenance:
	This job which is in the 'CRA-CI-RR-J' sequence runs after 'CRA-CI-J' sequence.


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

// Main Program
var z_table = 'u_report_cmdb_completeness';
var z_fields = [
	'u_installation_code',
	'u_rr_business_service',
	'u_rr_business_service_cri',
	'u_rr_business_service_div',
	'u_rr_config_admin_group',
	'u_rr_config_admin_group_div',
	'u_rr_info_ps',
	'u_rr_info_bf',
	'u_rr_info_fe'
];
var z_now = gs.nowNoTZ();
var z_gdt = new GlideDateTime(z_now);
var z_dow = z_gdt.getDayOfWeekUTC();
runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -1000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_NOW | '+z_now+' GMT | DayOfWeek: '+z_dow, -999);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_CLEAR | '+clearData()+' rows were cleared', -900);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_UPSERT | '+processData()+' rows were updated,inserted', -800);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -100);
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CI-RR-J2 Run PA', -10);
}

// Processing Functions
function clearData() {
	// Global Variables (Main)
	var grc;				// Input : Current Record To Be Cleared
	var log = 0;			// Output : Log
	// Main Program
	grc = new GlideRecord(z_table);
	grc.addNotNullQuery(z_fields[0]);
	grc.query();
	while(grc.next()) {
		for(var i=0; i<z_fields.length; i++) {
			grc[z_fields[i]] = '';
		}
		grc.update();
		log++;
	}
	return log;
}

function processData() {

	// Global Variables (Main)
	var ci;					// Input : Current Record of CI <GlideRecord>
	var log = [0,0];		// Output : Log (2 paths : Updated,Excluded) <Array(Int(2))>
	// Global Variables (Sub)
	var z_tags_PSt1 = getTags('8ea7e5c713b7be80c9dfb6076144b004'); // Perfstat supported
	var z_tags_PSt2 = getTags('94a3b14713fbbe80c9dfb6076144b0ea'); // Perfstat not supported
	var z_tags_BFx  = getTags('5be0f16913850bc00cd0bd566144b090'); // exclude:bigfix
	var z_tags_FEx  = getTags('5d673a5513cb8340f44b30128144b0b9'); // Exclude:FireEye
	var z_tags_PSx  = getTags('e6379938138bcb00c032d7028144b083'); // exclude:perfstat
	
	// Main ETL Program
	ci = new GlideRecord('cmdb_ci');
	ci.addEncodedQuery('u_config_managed=yes^operational_statusNOT IN5,9^sys_class_nameIN'
		+'cmdb_ci_aix_server,cmdb_ci_unix_server,cmdb_ci_win_server,cmdb_ci_esx_server,cmdb_ci_osx_server'
		+',cmdb_ci_server,cmdb_ci_hpux_server,cmdb_ci_solaris_server,cmdb_ci_linux_server'
	/*	+'^sys_idSTARTSWITH77' // For_Test	*/
	);
	ci.orderByDesc('sys_created_on');
	ci.query();
	while(ci.next()) {
		useUpsertMethod(	// ETL Engine
			z_table,
			'u_configuration_item', ci.sys_id,
			'u_ci_last_updated_date', ci.sys_updated_on, z_fields
		);
	}
	return log.toString();

	// ETL Engine : EEZM_UI : Method of Update and Insert with multiple z variables and 2 log paths
	function useUpsertMethod(destn_table, destn_si, begin_si, destn_suo, begin_suo, destn_z) {
		var upz, inz;	// To Be Updated (or Inserted) Record <GlideRecord>
		var zCal, i;
		upz = new GlideRecord(destn_table);
		upz.addQuery(destn_si, begin_si);
		upz.query();
		if(upz.next()) {
			zCal = cal();	
			// log 0 : U : update the record if it is found in the destination table
				upz[destn_suo] = begin_suo;
				for(i=0; i<destn_z.length; i++) {
					upz[destn_z[i]] = zCal[i];
				}
				upz.update();
				log[0]++;
		} else {
			// log 1 : I : insert the record if it is not found in the destination table
			zCal = cal();
			inz = new GlideRecord(destn_table);
			inz.initialize();
			inz[destn_si] = begin_si;
			inz[destn_suo] = begin_suo;
			for(i=0; i<destn_z.length; i++) {
				inz[destn_z[i]] = zCal[i];
			}
			inz.insert();
			log[1]++;
		}
	}
	
	// Main Calculation
	function cal() {
		// Final Result Calculation
		var z = [];
		try { z = calCodeRR(); } catch(err) { z[0] = 'ErrorRR'; }
		return z;
	}
	
	// Sub Calculation : Code RR
	function calCodeRR() {
		// check if the record is excluded from RR
		var z_RR = 'RR';
		if(inList([6,8], ci.operational_status)) {
			z_RR = 'NonRR'+ci.operational_status;
			// return ['NonRR'+ci.operational_status,'','','','','','','',''];
		}
		
		// setup temporary variables
		var list_B1 = [];
		var list_B1_cri = [];
		var list_B1_div_id = [];
		var list_B1_div_name = [];
		var list_B3_cri = [];
		var flag_B1_div = ['','','','','','','','','','','','','','',''];
		var flag_B3_cri = ['','','','','',''];
		var obj_B1_div;
		var int_B3_cri;
		var has_BF = false;
		var has_FE = false;
		var collect = true;
		var i = 0;
		
		// query relations data
		var grq_RR = new GlideRecord('cmdb_rel_ci');
		grq_RR.addQuery('child.sys_id', ci.sys_id);
		grq_RR.addQuery('parent.sys_class_name', 'cmdb_ci_service');
		grq_RR.query();
		while(grq_RR.next()) {
			var y_BS = grq_RR.parent;
			var y_BS_cri = grq_RR.parent.busines_criticality;
			// check BF
			if(y_BS.sys_id == '3e853f53db200b04f66bf9fdbf96197b') { // Bigfix
				has_BF = true;
				collect = false;
			// check FE
			} else if(y_BS.sys_id == 'bad5bf17db200b04f66bf9fdbf961989') { // FireEye
				has_FE = true;
				collect = false;
			} else {
				collect = true;
			}
			// collect the business service (y_BS) to find its owner if it is neither BF nor FE
			if(collect) {
				// collect B1
				list_B1.push(y_BS.sys_id+'');
				// collect B1_cri
				list_B1_cri.push(
					y_BS.getDisplayValue()+'('+
					y_BS_cri.getDisplayValue()+')'
				);
				// collect flag : B1
				obj_B1_div = mapObj_PartnerBU(y_BS.department);
				if(inList_AssetTag_PGO(y_BS.asset_tag)) {
					flag_B1_div[9] = 'PLATFORM';
				}
				if(flag_B1_div[obj_B1_div.id] == '') {
					flag_B1_div[obj_B1_div.id] = obj_B1_div.name;
				}
				// collect flag : B3
				int_B3_cri = mapInt_Criticality(y_BS_cri.getDisplayValue());
				if(flag_B3_cri[int_B3_cri] == '') {
					flag_B3_cri[int_B3_cri] = 'Y';
				}
			}
		}
		// decode flag : B1
		for(i=0; i<flag_B1_div.length; i++) {
			if(flag_B1_div[i] != '') {
				list_B1_div_id.push(i);
				list_B1_div_name.push(flag_B1_div[i]);
			}
		}
		// decode flag : B3
		for(i=0; i<flag_B3_cri.length; i++) {
			if(flag_B3_cri[i] != '') {
				list_B3_cri.push(i);
			}
		}
		
		// assign to the z variables
		var z_rr_B1 = list_B1.toString();
		var z_rr_B1_cri = list_B1_cri.join(', ');
		var z_rr_B1_div = list_B1_div_name.join(', ');
		var z_rr_B2 = ci.support_group.sys_id+'';
		var z_rr_B2_div = mapObj_PartnerBU(ci.support_group.u_department).name;
		var z_rr_info_PS = '';
		var z_rr_info_BF = '';
		var z_rr_info_FE = '';
		
		// 0. initiate code of breakdowns
		var in_PS = true;
		var in_BF = true;
		var in_FE = /win/i.test(ci.u_managed_os.short_description);
		var is_ESX = ci.sys_class_name == 'cmdb_ci_esx_server';
		z_RR += '-B1[' + list_B1_div_id.toString() + ']';
		z_RR += '-B2[' + mapObj_PartnerBU(ci.support_group.u_department).id + ']';
		z_RR += '-B3[' + list_B3_cri.toString() + ']';
		
		// 1. build code of Perfstat (A1)
		// 1.1 write tag
		z_RR += '-PS';
		if(inList(z_tags_PSt1, ci.u_managed_os.sys_id)) {
			z_RR += 't1';
		} else if(inList(z_tags_PSt2, ci.u_managed_os.sys_id)) {
			z_RR += 't2';
			in_PS = false;
		} else {
			z_RR += 't0';
		}
		if(inList(z_tags_PSx, ci.sys_id)) {
			z_RR += 'x';
			in_PS = false;
		}
		// 1.2 write info
		z_RR += '-PS';
		z_rr_info_PS = writeInfo('Perfstat', in_PS && !is_ESX, ci.discovery_source.getDisplayValue() == 'Perfstat');
		
		// 2. build code of BigFix (A2)
		// 2.1 write tag
		z_RR += '-BF';
		if(inList(z_tags_BFx, ci.sys_id)) {
			z_RR += 't0x';
			in_BF = false;
		} else {
			z_RR += 't0';
		}
		// 2.2 write info
		z_RR += '-BF';
		z_rr_info_BF = writeInfo('BigFix', in_BF && !is_ESX, has_BF);
		
		// 3. build code of FireEye (A3)
		// 3.1 write tag
		z_RR += '-FE';
		if(inList(z_tags_FEx, ci.sys_id)) {
			z_RR += 't0x';
			in_FE = false;
		} else {
			z_RR += 't0';
		}
		// 3.2 write info
		z_RR += '-FE';
		z_rr_info_FE = writeInfo('FireEye', in_FE && !is_ESX, has_FE);
		
		// 4. build code of Invalid (iv)
		if(z_rr_B1_div.indexOf('UNKNOWN') > -1 || z_rr_B1_div == '') {
			z_RR += '-iv1';
		}
		if(z_rr_B2_div.indexOf('UNKNOWN') > -1 || z_rr_B2_div == '') {
			z_RR += '-iv2';
		}
		if( ci.cost_center.getDisplayValue() == ''
		 || ci.cost_center.valid_from.getDisplayValue() == ''
		 || ci.cost_center.valid_from.getDisplayValue() > z_now
		 || (ci.cost_center.valid_to.getDisplayValue() < z_now && ci.cost_center.valid_to.getDisplayValue() != '')
		 || ci.cost_center.u_approved_for_data_center_costs == false
		) {
			z_RR += '-iv3';
		}
		
		// end
		return [
			z_RR,
			z_rr_B1,
			z_rr_B1_cri,
			z_rr_B1_div,
			z_rr_B2,
			z_rr_B2_div,
			z_rr_info_PS,
			z_rr_info_BF,
			z_rr_info_FE
		];
		
		// Writing Functions
		function writeInfo(label, flag1, flag2) {
			var info = [''];
			if(flag1) {
				z_RR += 'i';
				info[1] = 'In Scope';
			} else {
				z_RR += 'o';
				info[1] = 'Out Of Scope';
			}
			if(flag2) {
				z_RR += 'y';
				info[2] = 'Installed';
			} else {
				z_RR += 'n';
				info[2] = 'Not Installed';
			}
			return label + ' ' + info[2] + ' | ' + label + ' ' + info[1];
		}
		
	}
	
}

// Supporting Functions for the Defined Rules
function mapObj_PartnerBU(gro) {
	// Input : gro <GlideRecordObject> : Department [cmn_department]
	var NAME = gro.name.toUpperCase();
	var sbu_id = gro.u_sbu.id;
	var div_id = gro.u_division.id;
	var z_obj;
	if(div_id == 'C1003') { z_obj = { id : 1, name : 'F&R' };
	} else if(div_id == 'C1327') { z_obj = { id : 2, name : 'IP&S' };
	} else if(div_id == 'C1328') { z_obj = { id : 3, name : 'TRL' };
	} else if(div_id == 'C6731') { z_obj = { id : 4, name : 'TRTA' };
	} else if(sbu_id == '10454') { z_obj = { id : 5, name : 'EBS' };
	} else if(sbu_id == 'C1369') { z_obj = { id : 6, name : 'ITS' };
	} else if(div_id == 'C6730') { z_obj = { id : 7, name : 'REUTERS' };
	} else if(div_id == 'C1002') { z_obj = { id : 8, name : 'GGO' };
	} else if(sbu_id == 'C6724') { z_obj = { id : 9, name : 'PLATFORM' };
	} else if(div_id == 'C1005') { z_obj = { id : 10, name : 'CORPORATE' };
	} else {
		z_obj = { id : 0, name : 'UNKNOWN' };
	}
	return z_obj;
}

function mapInt_Criticality(str) {
	// Input : Label of Choices from [cmdb_ci_service].[busines_criticality]
	switch(str.substr(0,3)) {
		case 'Hig': return 1;
		case 'Med': return 2;
		case 'Low': return 3;
		case 'Not': return 4;
		default: return 0;
	}
}

function inList_AssetTag_PGO(value) {
	if(inList([
'AIID202548','AIID202211','AIID200332','AIID200333','AIID200337','AIID200338','AIID200339','AIID200341',
'AIID200347','AIID200350','AIID200367','AIID201649','AIID201819','AIID201820','AIID201823','AIID201824',
'AIID201825','AIID201826','AIID201828','AIID201829','AIID201830','AIID201831','AIID201840','AIID201841',
'AIID201844','AIID202161','AIID202166','AIID202168','AIID202171','AIID202172','AIID202177','AIID202178',
'AIID202181','AIID202209','AIID202210','AIID202259','AIID202275','AIID202287','AIID202289','AIID202291',
'AIID202292','AIID202293','AIID202333','AIID202512','AIID202547','AIID202564','AIID202580','AIID202686',
'AIID202742','AIID202755','AIID202766','AIID202770','AIID202803','AIID202849','AIID202889','AIID202909',
'AIID202933','AIID202944','AIID202977','AIID202983','AIID203668','AIID203700','AIID203730','AIID203830',
'AIID203832','AIID203833','AIID203836','AIID203861','AIID203999','AIID204056','AIID204057','AIID204058',
'AIID204114','AIID204116','AIID204121','AIID204200','AIID204201','AIID204259','AIID204313','AIID204342',
'AIID204363','AIID204417','AIID204433'
	], value)) {
		return true;
	} else {
		return false;
	}
}

// Supporting Functions for Common Use
function getTags(si) {
	var result = [];
	var grq = new GlideRecord('label_entry');
	grq.addEncodedQuery('label='+si);
	grq.query();
	while(grq.next()) {
		result.push(grq.table_key+'');
	}
	return result;
}

function inList(Arr, value) {
	for(var i=0; i<Arr.length; i++) {
		if(value == Arr[i]) {
			return true;
		}
	}
	return false;
}

