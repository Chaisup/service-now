`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-CI-J1 Run ETL
Run : Weekly - Monday - 00:30:00 GMT
Relative : 0 months ago - 0 months ago


*/ Description
-------------------------------------------------------------------------------------------------------------------------

This ETL job is to upsert calculated 'u_completion_code' data into 'u_report_cmdb_completeness' table from 'cmdb_ci' table.
The result of the calculation is the string of codes that indicates the completeness each core field.
Version: 4.0
	Add CodeQ? for ODQ Dashboard
Version: 3.1
	At 02c7, change to hasTextBegin(['RFID','SMAT','SNAT'])
Version: 3.0
	Add Code18
Version: 2.1
	Change on calCodeActGroupList function
Example of Completion code:
    CORE[01c4,02c7,03c6,04c3,05c33,06c94,07c94,08m21,09c94,10c3,11c7,12c4,13c23,14c2,15c3,16c3,17c1,18c2]
    -ODQ[Q1c,Q2o,Q3i,Q4m]-B1[14,8]-B2[14]+B7[14,8,3,5]
Meaning:
	'01'/'02'/.../'18'	: Identifier of calculation code for each CORE Field
	'Q1'/'Q2'/.../'Q4'	: Identifier of calculation code for each ODQ Field
	'c' : Correct		: or Complete in ODQ Dashboard
	'i' : Incorrect
	  'iv' : Invalid
	  'ia' : Inactive
	  'if' : Conflicting
	'm' : Missing
	'o' : Out Of Scope
	'u' : Unknown		: Error flag : If this occurs, it must have something wrong and developer should check the code.
	'1'/'2'/.../'9'		: Identifier of logic path of the program
	','					: Small Delimiter
	'-'					: Big Delimiter
	'+'					: Extended Delimiter
	'CORE[...]'			: Set of CORE Fields
	'ODQ[...]'			: Set of ODQ Fields
	'B1[...]'			: Elements of ODQ Breakdown 1
	'B2[...]'			: Elements of ODQ Breakdown 2
	'B7[...]'			: Extended Code from job: CRA-CERT-CMDB-MTH-J1 Run ETL of CERT Breakdown 7
Maintenance:
	Set z_recal as true when it is need to recalculate the completeness because of rules changing.
	After executing the recalculation, set z_recal as false.


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

var z_recal = false;	// @-REAL-MODE
var z_classes = defineClasses();
runCustomScript(z_recal);

// Logging Function
function runCustomScript(z_recal) {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -1000);
	CRA_PA_WriteJobLog(current.sys_id, 'RUN_ETL_1 | '+deleteData()+' rows were deleted', -900);
	CRA_PA_WriteJobLog(current.sys_id, 'RUN_ETL_2 | '+processData(z_recal)+' rows were skipped,discarded,updated,inserted,rejected', -800);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -100);
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CI-J2 Run UI', -10);	// @-REAL-MODE
}

// Processing Functions
function deleteData() {

	// Global Variables (Main)
	var grd;				// Input : Current Record To Be Deleted
	var log = 0;			// Output : Log
	
	// Main ETL Program (Delete)
	grd = new GlideRecord('u_report_cmdb_completeness');
	grd.addEncodedQuery('u_configuration_item.sys_idISEMPTY^NQ'
		+'u_configuration_item.u_config_managed!=yes^ORu_configuration_item.u_config_managed=^'
		+'u_configuration_item.sys_class_nameNOT IN'+z_classes['ODQ'].join()
	);
	grd.query();
	while(grd.next()) {	
		grd.deleteRecord();
		log++;
	}
	return log;
	
}

function processData(z_recal) {

	// Global Variables (Main)
	var ci;					// Input : Current Record of CI <GlideRecord>
	var log = [0,0,0,0,0];	// Output : 5 Log Paths: S,D,U,I,R

    // Global Variables (Sub)
	var yDeviceType;
	var yInDBGroup;
	var yInNetGroup;
	var yInServGroup;
	var yUpstreamServices;
	var z;
	
	// Main ETL Program (Upsert)
	ci = new GlideRecord('cmdb_ci');
	ci.addEncodedQuery('u_config_managed=yes^ORsys_class_nameIN'+z_classes['ODQ'].join());	// @-REAL-MODE
	ci.orderByDesc('sys_created_on');
	ci.query();
	while(ci.next()) {	
		useUpsertMethod(	// ETL Engine
			'u_report_cmdb_completeness',
			'u_configuration_item', ci.sys_id,
			'u_ci_last_updated_date', ci.sys_updated_on, (!z_recal),
			'u_completion_code'
		);
	}
	return log.toString();

	// ETL Engine : EEZ1_SDUIR+ : Method of Upsert with z variable and 4 log paths
	function useUpsertMethod(destn_table, destn_si, begin_si, destn_suo, begin_suo, use_suo, destn_z) {
		var upz, inz;		// To Be Updated (or Inserted) Record <GlideRecord>
		var zCal;
		upz = new GlideRecord(destn_table);
		upz.addQuery(destn_si, begin_si);
		upz.query();
		if(upz.next()) {
			if(use_suo && upz[destn_suo] == begin_suo) {
				// log 0 : skip the record if sys_updated_on (suo) was not changed
				log[0]++;
			} else {
                // separate code by +
                var code1 = upz[destn_z]+'';
                var code2 = '';
                var plus = code1.indexOf('+');
                if(plus > -1) {
                    code2 = code1.substring(plus);
                    code1 = code1.substring(0, plus);
                }
                zCal = cal();
				if(code1 == zCal) {
					// log 1 : discard the calculated result if it is not different (but, suo was updated)
					upz[destn_suo] = begin_suo;
					upz.update();
					log[1]++;
				} else {
					// log 2 : update the record if the calculated result was changed
					upz[destn_suo] = begin_suo;
					upz[destn_z] = zCal + code2;
					upz.update();
					log[2]++;
				}
			}
		} else {
			zCal = cal();
			if(zCal) {
				// log 3 : insert the record if it is new
				inz = new GlideRecord(destn_table);
				inz.initialize();
				inz[destn_si] = begin_si;
				inz[destn_suo] = begin_suo;
				inz[destn_z] = zCal;
				inz.insert();
				log[3]++;
			} else {
				// log 4 : reject the record if the calculation result is empty
				log[4]++;
			}
		}
	}
	
	// Main Calculation : All Calculating Functions
	function cal() {
        // Reusable Data Preparation for each Record in While Loop
		yDeviceType = getDeviceType(ci.sys_class_name, ci.sys_id);
		yInDBGroup = inList(z_classes['DB'], ci.sys_class_name);
		yInNetGroup = inList(z_classes['Net'], ci.sys_class_name);
		yInServGroup = inList(z_classes['Serv'], ci.sys_class_name);
		yUpstreamServices = getUpstreamServices(ci.sys_id);
		// Scope Data Preparation for each Calculating Sequence
		var Config_Managed = (ci.u_config_managed == 'yes');
		var ODQ_Scope = (yInServGroup || yInNetGroup || isODQ_Storage(ci) || isODQ_Database(ci));
		// Final Result
		z = {};
		// 1. CORE Fields Scope
		if(Config_Managed) {
			z['C'] = 'CORE[';
			try { z['01'] = calCode01(); } catch(err) { z['01'] = '01u'; } finally { z['01'] += ','; }
			try { z['02'] = calCode02(); } catch(err) { z['02'] = '02u'; } finally { z['02'] += ','; }
			try { z['03'] = calCode03(); } catch(err) { z['03'] = '03u'; } finally { z['03'] += ','; }
			try { z['04'] = calCode04(); } catch(err) { z['04'] = '04u'; } finally { z['04'] += ','; }
			try { z['05'] = calCode05(); } catch(err) { z['05'] = '05u'; } finally { z['05'] += ','; }
			try { z['06'] = calCode06(); } catch(err) { z['06'] = '06u'; } finally { z['06'] += ','; }
			try { z['07'] = calCode07(); } catch(err) { z['07'] = '07u'; } finally { z['07'] += ','; }
			try { z['08'] = calCode08(); } catch(err) { z['08'] = '08u'; } finally { z['08'] += ','; }
			try { z['09'] = calCode09(); } catch(err) { z['09'] = '09u'; } finally { z['09'] += ','; }
			try { z['10'] = calCode10(); } catch(err) { z['10'] = '10u'; } finally { z['10'] += ','; }
			try { z['11'] = calCode11(); } catch(err) { z['11'] = '11u'; } finally { z['11'] += ','; }
			try { z['12'] = calCode12(); } catch(err) { z['12'] = '12u'; } finally { z['12'] += ','; }
			try { z['13'] = calCode13(); } catch(err) { z['13'] = '13u'; } finally { z['13'] += ','; }
			try { z['14'] = calCode14(); } catch(err) { z['14'] = '14u'; } finally { z['14'] += ','; }
			try { z['15'] = calCode15(); } catch(err) { z['15'] = '15u'; } finally { z['15'] += ','; }
			try { z['16'] = calCode16(); } catch(err) { z['16'] = '16u'; } finally { z['16'] += ','; }
			try { z['17'] = calCode17(); } catch(err) { z['17'] = '17u'; } finally { z['17'] += ','; }
			try { z['18'] = calCode18(); } catch(err) { z['18'] = '18u'; } finally { z['18'] += ']'; } // last
		}
		// 2. ODQ Fields Scope
		if(ODQ_Scope && Config_Managed && inList([2,6,7,10], ci.operational_status)) {
			z['Q'] = '-ODQ[';
			try { z['Q1'] = calCodeQ1(); } catch(err) { z['Q1'] = 'Q1u'; } finally { z['Q1'] += ','; }
			try { z['Q2'] = calCodeQ2(); } catch(err) { z['Q2'] = 'Q2u'; } finally { z['Q2'] += ','; }
			try { z['Q3'] = calCodeQ3(); } catch(err) { z['Q3'] = 'Q3u'; } finally { z['Q3'] += ','; }
			try { z['Q4'] = calCodeQ4(); } catch(err) { z['Q4'] = 'Q4u'; } finally { z['Q4'] += ']'; } // last
        }
        // 3. ODQ Breakdowns Scope
        if(ODQ_Scope) {
			z['QST'] = '-ST['+ci.operational_status+']';
			z['QCM'] = '-CM['+(Config_Managed ? 'y' : 'n')+']';
            z['QB1'] = '-B1[';
			try { z['B1'] = calCodeB1(); } catch(err) { z['B1'] = 'u'; } finally { z['B1'] += ']'; } // last
            z['QB2'] = '-B2[';
			try { z['B2'] = calCodeB2(); } catch(err) { z['B2'] = 'u'; } finally { z['B2'] += ']'; } // last
        }
		// Final Output
		var zo = '';
		for(var i in z) {
			zo += z[i];
		}
		return zo;
	}
	
	// Sub Calculation : Code 01 : Name
	function calCode01() {
		// [Name] is empty
		if(ci.name == '') { 
			return '01m1';
		// [Name] starts with 'cpu'
		} else if(ci.name.indexOf('cpu') == 0) { 
			return '01iv2';
		// [Name] contains invalid character as defined
		} else if(matchInvalidName(ci.name)) { 
			return '01iv3';
		} else {
			return '01c4';
		}
	}
	
	// Sub Calculation : Code 02 : Asset Tag
	function calCode02() {
		// [Asset] is empty
		if(ci.asset.getDisplayValue() == '') { 
			return '02c1';
		// [Class Name] in (database,db2,mssql,oracle)
		} else if(yInDBGroup) { 
			return '02c2';
		// [Class Name] = Mass Storage Devices  and [Device Type] = NAS vFiler
		} else if( ci.sys_class_name == 'cmdb_ci_msd' 
				&& yDeviceType == 'NAS vFiler' ) {
			return '02c3';
		// [Asset Tag] is empty
		} else if(ci.asset_tag == '') {
			return '02m4';
		// 1) [CI.Operational Status] look up in table [MAP.u_operational_status_mapping]
		// 2) Conflict when [CI.Operational Status] exists in MAP table
		//					[CI.Operational sub status] <> [MAP.Operational Sub Status]
		//					[CI.Asset.State] <> [MAP.Asset State]
		//					[CI.Asset.Substate] <> [MAP.Asset Substate]
		} else if(hasConflictStatus(ci.operational_status,
			ci.u_operational_sub_status,
			ci.asset.install_status,
			ci.asset.substatus
		)) {
			return '02if5';
		// count no.of record where [Asset Tag] more than 1 record and [Operationa Station] Not Decommissioned
		} else if(countNonDecomCI(ci.asset_tag) > 1 && ci.operational_status != 9) {
			return '02if6';
		// [Asset Tag] begin with this text
		} else if(hasTextBegin(['RFID','SMAT','SNAT'], ci.asset_tag)) {
			return '02c7';
		} else {
			return '02iv8';
		}
	}
	
	// Sub Calculation : Code 03 : Serial Number
	function calCode03() {
		// [Asset] is empty
		if(ci.asset.getDisplayValue() == '') {
			return '03c1';
		// [Class Name] in (database,db2,mssql,oracle)
		} else if(yInDBGroup) {
			return '03c2';
		// [Class Name] = Mass Storage Devices  and [Device Type] = NAS vFiler
		} else if( ci.sys_class_name == 'cmdb_ci_msd'
				&& yDeviceType == 'NAS vFiler' ) {
			return '03c3';
		// [Serial Number] is empty
		} else if(ci.serial_number == '') {
			return '03m4';
		// [Serial Number] match with specified in list then invalid 
		} else if(matchInvalidSerNo(ci.serial_number)) {
			return '03iv5';
		} else {
			return '03c6';
		}
	}
	
	// Sub Calculation : Code 04 : Environment
	function calCode04() {
		// [Environment] is empty
		if(ci.u_environment == '') {
			return '04m1';
		// [Environemnt] = Lab and [Customer Facing] <> Lab
		} else if( ci.u_environment.getDisplayValue() == 'Lab'
				&& ci.u_customer_facing.getDisplayValue() != 'Lab' ) {
			return '04iv2';
		} else {
			return '04c3';
		}
	}
	
	// Sub Calculation : Code 05 : Cost Center
	function calCode05() {
		// [Operational Status] not in (Inactive,Build complete,Pending decommission,Commissioned)
		if(!inList([2,7,8,10], ci.operational_status)) {
			return '05c1';
		// [Cost Center] is empty
		} else if(ci.cost_center.getDisplayValue() == '') {
			return '05m2';
		// [Cost Center] exists in cmn_cost_center table
		} else if(existsRef('cmn_cost_center', ci.cost_center)) {
			// time of now (nowNoTZ) not between [valid_from] and [valid_to]
			if(onInvalidTime(ci.cost_center.valid_from, ci.cost_center.valid_to)) {
				return '05ia31';
			// [Cost Center.Approved for Data Center Costs] = false
			} else if(!ci.cost_center.u_approved_for_data_center_costs) {
				return '05iv32';
			} else {
				return '05c33';
			}	
		} else {
			return '05iv4';
		}
	}
	
	// Sub Calculation : Code 06 : Config Admin Group
	function calCode06() {
		// [Operational Status] not in (Inactive,Build complete,Pending decommission,Commissioned)
		if(!inList([2,7,8,10], ci.operational_status)) {
			return '06c1';
		// [Config Admin Group] is empty	
		} else if(ci.support_group.getDisplayValue() == '') {
			return '06m2';
		} else {
		  // 1. if exist in [SYS_USER_GROUP] table
		  //	   Inactive : [SYS_USER_GROUP.ACTIVE] = 'false' THEN 'Inactive'	
		  //	   Invalid  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] does not contain 'Incident'
		  //	   Correct  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] contain 'Incident'
		  // 2. if not exist in [SYS_USER_GROUP] table		  
		  //	   Invalid 
			return '06'+calCodeActGroupList([ci.support_group], 'incident');
		}
	}
	
	// Sub Calculation : Code 07 : Support Group
	function calCode07() {
		// [Support Group] and [Support Group L2] and [Support Group L3] are empty
		if( ci.assignment_group.getDisplayValue() == ''
		 && ci.u_support_group_l2.getDisplayValue() == ''
		 && ci.u_support_group_l3.getDisplayValue() == ''
		) {
			return '07c1';
		} else {
		  // 1. if exist in [SYS_USER_GROUP] table
		  //	   Inactive : [SYS_USER_GROUP.ACTIVE] = 'false'
		  //	   Invalid  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] does not contain 'Incident'
		  //	   Correct  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] contain 'Incident'
		  // 2. if not exist in [SYS_USER_GROUP] table		  
		  //	   Invalid 
			return '07'+calCodeActGroupList(getSupGroupList(
				ci.assignment_group, 
				ci.u_support_group_l2, 
				ci.u_support_group_l3
			), 'incident');
		}
	}
	
	// Sub Calculation : Code 08 : IT Service
	function calCode08() {
		// [Class] is not one of ServerGroup
		if(!yInServGroup) {
			return '08c1';
		} else {
			// [Function] is one of FunctionGroup
			if(inList_FuncGroup(ci.u_function.getDisplayValue())) {
				if(!hasTextContain(['Appli'], yUpstreamServices)) {
					return '08m21';
				} else if(hasTextContain(['Appli:Decom'], yUpstreamServices)) {
					return '08ia22';
				} else {
					return '08c23';
				}
			// [Function] is not one of FunctionGroup
			} else {
				if(!hasTextContain(['Appli', 'Infra'], yUpstreamServices)) {
					return '08m31';
				} else if(hasTextContain(['Appli:Decom', 'Infra:Decom'], yUpstreamServices)) {
					return '08ia32';
				} else {
					return '08c33';
				}
			}
		}
	}
	
	// Sub Calculation : Code 09 : Change Group
	function calCode09() {
		// [Operational Status] not in (Inactive,Build complete,Pending decommission,Commissioned)
		if(!inList([2,7,8,10], ci.operational_status)) {
			return '09c1';
		// [Change Approval Group] is empty
		} else if(ci.u_change_approval_groups == '') {
			return '09m2';
		} else {
			// 1. if exist in [SYS_USER_GROUP] table
			//	   Inactive : [SYS_USER_GROUP.ACTIVE] = 'false'
			//	   Invalid  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] does not contain 'Incident'
			//	   Correct  : [SYS_USER_GROUP.ACTIVE] = 'true' and [SYS_USER_GROUP.TYPE] contain 'Incident'
			// 2. if not exist in [SYS_USER_GROUP] table		  
			//	   Invalid 
			return '09'+calCodeActGroupList(ci.u_change_approval_groups.toString().split(','), 'change');
		}
	}
	
	// Sub Calculation : Code 10 : Model
	function calCode10() {
		// [Model Id] is empty or [Manufacturer] is empty
		if( ci.model_id.getDisplayValue() == '' 
		 || ci.manufacturer.getDisplayValue() == '') {
			return '10m1';
		// [Model Id] = Unknown or [Manufacturer] = Unknown
		} else if( ci.model_id.getDisplayValue() == 'Unknown' 
				|| ci.manufacturer.getDisplayValue() == 'Unknown') {
			return '10iv2';
		// [Model Id] exists in CMDB_MODEL table and [Manufacturer] exists in CORE_COMPANY table
		} else if( existsRef('cmdb_model', ci.model_id) 
				&& existsRef('core_company', ci.manufacturer)) {
			return '10c3';
		} else {
			return '10iv4';
		}
	}
	
	// Sub Calculation : Code 11 : Primary IP
	function calCode11() {
		// [Class] is one of DatabaseGroup(inList_DBGroup)
		if(yInDBGroup) {
			return '11c1';
		// [Class] is Mass Storage Devices and [Device Type] is 'NAS Shelf'
		} else if( ci.sys_class_name == 'cmdb_ci_msd' 
				&& yDeviceType == 'NAS Shelf') {
			return '11c2';
		// [Model Id] in List of model (inList_ExcpModel)
		} else if( inList_ExcpModel(ci.model_number) ) {
			return '11c3';
		// [Class] is one of NetwordkGroup(inList_NetGroup) and [Device Type] in ('Power Supply', 'Tap', 'Timer', 'Fan')
		} else if( yInNetGroup 
				&& inList(['Power Supply', 'Tap', 'Timer', 'Fan'], 
					yDeviceType)) {
			return '11c4';
		// [IP Address] is empty
		} else if(ci.ip_address == '') {
			return '11m5';
		// [IP Address] start with 0
		} else if(ci.ip_address.indexOf('0') == 0) {
			return '11iv6';
		} else {
			return '11c7';
		}
	}
	
	// Sub Calculation : Code 12 : Customer Facing
	function calCode12() {
		// [Operational Status] not in (Inactive,Installed,Build complete,Commissioned)
		if(!inList([2,6,7,10], ci.operational_status)) {
			return '12c1';
		// [Customer Facing] is empty
		} else if(ci.u_customer_facing == '') {
			return '12m2';
		// [Environment] <> Lab and [Customer Facing] = Lab
		} else if( ci.u_environment.getDisplayValue() != 'Lab'
				&& ci.u_customer_facing.getDisplayValue() == 'Lab' ) {
			return '12iv3';
		} else {
			return '12c4';
		}
	}
	
	// Sub Calculation : Code 13 : Location
	function calCode13() {
		// [Location] is empty
		if(ci.location.getDisplayValue() == '') {
			return '13m1';
		// [Location] is not empty
		// and [Location] exists in CMN_LOCATION table
		} else if(existsRef('cmn_location', ci.location)) {
			// [Location.Status] in ('Closed', 'Divested')
			if(inList(['Closed', 'Divested'], ci.location.u_status.getDisplayValue())) {
				return '13ia21';
			// [Location.Status] not in ('Closed', 'Divested')
			// and [Location.Location Barcode] not start with ('H', 'S')
			} else if(!hasTextBegin(['H', 'S'], ci.location.u_bar_code)) {
				return '13iv22';
			// [Location.Status] not in ('Closed', 'Divested')
			// and [Location.Location Barcode] start with ('H', 'S')
			} else {
				return '13c23';
			}
		// [Location] is not empty 
		// and [Location] not exists in CMN_LOCATION table
		} else {
			return '13iv3';
		}
	}
	
	// Sub Calculation : Code 14 : Class
	function calCode14() {
		// [Class] is empty (but impossible)
		if(ci.sys_class_name == '') {
			return '14m1';
		// [Class] is not empty
		// and [Class] does not has [Device type] exists in sys_choice
		} else if(!yDeviceType) {
			return '14c2';
		// [Class] have [Device type] exists in sys_choice
		} else {
			// To be correct, value of [Device type] must exists in sys_choice
			if(existsChoice(ci.sys_class_name, 'device_type', yDeviceType)) {
				return '14c31';
			} else {
				return '14iv32';
			}
		}
	}
	
	// Sub Calculation : Code 15 : Operational Status
	function calCode15() {
		// [Operational Status] is empty
		if(ci.operational_status == '') {
			return '15m1';
		// [Operational Status] is not empty
		// [Operational Status] is 'inactive' and [sys_updated_on] less than 60 days
		} else if( ci.operational_status == 2 // Inactive
				&& ci.sys_updated_on < gs.daysAgoStart(60) ) {
			return '15iv2';
		// [Operational Status] is not empty
			// and [Operational Status] is not 'inactive' 
			// and [sys_updated_on] more than or equal 60 days
		} else {
			return '15c3';
		}
	}
	
	// Sub Calculation : Code 16 : Service Level Device
	function calCode16() {
		// [Support Group.Department] is not "Technology & Ops - Data Center & Infrastructure Services"
		if(ci.support_group.u_department.id != '10978') {
			return '16c1';
		// [Support Group.Department] is "Technology & Ops - Data Center & Infrastructure Services"
		// [Class] isn't one of ServerGroup
		} else if(!yInServGroup) {
			return '16c2';
		// [Support Group.Department] is "Technology & Ops - Data Center & Infrastructure Services"
		// [Class] is one of ServerGroup
		// [Service tier] in ('Basic','Custom','Managed','Not Applicable')
		} else if(inList(['Basic','Custom','Managed','Not Applicable'], 
			ci.u_service_tier.getDisplayValue())) {
			return '16c3';
		// [Support Group.Department] is "Technology & Ops - Data Center & Infrastructure Services"
		// [Class] is one of ServerGroup
		// [Service tier] not in ('Basic','Custom','Managed','Not Applicable')	
		} else {
			return '16iv4';
		}
	}
	
	// Sub Calculation : Code 17 : Service Level Database
	function calCode17() {
		// [Class] is not one of DatabaseGroup
		if( !yInDBGroup
		 && ci.sys_class_name != 'cmdb_ci_db_db2_catalog') {
			return '17c1';
		// [Class] is one of DatabaseGroup	
		// and [Function] does not contain "Database"
		} else if(ci.u_function.getDisplayValue().indexOf('Database') == -1) {
			return '17c2';
		// [Class] is one of DatabaseGroup	
		//  and [Function] does not contain "Database"
		//  and [Support group <L1 or L2 or L3>] is not in the defined list   
		/* Sriisara.L this case must be not match so correct >>> missing '!' */
		} else if(matchSupGroup(getSupGroupList(ci.assignment_group.name, ci.u_support_group_l2.name, ci.u_support_group_l3.name))) {
			return '17c3';
		// [Class] is one of DatabaseGroup	
			//  and [Function] does not contain "Database"
			//  and [Support group <L1 or L2 or L3>] in the defined list
			//  and [Service tier] is empty
		} else if(ci.u_service_tier.getDisplayValue() === '') {
			return '17m4';
		// [Class] is one of DatabaseGroup	
			//  and [Function] does not contain "Database"
			//  and [Support group <L1 or L2 or L3>] in the defined list
			//  and [Service tier] is not empty
			//  and [Service tier] is one of [ServerTiers, "Premium Managed"]
		} else if(inList(['Basic','Custom','Managed','Not Applicable','Premium Managed'], 
			ci.u_service_tier.getDisplayValue())) {
			return '17c5';
		// [Class] is one of DatabaseGroup	
			//  and [Function] does not contain "Database"
			//  and [Support group <L1 or L2 or L3>] in the defined list
			//  and [Service tier] is not empty
			//  and [Service tier] isn't one of [ServerTiers, "Premium Managed"]
		} else {
			return '17iv6';
		}
	}
	
	
	// Sub Calculation : Code 18 : Managed Operating System
	function calCode18() {
		// [Class] is not one of ServerGroup
		if(!yInServGroup) {
			return '18c1';
		// [Managed Operating System ] is null
		} else if(ci.u_managed_os.getDisplayValue() === '') {
			return '18m5';
		// [Managed Operating System ] exists in Software Model table	
		} else if(existsRef('cmdb_software_product_model', ci.u_managed_os)) {
			// [OS is true]
			if(ci.u_managed_os.u_os) {
				return '18c2';
			} else {
				return '18iv3';
			}
		} else {
			return '18iv4';
		}
	}

	// Sub Calculation : Code 19 : (Unknown)
	/* NOT USE
	function calCode19() {
		// develop new code here instead of this "NOT USE" comment
		return '19u';
	}
	*/

	// Sub Calculation : Code Q1 : Location
	function calCodeQ1() {
		// Without Scope
		if(ci.ref_cmdb_ci_netgear.device_type.getDisplayValue() != 'Circuit') { // Exclude (Device Type = Circuit)
			return 'Q1'+z['13'].substr(2,1); // Same as Code 13
		} else {
			return 'Q1o';
		}
	}

	// Sub Calculation : Code Q2 : Business Service
	function calCodeQ2() {
		// With Scope
		if(!inList([2,7,10], ci.operational_status)) {
			return 'Q2o0';
		// Missing
		} else if(!hasTextContain(['Appli', 'Infra'], yUpstreamServices)) {
			return 'Q2m1';
		// Case: Server
		} else if(yInServGroup) {
			// [Function] is one of FunctionGroup
			if(inList_FuncGroup(ci.u_function.getDisplayValue())) {
				// Has at least 1 Non-Decommissioned of [Application Service] only
				if(hasTextContain(['Appli:NonDe'], yUpstreamServices)) {
					return 'Q2c2';
				} else {
					return 'Q2i2';
				}
			// [Function] is not one of FunctionGroup
			} else {
				// Has at least 1 Non-Decommissioned of [Application Service] or [Infrastructure Service]
				if(hasTextContain(['Appli:NonDe', 'Infra:NonDe'], yUpstreamServices)) {
					return 'Q2c3';
				} else {
					return 'Q2i3';
				}
			}
		// Case: Network, Storage, Database
		} else {
			// Has at least 1 Non-Decommissioned of [Application Service] or [Infrastructure Service]
			if(hasTextContain(['Appli:NonDe', 'Infra:NonDe'], yUpstreamServices)) {
				return 'Q2c4';
			} else {
				return 'Q2i4';
			}
		}
	}

	// Sub Calculation : Code Q3 : Cost Center
	function calCodeQ3() {
		// Without Scope
		if(inList([2,7,10], ci.operational_status)) {
			return 'Q3'+z['05'].substr(2,1); // Same as Code 05
		} else {
			// [Cost Center] is empty
			if(ci.cost_center.getDisplayValue() === '') {
				return 'Q3m';
			// [Cost Center] exists in cmn_cost_center table
			} else if(existsRef('cmn_cost_center', ci.cost_center)) {
				// time of now (nowNoTZ) not between [valid_from] and [valid_to]
				if(onInvalidTime(ci.cost_center.valid_from, ci.cost_center.valid_to)) {
					return 'Q3i';
				// [Cost Center.Approved for Data Center Costs] = false
				} else if(!ci.cost_center.u_approved_for_data_center_costs) {
					return 'Q3i';
				} else {
					return 'Q3c';
				}	
			} else {
				return 'Q3i';
			}
		}
	}

	// Sub Calculation : Code Q4 : Config Admin Group
	function calCodeQ4() {
		// With Scope
		if(inList([2,7,10], ci.operational_status)) {
			return 'Q4'+z['06'].substr(2,1); // Same as Code 06
		} else {
			return 'Q4o';
		}
	}

	// Sub Calculation : Code B1 : Accountable Division
	function calCodeB1() {
		// query ci relations data
		var list = [];
		var rci = new GlideRecord('cmdb_rel_ci');
		rci.addQuery('child.sys_id', ci.sys_id);
		rci.addQuery('parent.sys_class_name', 'cmdb_ci_service');
		rci.addNotNullQuery('parent.department');
		rci.query();
		while(rci.next()) {
			// 1. collect by department of BS
			collect_list(mapInt_PartnerBU(rci.parent.department));
			// 2. collect by asset tag of CI
			if(inList_AssetTag_PGO(rci.parent.asset_tag)) {
				collect_list(9); // PLATFORM
			}
		}
		return list.toString();

		// Collecting Function
		function collect_list(elem) {
			if(list.indexOf(elem) == -1) {
				list.push(elem);
			}
		}
	}

	// Sub Calculation : Code B2 : Responsible Division
	function calCodeB2() {
		return mapInt_PartnerBU(ci.support_group.u_department);
	}
	
}

// Supporting Functions for Defined Rules of CI
function calCodeActGroupList(si_list, itil_type) {
	/* Rules of ActGroup
		1. Invalid : if it does not exist in [sys_user_group] table
		2. Inactive : if it is not active 
		3. Invalid : if it does not have "incident" type
		4. Correct : if it passes the rules above
	*/
	var group;
	for(var i=0; i<si_list.length; i++) {
		group = new GlideRecord('sys_user_group');
		group.addQuery('sys_id', si_list[i]);
		group.query();
		if(group.next()) {
			if(!group.active) {
				return 'ia92'; // Rule 2
			}
			if(group.type.getDisplayValue().indexOf(itil_type) == -1) {
				return 'iv93'; // Rule 3
			}
		} else {
			return 'iv91';// Rule 1
		}
	}
	return 'c94'; // Rule 4
}

function countNonDecomCI(ci_asset_tag) {
	// count number of Non-Decommissioned CIs that have the same asset_tag
	var gr = new GlideRecord('cmdb_ci');
	gr.addQuery('asset_tag', ci_asset_tag);
	gr.addQuery('operational_status', '!=', 9); // Not Decommissioned
	gr.query();
	return gr.getRowCount();
}

function getDeviceType(ci_class, ci_si) {
	// find device_type information using an extended CI record (xci)
	if(existsChoice(ci_class, 'device_type')) {
		var xci = new GlideRecord(ci_class);
		xci.get(ci_si);
		return xci.device_type.getDisplayValue()+'';
	} else {
		return false;
	}
}

function getSupGroupList(ci_sg_1, ci_sg_2, ci_sg_3) {
	var result = [];
	if(ci_sg_1) {
		result.push(ci_sg_1);
	}
	if(ci_sg_2) {
		result.push(ci_sg_2);
	}
	if(ci_sg_3) {
		result.push(ci_sg_3);
	}
	return result;
}

function getUpstreamServices(ci_si) {
	var result = [];
	// find related parents that are Business Services of the CI
	var rci = new GlideRecord('cmdb_rel_ci');
	rci.addQuery('child', ci_si);
	rci.addQuery('parent.sys_class_name', 'cmdb_ci_service');
	rci.query();
	if(rci.hasNext()) {
		while(rci.next()) {
			// pack data of those parents in a code of string
			var pci = new GlideRecord('cmdb_ci_service');
			pci.get(rci.parent);
			result.push(
				// It is enough to trim only first 5 characters. (e.g. ['Appli:Decom', 'Infra:NonDe'])
				pci.service_classification.getDisplayValue().substr(0,5) +':'+
				(pci.operational_status.getDisplayValue().substr(0,5) == 'Decom' ? 'Decom' : 'NonDe')
			);
		}
	}
	return result.join();
}

function hasConflictStatus(ci_status, ci_substatus, asset_status, asset_substatus) {
	/* Rules
		1. All 4 arguments must align with 4 fields in [u_operational_status_mapping] table.
			field 1 = [u_operational_status] (mandatory)
			field 2 = [u_operational_sub_status]
			field 3 = [u_asset_state]
			field 4 = [u_asset_substate]
		2. An empty cell within last 3 fields of this table means: 
			An argument to compare with that field can be anything.
		3. If not all arguments align with 4 fields, the CI record is conflicting.
	*/
	var map = new GlideRecord('u_operational_status_mapping');
	map.addQuery('u_operational_status', ci_status); // query field 1 (mandatory)
	map.query();
	while(map.next()) {
		// compare field 2
		if( map.u_operational_sub_status !== '' && map.u_operational_sub_status != ci_substatus ) {
			continue;
		}
		// compare field 3
		if( map.u_asset_state !== '' && map.u_asset_state != asset_status ) {
			continue;
		}
		// compare field 4
		if( map.u_asset_substate !== '' && map.u_asset_substate != asset_substatus ) {
			continue;
		}
		// if found a map record that all arguments align with 4 fields
		return false; 
	}
	return true;
}

function mapInt_PartnerBU(dept) {
	// Input : Department [cmn_department]
	var sbu_id = dept.u_sbu.id;
	var div_id = dept.u_division.id;
	if(div_id == 'C1003') {
		var NAME = dept.name.toUpperCase();
		if(NAME.indexOf('NAWM') > -1 || NAME.indexOf('WEALTH') > -1) {
			return 12; // NAWM
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

function defineClasses() {
	// define user lists
	var lists = {
		DB : [
			'cmdb_ci_database',
			'cmdb_ci_db_db2_instance',
			'cmdb_ci_db_mssql_instance',
			'cmdb_ci_db_ora_instance'
		],
		Net : [
			'cmdb_ci_netgear',
			'cmdb_ci_ip_firewall',
			'cmdb_ci_ip_router',
			'cmdb_ci_ip_switch',
			'cmdb_ci_lb',
			'cmdb_ci_lb_ace',
			'cmdb_ci_lb_bigip',
			'cmdb_ci_lb_cisco_csm',
			'cmdb_ci_lb_cisco_css',
			'cmdb_ci_lb_f5_gtm',
			'cmdb_ci_lb_f5_ltm',
			'cmdb_ci_lb_netscaler',
			'cmdb_ci_lb_radware'
		],
		Serv : [
			'cmdb_ci_server',
			'cmdb_ci_netware_server',
			'cmdb_ci_linux_server',
			'cmdb_ci_unix_server',
			'cmdb_ci_win_server',
			'cmdb_ci_hpux_server',
			'cmdb_ci_solaris_server',
			'cmdb_ci_aix_server',
			'cmdb_ci_esx_server',
			'cmdb_ci_osx_server'
		],
		Stor : [
			'cmdb_ci_msd'
		]
	};
	// derive user lists and return
	lists['ODQ'] = lists['DB'].concat(lists['Net']).concat(lists['Serv']).concat(lists['Stor']);
	return lists;
}

function inList_AssetTag_PGO(value) {
	return inList([
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
	], value);
}

function inList_ExcpModel(value) {
	return inList([
		'MOD02475',	'MOD02476',	'MOD02477',	'MOD02481',	'MOD02482',	'MOD02483',	'MOD02484',	'MOD02485',
		'MOD02489',	'MOD02549',	'MOD02550',	'MOD02551',	'MOD02552',	'MOD02643',	'MOD02644',	'MOD02370',
		'MOD05233',	'MOD04255',	'MOD04256',	'MOD04569',	'MOD04570',	'MOD04571',	'MOD04672',	'MOD03795',
		'MOD03641',	'MOD03642',	'MOD01394',	'MOD01395',	'MOD01396',	'MOD01397',	'MOD01398',	'MOD01399',
		'MOD01400',	'MOD01215',	'MOD01216',	'MOD01330',	'MOD01234',	'MOD01402',	'MOD01403',	'MOD01404',
		'MOD01405',	'MOD01406',	'MOD01434',	'MOD01435',	'MOD01437',	'MOD01441',	'MOD01442',	'MOD01443',
		'MOD01444',	'MOD01445',	'MOD01401',	'MOD02959',	'MOD03027',	'MOD03096',	'MOD02001',	'MOD03158',
		'MOD02028',	'MOD02310',	'MOD02068',	'MOD02069',	'MOD02070',	'MOD02085',	'MOD02367',	'MOD02368',
		'MOD02369',	'MOD01891',	'MOD01860',	'MOD05706',	'MOD02930',	'MOD02612',	'MOD00003',	'MOD00059',
		'MOD00219',	'MOD00374',	'MOD00401',	'MOD00519',	'MOD00545',	'MOD00572',	'MOD00751',	'MOD00767',
		'MOD01071',	'MOD01391',	'MOD01393',	'MOD01411',	'MOD01446',	'MOD01458',	'MOD01499',	'MOD01501',
		'MOD01895',	'MOD02271',	'MOD02274',	'MOD02383',	'MOD02648',	'MOD02942',	'MOD02978',	'MOD04098',
		'MOD04175',	'MOD04302',	'MOD04316',	'MOD04523',	'MOD04560',	'MOD04620',	'MOD04681',	'MOD04682',
		'MOD05286',	'MOD05498'
	], value);
}

function inList_FuncGroup(value) {
	return inList([
		'Active Directory Domain Controller',
		'Application Server',
		'Citrix XenAPP or Presentation Server',
		'FTP Server',
		'IBM Websphere',
		'IBM WebSphere MQ',
		'Management Server',
		'RabbitMQ',
		'Tomcat',
		'Web Server'
	], value);
}

function isODQ_Storage(ci) {
	if(inList(z_classes['Stor'], ci.sys_class_name)) {
		// [cmdb_ci.mass storage device.device type] is not NAS vFiler
		if(ci.ref_cmdb_ci_msd.device_type.getDisplayValue() == 'NAS vFiler') {
			return false;
		} else {
			return true;
		}
	} else {
		return false;
	}
}

function isODQ_Database(ci) {
	if(ci.sys_class_name == 'cmdb_ci_database') {
		if( ci.ref_cmdb_ci_database.type == 'DB2 UDB'
		 || ci.ref_cmdb_ci_database.type == 'Oracle'
		) {
			return true;
		} else {
			return false;
		}
	} else if(inList(z_classes['DB'], ci.sys_class_name)) {
		return true;
	} else {
		return false;
	}
}

function matchInvalidName(str) {
	/* Rules
		1. Has a character that is not A-Z a-z 0-9 _ . - ) ( or space
			(e.g. ~ ` ! @ # $ % ^ & * + = [ ] { } < > : ; , ' " ? / | \ 
				  including special character)
		2. Has a pattern of *_dd_*_dd_*
		3. Has a pattern of *number_number_number_number*
	*/
	if(/[^A-Za-z0-9_\.\-\)\(\s]/.test(str)) { // Rule 1
		return true;
	} else if(/_dd_.+_dd_/i.test(str)) { // Rule 2
		return true;
	} else if(/[0-9]+_[0-9]+_[0-9]+_[0-9]/.test(str)) { // Rule 3
		return true;
	} else {
		return false;
	}
}

