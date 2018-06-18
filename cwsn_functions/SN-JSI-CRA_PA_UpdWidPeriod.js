*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_PA_UpdWidPeriod							Developed by: Chaisup Wongsaroj		Version: 1.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to update [date_from] and [date_to] fields of [pa_widgets] table.
Benefits:
	- To control period range of some widgets that cannot refresh their time series periodically.
	- To enable the widgets to display any number of time series on the graph.
Inputs:
	1 :	date_from <String> : beginning date of the period range in a widget (e.g. '2018-02-01')
	2 :	date_to <String> : end date of the period range in a widget (e.g. '2018-02-29')
		(Please see "CRA_CalDateOf" document for more information.)
	3 :	EQ <String> : the encoded query that filters widgets whose periods will be updated
		(e.g. 'nameINNumber of open incidents,Open incidents by Priority', 'descriptionSTARTSWITHCRA-Test')
Output:
	<Integer> : number of updated records in [pa_widgets] table


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_PA_UpdWidPeriod(date_from, date_to, EQ) {
	var log = 0;
	var gru = new GlideRecord('pa_widgets');
	gru.addEncodedQuery(EQ);
	gru.query();
	while(gru.next()) {
		gru.period    = 'between';
		gru.date_from = date_from;
		gru.date_to   = date_to;
		gru.update();
		log++;
	}
	return log;
}


*/ How to apply this in CustomScript on PA Job : Run UI
-----------------------------------------------------------------------------------------------------

runCustomScript();

// Logging Function
function runCustomScript() {
	CRA_PA_WriteJobLog(current.sys_id, 'STARTED | '+current.name, -1000);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | UI_1 | '+processUI_1()+' rows were updated', -100);
	CRA_PA_WriteJobLog(current.sys_id, 'FINISHED | UI_2 | '+processUI_2()+' rows were updated', -99);
}

// Processing Functions
function processUI_1() {
	// Widgets with "year-range" (1 Jan - 31 Dec) that refresh "monthly" to keep "previous month" data
	return CRA_PA_UpdWidPeriod(
		CRA_CalDateOf('yb', 0, gs.monthsAgo(1)), // get first day of year of previous month
		CRA_CalDateOf('ye', 0, gs.monthsAgo(1)), // get last day of year of previous month
		'nameIN'
		+'New incidents by month,'	// a widget (do not forget "," if it is not the last one)
		+'Open incidents'			// a widget
	);
}

function processUI_2() {
	// Widgets with "month-range" (1 - 28/.../31) that refresh "monthly" to keep "previous month" data
	return CRA_PA_UpdWidPeriod(
		CRA_CalDateOf('mb', 0, gs.monthsAgo(1)), // get first day of month of previous month
		CRA_CalDateOf('me', 0, gs.monthsAgo(1)), // get last day of month of previous month
		'nameIN'
		+'Number of new incidents'	// 3 widgets have the same name
	);
}

