*/ Version
-----------------------------------------------------------------------------------------------------
Date		Version	By				Description
2017-07-27 	1.0		Sriisara.L		Initialize
2018-02-12	1.1		Chaisup.W		Refine the documentation
2018-04-18	1.2		Chaisup.W		Enhancement of Input 2
2018-04-23	2.0		Chaisup.W		Enhancement of Input 2


*/ Metadata
-----------------------------------------------------------------------------------------------------
Name: CRA_GetTags


*/ Description
-----------------------------------------------------------------------------------------------------

This function is to find all objects with specified tags.
Input:
	1 : list <Array(String)> : List of specified tags (e.g. ['tag1','tag2'])
		The array can contain both 'sys_id' and 'name' of a tag.
	2 : bypass <Boolean> : Flag to bypass the query condition
		(true = all tags will be queried without any restriction)
		(false = only tags that meet the condition will be queried)
		(default: false)
Output:
	<Array(String)> : An array of sys_id of the objects with specified tags.
Example Filter of Knowledge [kb_knowloedge]:
	Sys ID {is} javascript:CRA_GetTags(['CW-Everyone','CW-Inactive','CW-Normal','CW-Shared-Groups','CW-Shared-Users'])
	Sys ID {is} javascript:CRA_GetTags(['ac65eda5132d17c8f05c7e276144b06d','CW-Inactive','CW-Normal'], true)
	Sys ID {is} javascript:CRA_GetTags(['ac65eda5132d17c8f05c7e276144b06d','19356d61132d17c8f05c7e276144b030'])


*/ Script
-----------------------------------------------------------------------------------------------------

function CRA_GetTags(list, bypass) {
	var result = [];
	// validate input
    if(list.length > 0) {
		// classify tags
		var label_ids = []; 
		var label_names = []; 
		for(var i=0; i<list.length; i++) {
			// for any tag specified by sys_id
			if(list[i].match(/[0-9a-f]{32}/i)) {
				label_ids.push(list[i]);
			// for any tag specified by name
			} else {
				label_names.push(list[i]);
			}
		}
		// set query
		var grq = new GlideRecord('label_entry');
		if(bypass) {
			// using bypass method
			var eqs = [];
			if(label_ids.length > 0) {
				eqs.push('labelIN'+label_ids.join());
			}
			if(label_names.length > 0) {
				eqs.push('label.nameIN'+label_names.join());
			}
			grq.addEncodedQuery(eqs.join('^OR'));
		} else {
			// using strict method
			var labels = [];
			labels = labels.concat(CRA_QueryTags('sys_idIN'+label_ids.join()));
			labels = labels.concat(CRA_QueryTags('nameIN'+label_names.join()));
			labels = labels.filter(function (item, pos) {return (labels.indexOf(item) == pos);});
			grq.addEncodedQuery('labelIN'+labels.join());
		}
		// commit query
		grq.query();
		while(grq.next()) {
			result.push(grq['table_key'].toString());
		}
    }
	return result.filter(function (item, pos) {return (result.indexOf(item) == pos);});
}


*/ Note
-----------------------------------------------------------------------------------------------------

List of test labels

https://thomsonreutersdev.service-now.com/label_list.do?sysparm_query=nameSTARTSWITHCW-

'ac65eda5132d17c8f05c7e276144b06d'	CW-Everyone
'19356d61132d17c8f05c7e276144b030'	CW-Inactive
'70f4eda5132d17c8f05c7e276144b0ac'	CW-Normal
'ef5625e9132d17c8f05c7e276144b07b'	CW-Shared-Groups
'8586292d132d17c8f05c7e276144b0ce'	CW-Shared-Users




