function matchInvalidSerNo(str) {
	/* Rules
		1. Exact matching
		2. Partial matching
		3. End matching
	*/
	if(inList([ // Rule 1
		'TBD','TBA','TBC','000000000','NA'
	], str)) {
		return true;
	} else if(hasTextContain([ // Rule 2
		'UNKNOWN','BLANK','OTHER','SN MISSED','TO BE COLLECTED','TEMPIN STOCK',
		'AUDIT','Invalid','missing','serial','unknown','N/A','NONE','OS IMAGE','OS-IMAGE',
		'SHARED1PD','SXSX','NO LABEL','BBBB','AAA','#','DUMMY'
	], str)) {
		return true;
	} else if(hasTextEnd([ // Rule 3
		'-','NO','TEST','RECEIVED','_DUP'
	], str)) {
		return true;
	} else {
		return false;
	}
}

function matchSupGroup(nm_list) {
	/* Rules
		1. Exact matching
		2. Partial matching
	*/
	for(var i=0; i<nm_list.length; i++) {
		if(inList([ // Rule 1
			'DBA-SUPP-NONSTD', 
			'DBA-SUPP-SYBASE-CUST',  
			'ORACLE-SUPPORT', 
			'MSSQL-SUPPORT', 
			'DBA-INTEGRATION-MSSQL'
		], nm_list[i])) {
			return true;
		}
		if(hasTextContain([ // Rule 2
			'DBA-DE-'
		], nm_list[i])) {
			return true;
		}
	}
	return false;
}

