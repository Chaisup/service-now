`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-MSO-MTH-J11 Run UI
Run : Scheduled by CRA-MSO-MTH-J0
Relative : 13 months ago - 1 months ago


*/ Description
-------------------------------------------------------------------------------------------------------------------------

This job uses the number of relative months ago (13, 1) to set the time period of all column-chart widgets in MSO project.


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

// Input
/* None : Set the number of relative months instead. */

// Main Program
runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -1000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_RUN_UI | '+processUI(), -100);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -10);
}

// Processing Function
function processUI() {
	return CRA_PA_UpdWidPeriod(
		CRA_CalDateOf('mb', -current.score_relative_start),
		CRA_CalDateOf('me', -current.score_relative_end),
		'descriptionSTARTSWITHCRA-MSO-MTH-WC'
	) + ' rows were updated';
}


