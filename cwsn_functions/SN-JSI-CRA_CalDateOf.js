*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_CalDateOf									Developed by: Chaisup Wongsaroj		Version: 4.0


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to find the relative date from the offset date by input mode and number.
Inputs:
	1	Mode <String> : the mode of periods between relative date and offset date (case insensitive)
		(only 'd', 'w', 'm', 'y', 'wb', 'we', 'mb', 'me', 'yb', 'ye')
		(Meaning:	'd' = Day, 'w' = Week, 'm' = Month, 'y' = Year, 
					'b' = BeginningOf, 'e' = EndOf)
	2	number <Integer> : the number of periods between relative date and offset date
		(e.g. -2, -1, 0, 1, -2)
		(Meaning: Negative = Past, Zero = Current, Positive = Future)
	3	offset <GlideDateTime> : the offset date in 'GMT' picked up by the system (optional)
		(e.g.	gs.daysAgo(1)	for Previous-Daily Scheduling, 
				gs.daysAgo(7)	for Previous-Weekly Scheduling, 
				gs.monthsAgo(1)	for Previous-Monthly Scheduling,
				'2017-09-19 09:00:00' for Fixed-DateTime Scheduling)
		(default: gs.nowNoTZ())
	4	show_time <Boolean> : the flag to add time to the output (optional)
		(true = DateTime 'YYYY-MM-DD HH:MM:SS', false = Date 'YYYY-MM-DD') (default = false)
Output:
	<String> : the relative date


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_CalDateOf(Mode, number, offset, show_time) {
	// declare variables
	var mode = (Mode+'').toLowerCase();
	var prefix = mode.substr(0,1);
	var suffix = mode.substr(1);
	var gdt;
	var zDate = '';
	var zTime = '';
	if(typeof offset == 'undefined') {
		offset = gs.nowNoTZ();
	}
	zTime = (offset+'').substr(-8,8);
	gdt = new GlideDateTime(offset);
	// shift the offset date
	if(number != 0) {
		switch(prefix) {
			case 'd': gdt.addDaysUTC(number); break;
			case 'w': gdt.addWeeksUTC(number); break;
			case 'm': gdt.addMonthsUTC(number); break;
			case 'y': gdt.addYearsUTC(number); break;
		}
	}
	// find the boundary of the offset date
	switch(mode) {
		case 'yb': zDate = (gdt+'').substr(0,5) + '01-01';  break;
		case 'ye': zDate = (gdt+'').substr(0,5) + '12-31'; break;
		case 'mb': zDate = (gdt+'').substr(0,8) + '01'; break;
		case 'me': zDate = (gdt+'').substr(0,8) + gdt.getDaysInMonthUTC(); break;
		case 'wb': gdt.addDaysUTC(1 - gdt.getDayOfWeekUTC()); zDate = (gdt+'').substr(0,10); break;
		case 'we': gdt.addDaysUTC(7 - gdt.getDayOfWeekUTC()); zDate = (gdt+'').substr(0,10); break;
		default: zDate = (gdt+'').substr(0,10);
	}
	// output as Date or DateTime
	if(show_time) {
		if(suffix == 'b') {
			return zDate+' '+'00:00:00';
		} else if(suffix == 'e') {
			return zDate+' '+'23:59:59';
		} else {
			return zDate+' '+zTime;
		}
	} else {
		return zDate;
	}
}


// Test ---------------------------------------------------------------------------------------------

function printTestFunc(arg1, arg2, arg3, arg4) {
	gs.print( arg1 
		+','+ arg2
		+','+ arg3
		+','+ arg4
		+' => '
		+ CRA_CalDateOf(arg1, arg2, arg3, arg4)
	);
}

// TODAY
gs.print('Today is '+gs.nowNoTZ()+' GMT.');

