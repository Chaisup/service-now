`*/ Metadata
-------------------------------------------------------------------------------------------------------------------------
Name : CRA-Z Migrate JSON From Here
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

var z_arg = {
	project : '[PA017] MSO Dashboard | SN-TP-X006-MSO',
	pa_dashboards : ['a527adde13afc344f05c7e276144b08b'],
	sysauto_pa : ['a36c6a3d13ff0380f05c7e276144b03e','534c496f13ef8f009c89b53a6144b03f','7e8fd4d813374b409c89b53a6144b043','1130e25013eb0f409c89b53a6144b010'],
	limit : 5000	// fill the limit number of objects (maximum : 9000)
};
var z_log = {
	count : 5,		// fill the number of starting objects in z_arg
	run : true,
	run_build_items : true
};
var z_log_text = '';



// Main Program
// 1. Alias Variables
{
	var PD		= 'pa_dashboards';
	var PD2T	= 'pa_m2m_dashboard_tabs';
	var PD2B	= 'pa_m2m_dashboard_sources';
	var PT		= 'pa_tabs';
	var PP		= 'sys_portal_page';
	var PGC		= 'sys_grid_canvas';
	var PPT		= 'sys_portal';
	var PGCP	= 'sys_grid_canvas_pane';
	var PPTF	= 'sys_portal_preferences';
	var PW		= 'pa_widgets';
	var PW2I	= 'pa_widget_indicators';
	var PIG		= 'pa_tags';
	var PIG2I	= 'pa_m2m_indicator_tags';
	var PI		= 'pa_indicators';
	var PIS		= 'pa_cubes';
	var PI2B	= 'pa_indicator_breakdowns';
	var PB		= 'pa_breakdowns';
	var PBL		= 'pa_manual_breakdowns';
	var PBM		= 'pa_breakdown_mappings';
	var PBS		= 'pa_dimensions';
	var PR		= 'pa_targets';
	var PRV		= 'pa_target_values';
	var PRC		= 'pa_target_color_schemes';
	var PJ		= 'sysauto_pa';
	var PJ2I	= 'pa_job_indicators';
	var PS		= 'pa_scripts';
	var PXI2B	= 'pa_indicator_breakdown_excl';
	var HUV		= 'sys_ui_view';
	var R		= 'sys_report';
	var RJ		= 'sysauto_report';
}
// 2. Processing Variables
var z_items = {};
{
	z_items[PD]		= z_arg[PD] || [];
	z_items[PD2T]	= z_arg[PD2T] || [];
	z_items[PD2B]	= z_arg[PD2B] || [];
	z_items[PT]		= z_arg[PT] || [];
	z_items[PP]		= z_arg[PP] || [];
	z_items[PGC]	= z_arg[PGC] || [];
	z_items[PPT]	= z_arg[PPT] || [];
	z_items[PGCP]	= z_arg[PGCP] || [];
	z_items[PPTF]	= z_arg[PPTF] || [];
	z_items[PW]		= z_arg[PW] || [];
	z_items[PW2I]	= z_arg[PW2I] || [];
	z_items[PIG]	= z_arg[PIG] || [];
	z_items[PIG2I]	= z_arg[PIG2I] || [];
	z_items[PI]		= z_arg[PI] || [];
	z_items[PIS]	= z_arg[PIS] || [];
	z_items[PI2B]	= z_arg[PI2B] || [];
	z_items[PB]		= z_arg[PB] || [];
	z_items[PBL]	= z_arg[PBL] || [];
	z_items[PBM]	= z_arg[PBM] || [];
	z_items[PBS]	= z_arg[PBS] || [];
	z_items[PR]		= z_arg[PR] || [];
	z_items[PRV]	= z_arg[PRV] || [];
	z_items[PRC]	= z_arg[PRC] || [];
	z_items[PJ]		= z_arg[PJ] || [];
	z_items[PJ2I]	= z_arg[PJ2I] || [];
	z_items[PS]		= z_arg[PS] || [];
	z_items[PXI2B]	= z_arg[PXI2B] || [];
	z_items[HUV]	= z_arg[HUV] || [];
	z_items[R]		= z_arg[R] || [];
	z_items[RJ]		= z_arg[RJ] || [];
}
var z_rules = {};
{
	z_rules[PD] = [
		{ method:'M2M', out_1:PD2T, out_2:PT, ref_in:'dashboard', ref_out:'tab' },
		{ method:'M2M', out_1:PD2B, out_2:PBS, ref_in:'dashboard', ref_out:'breakdown_source' }
	];
	z_rules[PT] = [
		{ method:'DOT', out_1:PP, ref_out:'page' },
		{ method:'DOT', out_1:PGC, ref_out:'canvas_page' }
	];
	z_rules[PP] = [
		{ method:'O2M', out_1:PPT, ref_in:'page' },
		{ method:'GET', out_1:HUV, ref_out:'view', field:'name' }
	];
	z_rules[PGC] = [
		{ method:'O2M', out_1:PGCP, ref_in:'grid_canvas' }
	];
	z_rules[PGCP] = [
		{ method:'DOT', out_1:PPT, ref_out:'portal_widget' }
	];
	z_rules[PPT] = [
		{ method:'O2M', out_1:PPTF, ref_in:'portal_section' },
		{ method:'HARD', hard_function: HF_PPT2ANY }
	];
	z_rules[PW] = [
		{ method:'M2M', out_1:PW2I, out_2:PI, ref_in:'widget', ref_out:'indicator' },
		{ method:'DOT', out_1:PI, ref_out:'indicator' },
		{ method:'DOT', out_1:PIG, ref_out:'tag' }
	];
	z_rules[PIG] = [
		{ method:'M2M', out_1:PIG2I, out_2:PI, ref_in:'tag', ref_out:'indicator' }
	];
	z_rules[PI] = [
		{ method:'SCAN', out_1:PI, field:'formula' },
		{ method:'DOT', out_1:PIS, ref_out:'cube' },
		{ method:'DOT', out_1:PS, ref_out:'script' },
		{ method:'O2M', out_1:PR, ref_in:'indicator' },
		{ method:'M2M', out_1:PI2B, out_2:PB, ref_in:'indicator', ref_out:'breakdown' },
		{ method:'O2M', out_1:PXI2B, ref_in:'indicator' }
	];
	z_rules[PB] = [
		{ method:'DOT', out_1:PBS, ref_out:'dimension' },
		{ method:'O2M', out_1:PBL, ref_in:'breakdown' },
		{ method:'O2M', out_1:PBM, ref_in:'breakdown' }
	];
	z_rules[PBS] = [
		{ method:'HARD', hard_function: HF_PBS2PB2PBL }
	];
	z_rules[PBM] = [
		{ method:'DOT', out_1:PS, ref_out:'script' }
	];
	z_rules[PR] = [
		{ method:'DOT', out_1:PRC, ref_out:'color_scheme' },
		{ method:'O2M', out_1:PRV, ref_in:'target' }
	];
	z_rules[PJ] = [
		{ method:'O2M', out_1:PJ2I, ref_in:'job' }
	];
}
// 3. Hard Functions
function HF_PPT2ANY(ppt_id) {
	// query data of 3 records in order
	var key, item, found = false;
	var grq = new GlideRecord('sys_portal_preferences');
	grq.addEncodedQuery('nameINrenderer,sys_id,table^portal_section='+ppt_id);
	grq.orderBy('name');
	grq.query();
	// 1. get renderer
	if(grq.next()) {
		// check the renderer
		if(grq.value.endsWith('RenderPerformanceAnalytics')) {
			key = 'pa_widgets';
		} else if(grq.value.endsWith('RenderReport')) {
			key = 'sys_report';
		} else if(grq.value.endsWith('RenderJavascript')) {
			key = '?'; // to be checked at step 3.
		}
	}
	// 2. get sys_id
	if(key) {
		if(grq.next()) {
			item = grq.value+'';
			found = true;
		}
	}
	// 3. get table
	if(key == '?') {
		if(grq.next()) {
			key = grq.value+'';
		} else {
			found = false;
		}
	}
	// send the result (only 1 item or none)
	if(found) {
		return [{ 'key':key, 'item':item }];
	} else {
		return [];
	}
}
function HF_PBS2PB2PBL(pbs_id) {
	var result = [];
	var grq = new GlideRecord(PBS);
	grq.addEncodedQuery('facts_table=pa_manual_breakdowns^conditionsLIKEbreakdown');
	grq.addQuery('sys_id', pbs_id);
	grq.query();
	// query each PBS to extract PB (normally, 1:1)
	while(grq.next()) {
		var pb_ids = grq['conditions'].match(/[0-9a-f]{32}/gi);
		// fecth each PB and also use it to collect PBL
		for(var i=0; i<pb_ids.length; i++) {
			result.push({'key':PB, 'item':pb_ids[i]});
			collectItem(PB, pb_ids[i], { method:'O2M', out_1:PBL, ref_in:'breakdown' });
		}
	}
	return result;
}
// 4. Run
runCustomScript();


// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -100000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_ARGUMENTS | ARG : '+JSON.stringify(z_arg, null, 4), -90009);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_ARGUMENTS | RULES : '+JSON.stringify(z_rules, null, 4), -90008);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_ARGUMENTS | ITEMS : '+JSON.stringify(z_items, null, 4), -90007);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_BUILD_ITEMS | '+buildItems(), -50000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_LOG | '+JSON.stringify(z_log, null, 4), -20000);
	CRA_PA_WriteJobLog(current.sys_id, 'Z_LOG_TEXT | '+z_log_text, -10000);
	/**	Sequences number -9999 to -1000 are migrated data. */
	CRA_PA_WriteJobLog(current.sys_id, 'Z_BUILD_RECORDS | '+buildRecords(), -500);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | '+current.name, -10);
}


// Processing Functions
function buildItems() {
	// loop i : key
	for(var i_key in z_rules) {
		var i_item = z_items[i_key];
		var i_rule = z_rules[i_key];
		keepLog(1, 'key = "'+i_key+'"');
		// loop j : item
		for(var j=0; j<i_item.length; j++) {
			var j_item = i_item[j];
			keepLog(2, 'item = \''+j_item+'\'');
			// loop k : rule
			for(var k=0; k<i_rule.length; k++) {
				keepLog(3, 'rule = '+(k+1)+' : '+i_rule[k].method);
				collectItem(i_key, j_item, i_rule[k]);
				// stop if the run flag is false
				if(!z_log.run) { return; }
			}
		}
	}
	return 'completed';
}

function buildRecords() {
	var seq = 0;
	// loop i : key
	for(var i_key in z_items) {
		var i_item = z_items[i_key];
		var fields = CRA_GetFields(i_key);
		// loop j : item
		for(var j=0; j<i_item.length; j++) {
			var j_item = i_item[j];
			var json = { "_record_" : i_key+':'+j_item };
			var grq = new GlideRecord(i_key);
			grq.get(j_item);
			// loop k : value
			for(var k=0; k<fields.length; k++) {
				json[fields[k]] = grq[fields[k]]+'';
			}
			// write record
			CRA_PA_WriteJobLog(current.sys_id, JSON.stringify(json, null, 4), (++seq)-10000);
		}	
	}
	return 'completed';
}

function collectItem(key, item, rule) {
	// Main Operation
	switch(rule.method) {
		case 'DOT': collectByDOT(); break;
		case 'GET': collectByGET(); break;
		case 'M2M': collectByM2M(); break;
		case 'O2M': collectByO2M(); break;
		case 'HARD': collectByHARD(); break;
		case 'SCAN': collectBySCAN(); break;
		default: break;
	}
	// Collecting Functions
	function collectByDOT() {
		// collect 1 item by dot-walking field
		var grq = new GlideRecord(key);
		grq.addQuery('sys_id', item);
		grq.query();
		if(grq.next()) {
			commitItem(rule.out_1, grq[rule.ref_out]+'');
		}
	}
	function collectByGET() {
		// collect 1 item by non-dot-walking field
		var grq_1 = new GlideRecord(key);
		grq_1.addQuery('sys_id', item);
		grq_1.query();
		if(grq_1.next()) {
			var grq_2 = new GlideRecord(rule.out_1);
			grq_2.addQuery(rule.field, grq_1[rule.ref]);
			grq_2.query();
			if(grq_2.next()) {
				commitItem(rule.out_1, grq_2['sys_id']+'');
			}
		}
	}
	function collectByM2M() {
		// collect M items by lookup table
		var grq = new GlideRecord(rule.out_1);
		grq.addQuery(rule.ref_in, item);
		grq.query();
		while(grq.next()) {
			commitItem(rule.out_1, grq['sys_id']+'');
			commitItem(rule.out_2, grq[rule.ref_out]+'');
		}
	}
	function collectByO2M() {
		// collect M items by referenced table
		var grq = new GlideRecord(rule.out_1);
		grq.addQuery(rule.ref_in, item);
		grq.query();
		while(grq.next()) {
			commitItem(rule.out_1, grq['sys_id']+'');
		}
	}
	function collectByHARD() {
		// collect M items by custom method
		var list = rule.hard_function(item);
		for(var l=0; l<list.length; l++) {
			commitItem(list[l].key, list[l].item);
		}
	}
	function collectBySCAN() {
		var list = [];
		var grq = new GlideRecord(key);
		grq.addQuery('sys_id', item);
		grq.query();
		if(grq.next()) {
			list = grq[rule.field].match(/[0-9a-f]{32}/gi);
		}
		for(var l=0; l<list.length; l++) {
			commitItem(rule.out_1, list[l]);
		}
	}
	// Committing Function
	function commitItem(y_key, y_item) {
		// check if y_item is not null and the run flag is true
		if(y_item && z_log.run) {
			// check if y_item not already exists in the collection
			if(z_items[y_key].indexOf(y_item) == -1) {
				// stop if it exceeds the limit
				if(z_log.count < z_arg.limit) {
					z_items[y_key].push(y_item);
					keepLog(4, 'count = '+(++z_log.count)+' | '+y_key+' : \''+y_item+'\'');
				} else {
					keepLog(4, 'limit exceeded');
					z_log.run = false;
				}
			}
		}
	}
}

function keepLog(level, text) {
	z_log_text += '\n' + Array(level+1).join('.') + ' ' + text;
}


// Supporting Functions
function CRA_GetFields(table) {
	// get a record
	var grq = new GlideRecord(table);
	grq.query();
	grq.next();
	// extract metadata
	var fields = grq.getFields();
	var result = ['sys_id'];
	var field_name;
	for(var i=0; i<fields.size(); i++) {
		field_name = fields.get(i).getName();
		if(field_name != 'sys_tags') {
			result.push(field_name);
		}
	}
	return result.sort();
}