function onInvalidTime(valid_from, valid_to) {
	/* Rules
		To be valid, time of now (nowNoTZ) must be between valid_from and valid_to
	*/
	if((valid_to && valid_to < gs.nowNoTZ()) || gs.nowNoTZ() < valid_from) {
		return true;
	} else {
		return false;
	}
}

// Supporting Functions for Common Use
function existsChoice(table, field, value) {
	var grq = new GlideRecord('sys_choice');
	grq.addQuery('name', table);
	grq.addQuery('element', field);
	if(typeof value != 'undefined') {
		grq.addQuery('value', value);
	}
	grq.query();
	if(grq.next()) {
		return true;
	} else {
		return false;
	}
}

function existsRef(table, si) {
	var grq = new GlideRecord(table);
	grq.addQuery('sys_id', si);
	grq.query();
	if(grq.next()) {
		return true;
	} else {
		return false;
	}
}

function existsRefList(table, si_list) {
	for(var i=0; i<si_list.length; i++) {
		if(existsRef(table, si_list[i])) {
			continue;
		} else {
			return false;
		}
	}
	return true;
}

function hasTextBegin(Arr, str) {
	for(var i=0; i<Arr.length; i++) {
		if(str.indexOf(Arr[i]) === 0) {
			return true;
		}
	}
	return false;
}

function hasTextContain(Arr, str) {
	for(var i=0; i<Arr.length; i++) {
		if(str.indexOf(Arr[i]) > -1) {
			return true;
		}
	}
	return false;
}

function hasTextEnd(Arr, str) {
	for(var i=0; i<Arr.length; i++) {
		if(str.lastIndexOf(Arr[i]) == str.length - Arr[i].length) {
			return true;
		}
	}
	return false;
}

function inList(Arr, value) {
	for(var i=0; i<Arr.length; i++) {
		if(value == Arr[i]) {
			return true;
		}
	}
	return false;
}


