[Link]: <AnyURL>
[ServiceNow]: <https://www.servicenow.com/>


# Welcome to the Chaisup's ServiceNow Library


## About
This place is an example collection of some essential components in [ServiceNow] for the reporting team. These components are mainly used for complex calculation of data of the facts tables in order to provide derived results to the users. The calculation can be used in a global funtion, a scheduled job, and a widget.


## Motivation
Some components may contain a very long and complex _JavaScript_ code and need version control. Using _GitHub_ would be helpful to track changes and share works with my colleages.


## Repository
The scripts can be divided into 4 groups.

### cwsn_functions
These scripts are in the `sys_script_include` table which stores all global functions in _ServiceNow_. Both users and developers can call these at any time to run or calculate their data. The files in this directory are documented manually with following topics.

* Metadata
  * Name
  * Version
  * Developed by
* Description
* Script
* Test
* How to use

### cwsn_jobs
These scripts are in the `sysauto_pa` table which stores scheduled jobs in _ServiceNow_. The jobs can be used in the ETL process and PA module.

### cwsn_scripts
These scripts are in the `pa_scripts` table which stores local functions and commands in _ServiceNow_. Actually, this is for only use in PA module but we have extended the feature to do a lot more for reporting purpose.
To use this feature, The `CRA_Use` function must be installed in the instance.

### cwsn_widgets
These scripts are in the `sysauto_report` table which has been extended to store UI widget content also. To use this feature, The UI engine of `CRA Widgets` must be installed in the instance.