// NORMAL TESTING
printTestFunc('d', 0);
printTestFunc('d', 0, gs.nowNoTZ(), true);
printTestFunc('D', 1);
printTestFunc('d',-1);
printTestFunc('d', 0, gs.daysAgo(1));
printTestFunc('d', 1, gs.daysAgo(7));
printTestFunc('D',-1, gs.monthsAgo(1), true);
printTestFunc('W',-1, gs.monthsAgo(2), true);
printTestFunc('M',-1, gs.monthsAgo(3), true);
printTestFunc('Y',-1, gs.monthsAgo(4), true);
printTestFunc('D',-1, gs.monthsAgo(5), true);
printTestFunc('W',-1, gs.monthsAgo(6), true);
printTestFunc('M',-1, gs.monthsAgo(7), true);
printTestFunc('Y',-1, gs.monthsAgo(8), true);
printTestFunc('wb', 0, '2017-09-19 23:00:00', true);
printTestFunc('we', 0, '2017-09-19 23:00:00', true);
printTestFunc('mb', 0, '2017-09-19 23:00:00', true);
printTestFunc('me', 0, '2017-09-19 23:00:00', true);
printTestFunc('yb', 0, '2017-09-19 23:00:00', true);
printTestFunc('ye', 0, '2017-09-19 23:00:00', true);
printTestFunc('wb',-1, '2017-09-19 23:00:00', true);
printTestFunc('we',-1, '2017-09-19 23:00:00', true);
printTestFunc('mb',-1, '2017-09-19 23:00:00', true);
printTestFunc('me',-1, '2017-09-19 23:00:00', true);
printTestFunc('yb',-1, '2017-09-19 23:00:00', true);
printTestFunc('ye',-1, '2017-09-19 23:00:00', true);
printTestFunc('wb',12, '2017-09-19 23:00:00', true);
printTestFunc('we',12, '2017-09-19 23:00:00', true);
printTestFunc('mb', 3, '2017-09-19 23:00:00', true);
printTestFunc('me', 3, '2017-09-19 23:00:00', true);
printTestFunc('yb', 1, '2017-09-19 23:00:00', true);
printTestFunc('ye', 1, '2017-09-19 23:00:00', true);
printTestFunc('m',-1, gs.monthsAgo(0));
printTestFunc('m',-2, gs.monthsAgo(0), false);
printTestFunc('m',-3, gs.monthsAgo(0), false);
printTestFunc('m',-4, gs.monthsAgo(0), true);
printTestFunc('m',-5, gs.monthsAgo(0), true);
printTestFunc('mb',-6, gs.monthsAgo(0), true);
printTestFunc('mb',-7, gs.monthsAgo(0), true);
printTestFunc('me',-8, gs.monthsAgo(0), true);
printTestFunc('me',-9, gs.monthsAgo(0), true);
printTestFunc('ye',0, gs.monthsAgo(0), true);
printTestFunc('ye',0, gs.monthsAgo(0));
printTestFunc('x');
printTestFunc('ye',0, gs.monthsAgo(1));
printTestFunc('ye',0, gs.monthsAgo(2));
printTestFunc('ye',0, gs.monthsAgo(3));
printTestFunc('ye',0, gs.monthsAgo(4));
printTestFunc('ye',0, gs.monthsAgo(5));
printTestFunc('ye',0, gs.monthsAgo(6));



/* LOOPED TESTING
gs.print('>>> DAY');
printTestFunc('d',0);
printTestFunc('d',-10);
printTestFunc('D',4);

gs.print('>>> DAY');
for(var i=-3; i<=3; i++) {
	printTestFunc('y',i);
}

gs.print('>>> MONTH');
for(var i=-15; i<=15; i++) {
	printTestFunc('m',i);
}

gs.print('>>> YEAR');
for(var i=-3; i<=3; i++) {
	printTestFunc('y',i);
}

gs.print('>>> MONTH BEGIN');
for(var i=-15; i<=15; i++) {
	printTestFunc('mb',i);
}

gs.print('>>> MONTH END');
for(var i=-15; i<=15; i++) {
	printTestFunc('me',i);
}

gs.print('>>> YEAR BEGIN');
for(var i=-3; i<=3; i++) {
	printTestFunc('yb',i);
}

gs.print('>>> YEAR END');
for(var i=-3; i<=3; i++) {
	printTestFunc('ye',i);
}
*/



*/ Result
-----------------------------------------------------------------------------------------------------

