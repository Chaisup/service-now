`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-CI-J2 Run UI
Run : After CRA-CI-J1 Run ETL
Relative : 0 months ago - 0 months ago


*/ Description
-------------------------------------------------------------------------------------------------------------------------

This UI job refreshes some widgets to display the current time series.


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

var offsetTime = getOffsetTime();

runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -1000);
	CRA_PA_WriteJobLog(current.sys_id, 'PRINTED | offsetTime: GMT '+offsetTime, -999);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | UI_2 | '+processUI_2()+' rows were updated', -102);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | UI_1 | '+processUI_1()+' rows were updated', -101);
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CI-J31 Run PA-ODQ', -11, 10);
	CRA_PA_CallNextJob(current.sys_id, 'CRA-CI-J32 Run PA-CORE', -10, 300);
}

// Processing Functions
function processUI_1() {
	// Widgets with "year-range" (1 Jan - 31 Dec) that refresh "monthly" to keep "previous month" data
	return CRA_PA_UpdWidPeriod(
		CRA_CalDateOf('yb', 0, offsetTime), // get first day of year
		CRA_CalDateOf('ye', 0, offsetTime), // get last day of year
		'descriptionSTARTSWITHCRA-PA-CI-W1^ORdescriptionSTARTSWITHCRA-PA-ODQ-W1'
	);
}

function processUI_2() {
	// Widgets with "month-range" (1 - 28/.../31) that refresh "monthly" to keep "previous month" data
	return CRA_PA_UpdWidPeriod(
		CRA_CalDateOf('mb', 0, offsetTime), // get first day of month
		CRA_CalDateOf('me', 0, offsetTime), // get last day of month
		'descriptionSTARTSWITHCRA-PA-CI-W2^ORdescriptionSTARTSWITHCRA-PA-ODQ-W2'
	);
}

// Supporting Function
function getOffsetTime() {
	var unit = current.score_relative_start_interval;
	var step = current.score_relative_start;
	if(unit == 'months') {
		return gs.monthsAgo(step);
	} else if(unit == 'weeks') {
		return gs.daysAgo(step*7);
	} else if(unit == 'days') {
		return gs.daysAgo(step);
	} else {
		return gs.nowNoTZ();
	}
}

