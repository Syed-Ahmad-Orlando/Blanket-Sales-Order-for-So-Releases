/**
 * Copyright (c) 1998-2021 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(
	['N/search', 'N/runtime', 'N/format', 'N/error', 'N/record'],
	/**
	 * @param {search} search
	 * @param {runtime} runtime
	 * @param {format} format
	 * @param {error} error
	 */
	function (search, runtime, format, error, record)
	{
		var NSUtil = {};

		/**
		 * Evaluate if the given string or object value is empty, null or undefined.
		 * @param {String} stValue - string or object to evaluate
		 * @returns {Boolean} - true if empty/null/undefined, false if not
		 * @author mmeremilla
		 * @memberOf NSUtil
		 */
		NSUtil.isEmpty = function (stValue)
		{
			return ((stValue === '' || stValue == null || stValue == undefined)
				|| (stValue.constructor === Array && stValue.length == 0)
				|| (stValue.constructor === Object && (function (v)
				{
					for (var k in v)
					{
						return false;
					}
					return true;
				})(stValue)));
		};


		/**
		 * Evaluate if the given string is an element of the array, using reverse looping
		 * @param {String} stValue - String value to find in the array
		 * @param {String[]} arrValue - Array to be check for String value
		 * @returns {Boolean} - true if string is an element of the array, false if not
		 * @memberOf NSUtil
		 */
		NSUtil.inArray = function (stValue, arrValue)
		{
			for (var i = arrValue.length - 1; i >= 0; i--)
			{
				if (stValue == arrValue[i])
				{
					break;
				}
			}
			return (i > -1);
		};

		/**
		 * Converts string to integer. If value is infinity or can't be converted to a number, 0 will be returned.
		 * @param {String} stValue - any string
		 * @returns {Number} - an integer
		 * @author jsalcedo
		 * revision: gmanarang - added parameter on parseInt to ensure decimal as base for conversion
		 */
		NSUtil.forceInt = function (stValue)
		{
			var intValue = parseInt(stValue, 10);

			if (isNaN(intValue) || (stValue == Infinity))
			{
				return 0;
			}

			return intValue;
		};

		/**
		 * Converts string to float. If value is infinity or can't be converted to a number, 0.00 will be returned.
		 * @param {String} stValue - any string
		 * @returns {Number} - a floating point number
		 * @author jsalcedo
		 */
		NSUtil.forceFloat = function (stValue)
		{
			var flValue = parseFloat(stValue);

			if (isNaN(flValue) || (stValue == Infinity))
			{
				return 0.00;
			}

			return flValue;
		};

		/**
		 * Removes duplicate values from an array
		 * @param {Object[]} arrValue - any array
		 * @returns {Object[]} - array without duplicate values
		 */
		NSUtil.removeDuplicate = function (arrValue)
		{
			if ((arrValue === '') //Strict checking for this part to properly evaluate integer value.
				|| (arrValue == null) || (arrValue == undefined))
			{
				return arrValue;
			}

			var arrNewValue = new Array();

			o: for (var i = 0, n = arrValue.length; i < n; i++)
			{
				for (var x = 0, y = arrNewValue.length; x < y; x++)
				{
					if (arrNewValue[x] == arrValue[i])
					{
						continue o;
					}
				}

				arrNewValue[arrNewValue.length] = arrValue[i];
			}

			return arrNewValue;
		};

		/**
		 * Replaces the character based on the position defined (0-based index)
		 * @param {String} stValue - any string
		 * @param {Number} intPos - index/position of the character to be replaced
		 * @param {String} stReplacement - any string to replace the character in the intPos
		 * @returns {String} - new value
		 * @author jsalcedo
		 *
		 * Example: replaceCharAt('hello', 0, 'X'); //"Xello"
		 */
		NSUtil.replaceCharAt = function (stValue, intPos, stReplacement)
		{
			return stValue.substr(0, intPos) + stReplacement + stValue.substr(intPos + 1);
		};


		/**
		 * Inserts string to the position defined (0-based index)
		 * @param {String} stValue - any string
		 * @param {Number} intPos - index of the character to be replaced
		 * @param {String} stInsert - any string to insert
		 * @returns {String} - new value
		 * @author jsalcedo
		 *
		 * Example: insertCharAt('hello', 0, 'X'); //"Xhello"
		 */
		NSUtil.insertStringAt = function (stValue, intPos, stInsert)
		{
			return ([stValue.slice(0, intPos), stInsert, stValue.slice(intPos)].join(''));
		};

		/**
		 * Round off floating number and appends it with currency symbol
		 * @param {Number} flValue - a floating number
		 * @param {String} stCurrencySymbol - currency symbol
		 * @param {Number} intDecimalPrecision - number of decimal precisions to use when rounding off the floating number
		 * @returns {String} - formatted value
		 * @author redelacruz
		 */
		NSUtil.formatCurrency = function (flValue, stCurrencySymbol, intDecimalPrecision)
		{
			var flAmount = flValue;

			if (typeof (flValue) != 'number')
			{
				flAmount = parseFloat(flValue);
			}

			var arrDigits = flAmount.toFixed(intDecimalPrecision).split(".");
			arrDigits[0] = arrDigits[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1,").split("").reverse().join("");

			return stCurrencySymbol + arrDigits.join(".");
		};

		/**
		 * Round off floating number and appends it with percent symbol
		 * @param {Number} flValue - a floating number
		 * @param {String} stPercentSymbol - percent symbol
		 * @param {Number} intDecimalPrecision - number of decimal precisions to use when rounding off the floating number
		 * @returns {String} - formatted value
		 * @author redelacruz
		 */
		NSUtil.formatPercent = function (flValue, stPercentSymbol, intDecimalPrecision)
		{
			var flAmount = flValue;

			if (typeof (flValue) != 'number')
			{
				flAmount = parseFloat(flValue);
			}

			var arrDigits = flAmount.toFixed(intDecimalPrecision).split(".");
			arrDigits[0] = arrDigits[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1,").split("").reverse().join("");

			return arrDigits.join(".") + stPercentSymbol;
		};

		/**
		 * Round decimal number
		 * @param {Number} flDecimalNumber - decimal number value
		 * @param {Number} intDecimalPlace - decimal places
		 *
		 * @returns {Number} - a floating point number value
		 * @author memeremilla and lochengco
		 */
		NSUtil.roundDecimalAmount = function (flDecimalNumber, intDecimalPlace)
		{
			//this is to make sure the rounding off is correct even if the decimal is equal to -0.995
			var bNegate = false;
			if (flDecimalNumber < 0)
			{
				flDecimalNumber = Math.abs(flDecimalNumber);
				bNegate = true;
			}

			var flReturn = 0.00;
			intDecimalPlace = (intDecimalPlace == null || intDecimalPlace == '') ? 0 : intDecimalPlace;

			var intMultiplierDivisor = Math.pow(10, intDecimalPlace);
			flReturn = Math.round((parseFloat(flDecimalNumber) * intMultiplierDivisor)) / intMultiplierDivisor;
			flReturn = (bNegate) ? (flReturn * -1) : flReturn;

			return parseFloat(flReturn.toFixed(intDecimalPlace));
		};

		/**
		 * Returns the difference between 2 dates based on time type
		 * @param {Date} stStartDate - Start Date
		 * @param {Date} stEndDate - End Date
		 * @param {String} stTime - 'D' = Days, 'HR' = Hours, 'MI' = Minutes, 'SS' = Seconds
		 * @returns {Number} - (floating point number) difference in days, hours, minutes, or seconds
		 * @author jsalcedo
		 */
		NSUtil.getTimeBetween = function (dtStartDate, dtEndDate, stTime)
		{
			// The number of milliseconds in one time unit
			var intOneTimeUnit = 1;

			switch (stTime)
			{
				case 'D':
					intOneTimeUnit *= 24;
					break;
				case 'HR':
					intOneTimeUnit *= 60;
					break;
				case 'MI':
					intOneTimeUnit *= 60;
					break;
				case 'SS':
					intOneTimeUnit *= 1000;
					break;
			}

			// Convert both dates to milliseconds
			var intStartDate = dtStartDate.getTime();
			var intEndDate = dtEndDate.getTime();

			// Calculate the difference in milliseconds
			var intDifference = intEndDate - intStartDate;

			// Convert back to time units and return
			return Math.round(intDifference / intOneTimeUnit);
		};

		/**
		 * Return a valid filename
		 *
		 * @param {String} stFileName
		 * @returns {String} sanitized filename
		 */
		NSUtil.sanitizeFilename = function (stFileName)
		{
			var fname = stFileName || 'SampleFileName-' + (new Date()).getTime();
			return fname.replace(/[^a-z0-9]/gi, '_');
		};


		/**
		 * Convert item record type to its corresponding internal id (e.g. 'invtpart' to 'inventoryitem')
		 * @param {String} stRecordType - record type of the item
		 * @return {String} stRecordTypeInLowerCase - record type internal id
		 * @memberOf NSUtil
		 */
		NSUtil.toItemInternalId = function (stRecordType)
		{
			if (!stRecordType)
			{
				var objError = error.create(
					{
						name:      '10003',
						message:   'Item record type should not be empty.',
						notifyOff: false
					});
				throw objError;
			}

			var stRecordTypeInLowerCase = stRecordType.toLowerCase().trim();

			switch (stRecordTypeInLowerCase)
			{
				case 'invtpart':
					return record.Type.INVENTORY_ITEM;
				case 'description':
					return record.Type.DESCRIPTION_ITEM;
				case 'assembly':
					return record.Type.ASSEMBLY_ITEM;
				case 'discount':
					return record.Type.DISCOUNT_ITEM;
				case 'group':
					return record.Type.ITEM_GROUP;
				case 'markup':
					return record.Type.MARKUP_ITEM;
				case 'noninvtpart':
					return record.Type.NON_INVENTORY_ITEM;
				case 'othcharge':
					return record.Type.OTHER_CHARGE_ITEM;
				case 'payment':
					return record.Type.PAYMENT_ITEM;
				case 'service':
					return record.Type.SERVICE_ITEM;
				case 'subtotal':
					return record.Type.SUBTOTAL_ITEM;
				case 'giftcert':
					return record.Type.GIFT_CERTIFICATE_ITEM;
				case 'dwnlditem':
					return record.Type.DOWNLOAD_ITEM;
				case 'kit':
					return record.Type.KIT_ITEM;
				default:
					return stRecordTypeInLowerCase;
			}
		};

		/**
		 * Module Dependencies: N/search
		 *
		 * Get the posting period internal id for the given date
		 * @param {String} stDate - date to search for posting period. must be formatted as string
		 * @returns {Number} intPostingPeriodId - internal id of posting period retrieved for the date
		 * if no Posting Period found, -1 is returned
		 * @author redelacruz
		 */
		NSUtil.getPostingPeriodByDate = function (stDate)
		{
			var intPostingPeriodId = -1;

			if ((stDate === '') || (stDate == null) || (stDate == undefined))
			{
				return intPostingPeriodId;
			}

			var arrFilters = [
				search.createFilter({name: 'startdate', operator: search.Operator.ONORBEFORE, values: stDate}),
				search.createFilter({name: 'enddate', operator: search.Operator.ONORAFTER, values: stDate}),
				search.createFilter({name: 'isquarter', operator: search.Operator.IS, values: 'F'}),
				search.createFilter({name: 'isyear', operator: search.Operator.IS, values: 'F'}),
				search.createFilter({name: 'isadjust', operator: search.Operator.IS, values: 'F'})
			];

			var arrColumns = [
				search.createColumn({name: 'startdate', sort: search.Sort.ASC}),
				search.createColumn({name: 'enddate'})
			];

			var objSearchRecord = search.create({
													type:    search.Type.ACCOUNTING_PERIOD,
													filters: arrFilters,
													columns: arrColumns
												});

			//Get the first occurrence
			var arrResults = objSearchRecord.run().getRange({
																start: 0,
																end:   1
															});

			if (arrResults.length > 0)
			{
				intPostingPeriodId = arrResults[0].id;
			}

			return intPostingPeriodId;
		};

		/**
		 * Determine whether the checkbox value is true or not
		 * @param {String/Boolean} val - checkbox value
		 * @returns {Boolean} returns true if checkbox value is true otherwise returns false
		 * @author redelacruz
		 */
		NSUtil.getCheckboxValue = function (val)
		{
			return (val === true || val === 'true' || val === 'T');
		};


		/**
		 * Module Dependencies: N/task, N/error
		 *
		 * @param option.script - Required. Script Id
		 * @param option.params - Optional.
		 * @param option.attempts - Optional. Default:3
		 * @param option.delay - Optional. Default:3 seconds
		 * @author jjacob
		 */
		NSUtil.callMRWithDelay = function (option)
		{
			var logTitle = 'callMRWithDelay';
			try
			{
				if (!option.script)
				{
					throw Error.create({
										   name:      'EMPTY_REQUIRED_FIELD',
										   message:   'script id',
										   notifyOff: true
									   });
				}

				var attempts = option.attempts || 3;
				var timeDelay = option.delay || 3;
				var success = false;

				var callMR = function (scriptid, params)
				{
					var objTask = Task.create({
												  taskType:     Task.TaskType.MAP_REDUCE,
												  scriptId:     scriptid,
												  deploymentId: null,
												  params:       params
											  });
					var newTaskId = objTask.submit();
					var objStatus = Task.checkStatus(newTaskId);
					return objStatus.status;
				};

				var delay = function (s)
				{
					if (!s)
					{
						return;
					}
					var currTime = new Date().getTime();
					var timeEnd = (currTime) + (s * 1000);
					while (currTime <= timeEnd)
					{
						currTime = new Date().getTime();
					}
				};

				for (var i = 0; i < attempts; i++)
				{
					var err = null;
					var status = null;
					try
					{
						if (i > 0)
						{
							delay(timeDelay);
						}
						status = callMR(option.script, option.params);
						success = true;
					}
					catch (e)
					{
						err = e.name + ': ' + e.message;
					}
					finally
					{
						log.error(logTitle, 'attempt=' + (i + 1) + ' | status=' + status + (err ? (' | error=' + err) : ''));
					}
					if (success == true)
					{
						break;
					}
				}

				if (success === false)
				{
					throw Error.create({
										   name:      'MAP_REDUCE_CALL_ERROR',
										   message:   'Map/Reduce either has insufficient deployment or too busy to accept another request.',
										   notifyOff: true
									   });
				}
			}
			catch (e)
			{
				throw e;
			}
		};


		/**
		 * Determine whether the posting period for a given date is closed or not
		 * @param {String} stDate - date to search for posting period
		 * @returns {Boolean} bIsClosed - returns true if posting period is closed; otherwise returns false
		 * @author redelacruz
		 */
		NSUtil.isClosedDatePostingPeriod = function (stDate)
		{
			var bIsClosed = true;

			var objPdSearch = search.create({
												type:    'accountingperiod',
												filters:
														 [
															 ['startdate', 'onorbefore', stDate], 'AND',
															 ['enddate', 'onorafter', stDate], 'AND',
															 ['isyear', 'is', 'F'], 'AND',
															 ['isquarter', 'is', 'F'], 'AND',
															 ['closed', 'is', 'F'], 'AND',
															 ['alllocked', 'is', 'F']
														 ],
												columns: ['periodname']
											});

			objPdSearch.run().each(function (objResult)
								   {
									   bIsClosed = false;
									   return false;
								   });

			return bIsClosed;
		};

		/**
		 * Determine whether the posting period is closed or not
		 * @param {String} stPeriodName - name of posting period to search
		 * @returns {Boolean} bIsClosed - returns true if posting period is closed; otherwise returns false
		 * @author redelacruz
		 */
		NSUtil.isClosedPostingPeriod = function (stPeriodName)
		{
			var bIsClosed = true;

			var objPdSearch = search.create({
												type:    'accountingperiod',
												filters:
														 [
															 ['periodname', 'is', stPeriodName], 'AND',
															 ['isyear', 'is', 'F'], 'AND',
															 ['isquarter', 'is', 'F'], 'AND',
															 ['closed', 'is', 'F'], 'AND',
															 ['alllocked', 'is', 'F']
														 ],
												columns: ['periodname']
											});

			objPdSearch.run().each(function (objResult)
								   {
									   bIsClosed = false;
									   return false;
								   });

			return bIsClosed;
		};

		/**
		 * Get the item price using the price level
		 * @param {String} stItemId - item internal id
		 * @param {String} stPriceLevel - price level internal id
		 * @returns {Object} the price of the item at the given price level
		 */
		NSUtil.getItemPrice = function (stItemId, stPriceLevel)
		{
			if (stPriceLevel == '1')
			{
				return search.lookupFields({type: 'item', id: stItemId, columns: 'baseprice'});
			}
			else
			{
				var objItemSearch = search.create({
													  type:    'employee',
													  filters:
															   [
																   ['isinactive', 'is', 'F'], 'AND',
																   ['internalid', 'is', stItemId]
															   ],
													  columns: ['otherprices']
												  });

				var stId = null;
				objItemSearch.run().each(function (objResult)
										 {
											 stId = objResult.getValue('price' + stPriceLevel);
											 return false;
										 });
				return stId;
			}
		};


		/**
		 * Get all of the results from the search even if the results are more than 1000.
		 * @param {String} stRecordType - the record type where the search will be executed.
		 * @param {String} stSearchId - the search id of the saved search that will be used.
		 * @param {nlobjSearchFilter[]} arrSearchFilter - array of nlobjSearchFilter objects. The search filters to be used or will be added to the saved search if search id was passed.
		 * @param {nlobjSearchColumn[]} arrSearchColumn - array of nlobjSearchColumn objects. The columns to be returned or will be added to the saved search if search id was passed.
		 * @returns {nlobjSearchResult[]} - an array of nlobjSearchResult objects
		 * @author memeremilla - initial version
		 * @author gmanarang - used concat when combining the search result
		 */
		NSUtil.search = function (stRecordType, stSearchId, arrSearchFilter, arrSearchColumn)
		{
			if (stRecordType == null && stSearchId == null)
			{
				error.create(
					{
						name:      'SSS_MISSING_REQD_ARGUMENT',
						message:   'search: Missing a required argument. Either stRecordType or stSearchId should be provided.',
						notifyOff: false
					});
			}

			var arrReturnSearchResults = new Array();
			var objSavedSearch;

			var maxResults = 1000;

			if (stSearchId != null)
			{
				objSavedSearch = search.load(
					{
						id: stSearchId
					});

				// add search filter if one is passed
				if (arrSearchFilter != null)
				{
					if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
					{
						objSavedSearch.filterExpression = objSavedSearch.filterExpression.concat(arrSearchFilter);
					}
					else
					{
						objSavedSearch.filters = objSavedSearch.filters.concat(arrSearchFilter);
					}
				}

				// add search column if one is passed
				if (arrSearchColumn != null)
				{
					objSavedSearch.columns = objSavedSearch.columns.concat(arrSearchColumn);
				}
			}
			else
			{
				objSavedSearch = search.create(
					{
						type: stRecordType
					});

				// add search filter if one is passed
				if (arrSearchFilter != null)
				{
					if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
					{
						objSavedSearch.filterExpression = arrSearchFilter;
					}
					else
					{
						objSavedSearch.filters = arrSearchFilter;
					}
				}

				// add search column if one is passed
				if (arrSearchColumn != null)
				{
					objSavedSearch.columns = arrSearchColumn;
				}
			}

			var objResultset = objSavedSearch.run();
			var intSearchIndex = 0;
			var arrResultSlice = null;
			do
			{
				arrResultSlice = objResultset.getRange(intSearchIndex, intSearchIndex + maxResults);
				if (arrResultSlice == null)
				{
					break;
				}

				arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
				intSearchIndex = arrReturnSearchResults.length;
			}
			while (arrResultSlice.length >= maxResults);

			return arrReturnSearchResults;
		};

		/**
		 * Search Array and return an object
		 * @param {Object} option - search options similar to
		 * @author memeremilla
		 * @memberOf NSUtil
		 */
		NSUtil.searchArray = function (nameKey, value, myArray)
		{
			for (var i = 0; i < myArray.length; i++)
			{
				if (myArray[i][nameKey] === value)
				{
					return myArray[i];
				}
			}
			return null;
		};

		/**
		 * Add Trailing Characters - FILE FORMATTING
		 * @param text
		 * @param size
		 * @param char
		 * @author mjpascual
		 * @memberOf NSUtil
		 */
		NSUtil.addTrailingChar = function (text, size, char)
		{
			var s = '' + text + '';
			while (s.length < size)
			{
				s = s + char;
			}
			return s;
		};

		/**
		 * Add Leading Characters - FILE FORMATTING
		 * @param text
		 * @param size
		 * @param char
		 * @author mjpascual
		 * @memberOf NSUtil
		 */
		NSUtil.addLeadingChar = function (text, size, char)
		{
			var s = '' + text + '';
			while (s.length < size)
			{
				s = char + s;
			}
			return s;
		};

		/**
		 * Overlay error object to a friendly display format
		 * @param error.UserEventError
		 *    var errorObj = error.create({
		 *		name: 'MY_CODE',
		 *		message: 'my error details',
		 *		notifyOff: false
		 *	});
		 * @author krgeron
		 * @memberOf NSUtil
		 *
		 */
		NSUtil.overlayErrorMsg = function (errorObj)
		{
			if (errorObj)
			{
				if (errorObj.name && errorObj.message)
				{
					return ' <b>' + errorObj.name + ':</b>' + '<p>' + errorObj.message + '</p>';
				}
			}
			return errorObj;
		};


		/**
		 * Check if the Date in the Parameter is the last date of the month
		 * @param Date
		 * @author lbalboa
		 * @memberOf NSUtil
		 * @return boolean
		 *
		 */
		NSUtil.checkIfLastDay = function (dDate)
		{

			var stMonth = dDate.getMonth();
			var stYear = dDate.getFullYear();
			var stDay = dDate.getDate();

			var intLastDay = new Date(stYear, stMonth + 1, 0).getDate();

			if (intLastDay == stDay)
			{
				return true;
			}
			else
			{
				return false;
			}
		};


		/**
		 * Get the last date of the month of the date in the parameter
		 * @param Date
		 * @author lbalboa
		 * @memberOf NSUtil
		 * @return Date of the last month
		 *
		 */
		NSUtil.getLastDay = function (dDate)
		{

			var stMonth = dDate.getMonth();
			var stYear = dDate.getFullYear();
			var stDay = dDate.getDate();

			var intLastDay = new Date(stYear, stMonth + 1, 0).getDate();
			return new Date(stYear, stMonth, intLastDay);
		};

		/**
		 * Add Months to the Date provided. This considers the 28th and 28th of Feb
		 * @param Date
		 * @param Int - Number of months to be added
		 * @author lbalboa
		 * @memberOf NSUtil
		 * @return Date
		 *
		 */
		NSUtil.addMonths = function (dateObj, num)
		{

			var currentMonth = dateObj.getMonth() + dateObj.getFullYear() * 12;
			dateObj.setMonth(dateObj.getMonth() + num);
			var diff = dateObj.getMonth() + dateObj.getFullYear() * 12 - currentMonth;

			// If don't get the right number, set date to
			// last day of previous month
			if (diff != num)
			{
				dateObj.setDate(0);
			}
			return dateObj;
		};

		/**
		 * Runs the given N/search.Search object and returns a maximum of 1,000,000 search results.
		 * @param {N/search.Search} objSearch - The N.search.Search object to run.
		 * @param {number} maxResults - The maximum number of results to be returned by the search. If a number is not provided, this function returns the first 1,000,000 search results.
		 * @returns {search.Result[]} - An array of search.Result[] objects.
		 * @author ccutib
		 */
		NSUtil.getAllResults = function (objSearch, maxResults)
		{
			var intPageSize = 1000;
			// limit page size if the maximum is less than 1000
			if (maxResults && maxResults < 1000)
			{
				intPageSize = maxResults;
			}
			var objResultSet = objSearch.runPaged({
													  pageSize: intPageSize
												  });
			var arrReturnSearchResults = [];
			var j = objResultSet.pageRanges.length;
			// retrieve the correct number of pages. page count = maximum / 1000
			if (j && maxResults)
			{
				j = Math.min(Math.ceil(maxResults / intPageSize), j);
			}
			for (var i = 0; i < j; i++)
			{
				var objResultSlice = objResultSet.fetch({
															index: objResultSet.pageRanges[i].index
														});
				arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
			}
			if (maxResults)
			{
				return arrReturnSearchResults.slice(0, maxResults);
			}
			else
			{
				return arrReturnSearchResults;
			}
		};

		/**
		 * Creates/Loads a search and returns the results of that search. A maximum of 1,000,000 search results can be returned by this function.
		 * A second parameter can be provided to limit the number of search results returned.
		 * Aside from the second parameter, use this function in a similar fashion as you would use the N/search.create() or N/search.load API.
		 * Note: This function takes advantage of the N/search.runPaged() API.
		 * @param {Object} options - The search object. This parameter follows the same guidelines for the options parameter of the search.create(options) or search.load(options) API.
		 * @param {String} options.type - The search type of the saved search to create or load. Use a value from the search.Type enum for this parameter.
		 * @param {String} options.id - Internal ID or script ID of the saved search to be loaded. A blank search.Search object is created if no id is provided.
		 * @param {search.Filter[] | Object[]} options.filters - Filter(s) to add to the search. A single search.Filter object or array of search.Filter objects. A JavaScript Object can also represent a search.Filter object.
		 * @param {Object[]} options.filterExpression - Search filter expression to add to the search. An array of expression objects.
		 * @param {search.Column[] | Object[]} options.columns - Result column(s) to add to the search. A single search.Column object or array of search.Column objects. A JavaScript Object can also represent a search.Column object.
		 * @param {number} maxResults - The maximum number of results to be returned by the search. If a number is not provided, this function returns the first 1,000,000 search results.
		 * @returns {search.Result[]} - An array of search.Result[] objects.
		 * @author ccutib - Paged search version of the NSUtilvSS2.search() function.
		 */
		NSUtil.searchPaged = function (options, maxResults)
		{
			if (options.type == null && options.id == null)
			{
				throw error.create({
									   name:      'SSS_MISSING_REQD_ARGUMENT',
									   message:   'search: Missing a required argument. Either the options.type or options.id parameter should be provided.',
									   notifyOff: false
								   });
			}
			var objSavedSearch;
			if (options.id != null)
			{
				objSavedSearch = search.load({
												 id: options.id
											 });
				// add search filter if one is passed
				if (options.filters != null && options.filterExpression != null)
				{
					// resolve conflict if different filters are given for options.filters and options.filterExpression
					// as per native N/search.Search object behavior, last added filters are applied
					var searchKeys = Object.keys(options);
					if (searchKeys.indexOf('filters') > searchKeys.indexOf('filterExpression'))
					{
						options.filterExpression = null;
					}
					else
					{
						options.filters = null;
					}
				}
				if (options.filterExpression != null)
				{
					var arrFilters = objSavedSearch.filterExpression;
					if (arrFilters && arrFilters.length && typeof options.filterExpression[0] !== 'string')
					{
						arrFilters.push('and'); // auto-append "and" if there are no concatenators
					}
					objSavedSearch.filterExpression = arrFilters.concat(options.filterExpression);
				}
				else if (options.filters != null)
				{
					objSavedSearch.filters = objSavedSearch.filters.concat(options.filters);
				}
				// add search column if one is passed
				if (options.columns != null)
				{
					objSavedSearch.columns = objSavedSearch.columns.concat(options.columns);
				}
			}
			else
			{
				if (options.filterExpression != null)
				{
					options.filters = options.filterExpression;
				}
				objSavedSearch = search.create(options);
			}
			return NSUtil.getAllResults(objSavedSearch, maxResults);
		};

		/**
		 * Convenience method to get search value from search result object.
		 * This function is meant to be specially useful in retrieving values from search results parsed from the mapContext.value or from the reduceContext.values properties of a map/reduce script.
		 * Example: To get the value from the item column of a transaction search.
		 * Usage within map: var stItem = NSUtil.getResultValue(JSON.parse(context.value), 'item');
		 * Usage within reduce: var stItem = NSUtil.getResultValue(JSON.parse(context.values[0]), 'item');
		 * Usage with search results:
		 * var arrTransactionItems = NSUtil.searchPaged({ id: 'customsearch_txn_item_lines' });
		 * var stItem = NSUtil.getResultValue(arrTransactionItems[0], 'item');
		 * @param {N/search.Result | Object} objSearchResult - A single search result row.
		 * @param {String | Object} name - The search return column name or a JavaScript encapsulating properties for name, join, summary, and func.
		 * @param {String} join - The join id for this search return column.
		 * @param {String} summary - The summary type for this column.
		 * @param {String} func - Special function for the search column. See N/search.Column.function.
		 * @author ccutib
		 */
		NSUtil.getResultValue = function (objSearchResult, name, join, summary, func)
		{
			var stValue = null;
			if (objSearchResult && name)
			{
				if (typeof objSearchResult.getValue === 'function')
				{
					var options = name;
					if (typeof name === 'string')
					{
						options = {
							name: name
						};
						if (join)
						{
							options.join = join;
						}
						if (summary)
						{
							options.summary = summary;
						}
						if (func)
						{
							options.func = func;
						}
					}
					stValue = objSearchResult.getValue(options);
				}
				else if (objSearchResult.hasOwnProperty('values'))
				{
					var objValue = objSearchResult.values[name];
					if (objValue && objValue.value)
					{
						stValue = objValue.value;
					}
					else if (objValue && objValue[0] && objValue[0].value)
					{
						stValue = objValue[0].value;
					}
					else
					{
						stValue = objValue;
					}
				}
			}
			return stValue;
		};

		/**
		 * Convenience method to get the text value from a search result object.
		 * This function is meant to be specially useful in retrieving text values from search results parsed from the mapContext.value or from the reduceContext.values properties of a map/reduce script.
		 * @param {N/search.Result | Object} objSearchResult - A single search result row.
		 * @param {String | Object} name - The search return column name or a JavaScript encapsulating properties for name, join, and summary.
		 * @param {String} join - The join id for this search return column.
		 * @param {String} summary - The summary type for this column.
		 * @author ccutib
		 */
		NSUtil.getResultText = function (objSearchResult, name, join, summary)
		{
			var stText = null;
			if (objSearchResult && name)
			{
				if (typeof objSearchResult.getText === 'function')
				{
					var options = name;
					if (typeof name === 'string')
					{
						options = {
							name: name
						};
						if (join)
						{
							options.join = join;
						}
						if (summary)
						{
							options.summary = summary;
						}
					}
					stText = objSearchResult.getText(options);
				}
				else if (objSearchResult.hasOwnProperty('values'))
				{
					var objValue = objSearchResult.values[name];
					if (objValue && objValue.text)
					{
						stText = objValue.text;
					}
					else if (objValue && objValue[0] && objValue[0].text)
					{
						stText = objValue[0].text;
					}
					else
					{
						stText = objValue;
					}
				}
			}
			return stText;
		};

		/**
		 * Function that dynamically creates a deployment record when there's none during a Map Reduce call.
		 *
		 * @param option.scriptId - Required. Script Id
		 * @param option.params - Optional.
		 * @returns MR Task Id
		 */
		NSUtil.forceDeploy = function (option)
		{
			var logTitle = 'NSUtil.forceDeploy';
			try
			{
				if (!option.scriptId)
				{
					throw Error.create({
										   name:      'MISSING_REQUIRED_PARAM',
										   message:   'script id',
										   notifyOff: true
									   });
				}

				var _random = function (len)
				{
					if (!len)
					{len = 5;}
					var str = (new Date().getTime()).toString();
					return str.substring(str.length - len, str.length);
				};

				var _deploy = function (scriptid, params)
				{
					try
					{
						var objTask = Task.create({
													  taskType: Task.TaskType.MAP_REDUCE,
													  scriptId: scriptid,
													  params:   params
												  });
						return objTask.submit();
					}
					catch (e)
					{
						log.error(logTitle + '.deploy', e.name + ': ' + e.message);
						if (e.name == 'NO_DEPLOYMENTS_AVAILABLE')
						{
							return null;
						}
						else
						{
							throw e;
						}
					}
				};

				var _copyAndDeploy = function (scriptId, params)
				{
					_copyDeployment(scriptId);
					_deploy(scriptId, params);
				};

				var _copyDeployment = function (scriptId)
				{
					try
					{
						var objSrch = Search.create({
														type:    Search.Type.SCRIPT_DEPLOYMENT,
														filters: [
															['script.scriptid', 'is', scriptId], 'AND',
															['status', 'is', 'NOTSCHEDULED'], 'AND',
															['isdeployed', 'is', 'T']
														],
														columns: ['scriptid']
													});

						var newDeploy = null;

						objSrch.run().each(function (result)
										   {
											   if (result.id)
											   {
												   newDeploy = Record.copy({
																			   type: Record.Type.SCRIPT_DEPLOYMENT,
																			   id:   result.id
																		   });

												   var newScriptId = result.getValue({name: 'scriptid'});
												   newScriptId = newScriptId.toUpperCase().split('CUSTOMDEPLOY')[1];
												   newScriptId = [newScriptId.substring(0, 20), _random()].join('_');

												   newDeploy.setValue({fieldId: 'status', value: 'NOTSCHEDULED'});
												   newDeploy.setValue({fieldId: 'isdeployed', value: true});
												   newDeploy.setValue({fieldId: 'scriptid', value: newScriptId.toLowerCase().trim()});
											   }
										   });

						return newDeploy ? newDeploy.save({
															  enableSourcing:        false,
															  ignoreMandatoryFields: true
														  }) : '';

					}
					catch (e)
					{
						log.error(logTitle + '.copyDeployment', e.name + ': ' + e.message);
						throw e;
					}
				};

				// 1. Deploy script, will take the first available deployment record
				// 2. If no deployment record available, copy an existing deployment record, then deploy again
				return _deploy(option.scriptId, option.params) || _copyAndDeploy(option.scriptId, option.params);
			}
			catch (e)
			{
				log.error(logTitle, e.name + ': ' + e.message);
				throw e;
			}
		};
		/**
		 * Validates and fetches script parameters.
		 * @param {object} - json object. format: {[keyId]:{id,optional},[keyId2]:{id,optional}}. Example: {savedSearch:{optional:true,id:'custscript_saved_search'}}
		 * @param {boolean} - base id is provided.
		 * @returns {object} -json object containing values from parameter. format: {[keyId]:value, [keyId2]:value} Example: {savedSearch:'customsearch_sales_order'}
		 * @throws {Netsuite error} - MISSING_Parameter: If optional = false and parameter is not provided, throws error.
		 */
		NSUtil.getParameters = function (parameterIds, baseidProvided)
		{
			var stLogTitle = 'getParameters';
			var parametersMap = {};
			var scriptContext = runtime.getCurrentScript();
			var obj;
			var value;
			var optional;
			var id;
			log.debug(stLogTitle, 'Parameter ids:' + JSON.stringify(parameterIds));
			for (var key in parameterIds)
			{
				if (parameterIds.hasOwnProperty(key))
				{
					obj = parameterIds[key];
					if (typeof obj === 'string')
					{
						if (baseidProvided)
						{
							value = scriptContext.getParameter('custscript_' + obj);
						}
						else
						{
							value = scriptContext.getParameter(obj);
						}
					}
					else
					{
						id = (baseidProvided) ? 'custscript_' + obj.id : obj.id;
						optional = obj.optional;
						value = scriptContext.getParameter(id);
					}

					if (value !== '' && value !== null)
					{
						parametersMap[key] = value;
					}
					else
					{
						if (!optional)
						{
							throw error.create(
								{
									name:    'MISSING_PARAMETER',
									message: 'Missing Script Parameter:' + key + '[' + id + ']'
								});
						}

					}

				}
			}
			log.debug(stLogTitle, 'Parameters:' + JSON.stringify(parametersMap));
			return parametersMap;
		};
		/**
		 * Unofficial: Calls lookupFields and returns value and text
		 * @param  {object} options {type,id,columns}
		 * @return {object}         object without the multiselect
		 */
		NSUtil.lookupFields = function (options)
		{
			var stLogTitle = 'lookupFields';
			var resultObj = search.lookupFields(
				{
					type:    options.type,
					id:      options.id,
					columns: options.columns
				});
			var returnObj = {};
			log.debug(stLogTitle, 'resultObj+' + JSON.stringify(resultObj));
			Object.keys(resultObj).forEach(function (key)
										   {
											   if (util.isArray(
												   resultObj[key]) && resultObj[key].length > 0 && resultObj[key][0].hasOwnProperty(
												   'value'))
											   {
												   returnObj[key] = {value: resultObj[key][0].value, text: resultObj[key][0].text};
											   }
											   else
											   {
												   returnObj[key] = resultObj[key];
											   }
										   });
			return returnObj;
		};

		return NSUtil;
	});