*** Script: Today is 2017-05-06 05:44:36 GMT.
*** Script: d,0,undefined,undefined => 2017-05-06
*** Script: d,0,2017-05-06 05:44:36,true => 2017-05-06 05:44:36
*** Script: D,1,undefined,undefined => 2017-05-07
*** Script: d,-1,undefined,undefined => 2017-05-05
*** Script: d,0,2017-05-05 05:44:36,undefined => 2017-05-05
*** Script: d,1,2017-04-29 05:44:36,undefined => 2017-04-30
*** Script: D,-1,2017-04-06 05:44:36,true => 2017-04-05 05:44:36
*** Script: W,-1,2017-03-06 05:44:36,true => 2017-02-27 05:44:36
*** Script: M,-1,2017-02-06 05:44:36,true => 2017-01-06 05:44:36
*** Script: Y,-1,2017-01-06 05:44:36,true => 2016-01-06 05:44:36
*** Script: D,-1,2016-12-06 05:44:36,true => 2016-12-05 05:44:36
*** Script: W,-1,2016-11-06 05:44:36,true => 2016-10-30 05:44:36
*** Script: M,-1,2016-10-06 05:44:36,true => 2016-09-06 05:44:36
*** Script: Y,-1,2016-09-06 05:44:36,true => 2015-09-06 05:44:36
*** Script: wb,0,2017-09-19 23:00:00,true => 2017-09-18 00:00:00
*** Script: we,0,2017-09-19 23:00:00,true => 2017-09-24 23:59:59
*** Script: mb,0,2017-09-19 23:00:00,true => 2017-09-01 00:00:00
*** Script: me,0,2017-09-19 23:00:00,true => 2017-09-30 23:59:59
*** Script: yb,0,2017-09-19 23:00:00,true => 2017-01-01 00:00:00
*** Script: ye,0,2017-09-19 23:00:00,true => 2017-12-31 23:59:59
*** Script: wb,-1,2017-09-19 23:00:00,true => 2017-09-11 00:00:00
*** Script: we,-1,2017-09-19 23:00:00,true => 2017-09-17 23:59:59
*** Script: mb,-1,2017-09-19 23:00:00,true => 2017-08-01 00:00:00
*** Script: me,-1,2017-09-19 23:00:00,true => 2017-08-31 23:59:59
*** Script: yb,-1,2017-09-19 23:00:00,true => 2016-01-01 00:00:00
*** Script: ye,-1,2017-09-19 23:00:00,true => 2016-12-31 23:59:59
*** Script: wb,12,2017-09-19 23:00:00,true => 2017-12-11 00:00:00
*** Script: we,12,2017-09-19 23:00:00,true => 2017-12-17 23:59:59
*** Script: mb,3,2017-09-19 23:00:00,true => 2017-12-01 00:00:00
*** Script: me,3,2017-09-19 23:00:00,true => 2017-12-31 23:59:59
*** Script: yb,1,2017-09-19 23:00:00,true => 2018-01-01 00:00:00
*** Script: ye,1,2017-09-19 23:00:00,true => 2018-12-31 23:59:59
*** Script: m,-1,2017-05-06 05:44:36,undefined => 2017-04-06
*** Script: m,-2,2017-05-06 05:44:36,false => 2017-03-06
*** Script: m,-3,2017-05-06 05:44:36,false => 2017-02-06
*** Script: m,-4,2017-05-06 05:44:36,true => 2017-01-06 05:44:36
*** Script: m,-5,2017-05-06 05:44:36,true => 2016-12-06 05:44:36
*** Script: mb,-6,2017-05-06 05:44:36,true => 2016-11-01 00:00:00
*** Script: mb,-7,2017-05-06 05:44:36,true => 2016-10-01 00:00:00
*** Script: me,-8,2017-05-06 05:44:36,true => 2016-09-30 23:59:59
*** Script: me,-9,2017-05-06 05:44:36,true => 2016-08-31 23:59:59
*** Script: ye,0,2017-05-06 05:44:36,true => 2017-12-31 23:59:59
*** Script: ye,0,2017-05-06 05:44:36,undefined => 2017-12-31
*** Script: x,undefined,undefined,undefined => 2017-05-06
*** Script: ye,0,2017-04-06 05:44:36,undefined => 2017-12-31
*** Script: ye,0,2017-03-06 05:44:36,undefined => 2017-12-31
*** Script: ye,0,2017-02-06 05:44:36,undefined => 2017-12-31
*** Script: ye,0,2017-01-06 05:44:36,undefined => 2017-12-31
*** Script: ye,0,2016-12-06 05:44:36,undefined => 2016-12-31
*** Script: ye,0,2016-11-06 05:44:36,undefined => 2016-12-31
[0:00:00.024] Total Time

