`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-Z Migrate JSON To Here
Run : On Demand
Relative : None


*/ Description
-------------------------------------------------------------------------------------------------------------------------

@ServiceNow (From : TR-PROD)
	1.	Navigate to job 'CRA-Z Migrate JSON From Here'
	2.	Specify variable 'z_arg'
	3.	Run job
	4.	Navigate to URL of 'PA Job Logs' below
		https://thomsonreuters.service-now.com/pa_job_log_rows_list.do?sysparm_query=joblog.sys_id=c5d9b8c6132783c0c9dfb6076144b081%5Einsert_sequenceBETWEEN-9999@-1000%5EORDERBYinsert_sequence
	5.	Set the list view to have only 1 column 'Message'
	6.	Export CSV as "SN-TP-X001-RR-Data.csv"
	
@Notepad (CSV)
	1.	Replace	"" 				with	"				all of the file
	2.	Replace	}"\n"{	 		with	},{				all of the file
	3.	Replace	"message"\n" 	with	{"records":[	at the beginning of the file
	4.	Replace	" 				with	]}				at the end of the file
	5.	Save as "SN-TP-X001-RR-Data.json"
	
@ServiceNow (To : TR-QA, TR-DEV)
	1.	Navigate to job 'CRA-Z Migrate JSON To Here'
	2.	Specify variable 'z_arg'
	3.	Specify variable 'z_json' using "SN-TP-X001-RR-Data.json"
	4.	Run job


*/ Script
-------------------------------------------------------------------------------------------------------------------------`

// Input
var z_arg = {
	project : 'Chaisup Bookmarks | SN-TD-X007-CW-HUB'
};
var z_json = {"records":[{...},{...},...,{...}]};


// Main Program
runCustomScript();


// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -100000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_ARGUMENTS | '+JSON.stringify(z_arg, null, 4), -90000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_CHECK | '+processCheck(), -10000);
	/**	Sequences number -9999 to -1000 are migrated data. */
	CRA_PA_WriteJobLog(current.sys_id, 'Z_DEPLOY | '+processDeploy(), -500);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -10);
}


// Processing Functions
function processCheck() {
	return z_json.records.length+' objects were found.';
}

function processDeploy() {
	var len = z_json.records.length;
	for(var i=0; i<len; i++) {
		// extract JSON data
		var data = z_json.records[i];
		var record = data['_record_'];
		var record_class = record.substr(0, record.indexOf(':'));
		var record_id = record.substr(record.indexOf(':')+1);
		delete data['_record_'];
		// upsert the record
		var grz = new GlideRecord(record_class);
		grz.addQuery('sys_id', record_id);
		grz.query();
		if(grz.hasNext()) {
			grz.next();
			setData();
			grz.update();
			CRA_PA_WriteJobLog(current.sys_id, 'Z_LOG | update: '+record, i-9999);
		} else {
			setData();
			grz.setNewGuidValue(record_id);
			grz.insert();
			CRA_PA_WriteJobLog(current.sys_id, 'Z_LOG | insert: '+record, i-9999);
		}
	}
	return len+' objects were deployed.';
	
	function setData() {
		for(var field in data) {
			grz[field] = data[field];
		}
		grz.autoSysFields(false);
		grz.setWorkflow(false);
	}
}


