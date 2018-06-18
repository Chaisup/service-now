*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_PA_CallNextJob							Developed by: Chaisup Wongsaroj		Version: 2.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to run next job with parameters (if any) and write a log message.
Version 2.0
	Add the 5th input.
Inputs
	1 : si_job <SysID> : The current job
	2 : jobname <String> : Name of the next job to be called
	3 : seq <Integer> : Job log sequence number
	4 : waitdur <Integer> : Waiting duration to delay the next job (unit: seconds)
		default: 10
	5 : param <Object> : Set of fields to be updated in the next job
		default: Fields starting with 'score_' of the next job will be same as the current job.
		{
			score_operator, 				// 'fixed' or 'relative'
			score_fixed_start,				// e.g. '2017-11-01'
			score_fixed_end,				// e.g. '2017-11-30'
			score_relative_start,			// 0, 1, 2, …
			score_relative_start_interval,	// 'days', 'weeks', or 'months'
			score_relative_end,				// 0, 1, 2, …
			score_relative_end_interval		// 'days', 'weeks', or 'months'
		}
Output
	void (no output)


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_PA_CallNextJob(si_job, jobname, seq, waitdur, param) {
	var grq, gru, gdt;
	var waitsec = 10; // Set default minimum waiting duration = 10 seconds
	gru = new GlideRecord('sysauto_pa');
	gru.addQuery('name', jobname);
	gru.query();
	if(gru.next()) {
		// calculate run_at
		if(waitdur > waitsec) { waitsec = waitdur; }
		gdt = new GlideDateTime(gs.nowNoTZ());
		gdt.addSeconds(waitsec);
		// get calling job data
		grq = new GlideRecord('sysauto_pa');
		grq.get(si_job);
		// set the next job with basic parameters
		gru.run_as_tz = 'GMT';
		gru.run_type = 'once';
		gru.run_start = gdt.getValue();
		// set the next job with custom parameters
		if(typeof param != 'object') {
			gru.score_operator = grq.score_operator;
			gru.score_fixed_start = grq.score_fixed_start;
			gru.score_fixed_end = grq.score_fixed_end;
			gru.score_relative_start = grq.score_relative_start;
			gru.score_relative_start_interval = grq.score_relative_start_interval;
			gru.score_relative_end = grq.score_relative_end;
			gru.score_relative_end_interval = grq.score_relative_end_interval;
		} else {
			for(var field in param) {
				gru[field] = param[field];
			}
		}
		// update and write log
		gru.update();
		CRA_PA_WriteJobLog(si_job, 'CALLED NEXT JOB: '+jobname+' | AT GMT '+gdt.getValue(), seq);
	} else {
		CRA_PA_WriteJobLog(si_job, 'NOT FOUND JOB: '+jobname, seq);
	}
}





