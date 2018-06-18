*/ Version
-----------------------------------------------------------------------------------------------------
Date		Version	By				Description
2016-09-07 	1.0		Sriisara.L		Initialize
2018-02-12	2.0		Chaisup.W		Refine the documentation


*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_QueryData


*/ Description
-----------------------------------------------------------------------------------------------------

This function can be used as a subquery of data with specified table, field, and condition.
Inputs:
	1 : table <String> : Name of the table to be queried (e.g. 'incident')
	2 : field <String> : Name of the field of the output (e.g. 'number', 'sys_id')
	3 : cond <String><Optional> : Encoded query (e.g. 'priority=2^numberENDSWITH9', 'null')
		To get an encoded query from the list, right click at the filter and choose 'Copy query'.
		If this argument is 'null', 'NULL', or undefined, no filter will be applied in the query.
Output:
	<Array(String)> : An array of distinct values of the specified field.
Example Filter:
	Incident
		Number {is} javascript:CRA_QueryData('incident','number','priority=2^numberENDSWITH9')


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_QueryData(table, field, cond) {
	// declare variables
	var arrOutput = [];
	var arrayUtil = new ArrayUtil();
	var grq = new GlideRecord(table);
	// apply query and filter (if any)
	if(cond.toUpperCase != 'NULL') {
		grq.addEncodedQuery(cond);
	}
	grq.query();
	// collect values
	while(grq.next()) {
		arrOutput.push(grq[field].toString());
	}
	return arrayUtil.unique(arrOutput);
}


*/ Unit Test
-----------------------------------------------------------------------------------------------------

//*********************************
// /*Apply into Condition Builder*/
//*********************************
//--------------- Test 1 -------------------------
/* Assume follow by below query
*  select sys_id
   from incident
   where sys_id in (select id 
                    from metric_instance
                    where field = 'assignment_group')
*/
{incident} sys_id {is} javascript:CRA_QueryData('metric_instance','id','field=assignment_group')

//--------------- Test 2 -------------------------

/* Assume follow by below query
*  select sys_id
   from incident
   where sys_id in (select id 
                    from metric_instance
                    where (field = 'assignment_group'
					      or field = 'assigned_to')
					and start between to_date('2016-08-01 00:00:00','yyyy-mm-dd hh24:mi:ss') and sysdate)	  
					)
*/

{incident} sys_id {is} javascript:CRA_QueryData("metric_instance","id","field=assignment_group^ORfield=assigned_to^startBETWEENjavascript:gs.dateGenerate('2016-08-01','00:00:00')@javascript:gs.daysAgoEnd(0)")


//--------------- Test 3 (same table)-------------------------
/* Assume follow by below query
*  select number
   from incident
   where number in (select number
                    from incident
                    where priority = High
					and state = Closed
					and number endwith 9
					)
*/

{incident} number {is} javascript:CRA_QueryData('incident','number','priority=2^state=7^numberENDSWITH9')

//--------------- Test 4 (same table)-------------------------
/* Assume follow by below query
*  select number
   from incident
   where number in (select number
                    from incident
                    where priority = Low
					and state = Closed
					and assigned_to = Jeff Marlow
					)
*/

{incident} number {is}  javascript:CRA_QueryData('incident','number','priority=4^state=7^assigned_to=779a8a316f5e1a00c7b990754b3ee46e')



