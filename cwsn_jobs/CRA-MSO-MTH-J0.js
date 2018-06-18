`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-MSO-MTH-J0
Run : Monthly - 17th - 07:00:00 GMT
Relative : 13 months ago - 1 months ago


*/ Description
-------------------------------------------------------------------------------------------------------------------------

This job calls the children jobs starting with 'CRA-MSO-MTH-J1'


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

var z_now = gs.nowNoTZ();
runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -100);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_NOW | '+z_now+' GMT', -90);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_JOB_1 | '+setJob_1(), -80);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_JOB_2 | '+setJob_2(), -70);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -10);
}

// Scheduling Functions
function setJob_1() {
	// always call this job
	var job = {
		name	: 'CRA-MSO-MTH-J11 Run UI',
		logseq	: -81,
		delay	: 10 // seconds
	};
	var param = {}; // do not change the parameters in Job_1.
	return callJob(job, param);
}

function setJob_2() {
	// always call this job
	var job = {
		name	: 'CRA-MSO-MTH-J12 Run PA',
		logseq	: -71,
		delay	: 20 // seconds
	};
	var param = 'SAME'; // copy the parameters of this job to Job_2.
	return callJob(job, param);
}

function callJob(job, param) {
	CRA_PA_CallNextJob(current.sys_id, job.name, job.logseq, job.delay, param);
	return 'SET WITH '+JSON.stringify(param, null, 4);
}


