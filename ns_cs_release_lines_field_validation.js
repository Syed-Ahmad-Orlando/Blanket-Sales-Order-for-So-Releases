/**
 * Copyright (c) 1998-2023, Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oracle NetSuite.
 *
 * Version          Date          Author               Remarks
 * 1.0              14 Feb 2023   christian.grande     Initial version
 * 1.1              03 Mar 2023   christina.grande     Added logic when item quantity is zero
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {

    // Release Page: Header Fields
    const PAGESL_BSO_ITEMS = 'custpage_sublist_bso_items';

    // Release Page: Item Sublist Fields
    const PAGECOL_BSO_ITEM_RELEASE = 'custpage_bso_item_release';
    const PAGECOL_BSO_ITEM_QTY = 'custpage_bso_item_quantity';
    const PAGECOL_BSO_ITEM_QTY_REMAINING = 'custpage_bso_item_quantity_remaining';

    const fieldChanged = (scriptContext) => {
        const ST_LOG_TITLE = 'fieldChanged';
        try {
            let objRecord = scriptContext.currentRecord;
            let stSublistId = scriptContext.sublistId;
            let stFieldId = scriptContext.fieldId;
            let intLine = scriptContext.line;

            if (stSublistId == PAGESL_BSO_ITEMS) {
                if (stFieldId == PAGECOL_BSO_ITEM_RELEASE) {
                    let bIsRelease = objRecord.getCurrentSublistValue({
                        sublistId: PAGESL_BSO_ITEMS,
                        fieldId: PAGECOL_BSO_ITEM_RELEASE
                    });

                    objRecord.getSublistField({
                        sublistId: PAGESL_BSO_ITEMS,
                        fieldId: PAGECOL_BSO_ITEM_QTY,
                        line: intLine
                    }).isMandatory = bIsRelease;

                    console.log(ST_LOG_TITLE, 'Line: ' + intLine + ' | Quantity required: ' + bIsRelease);
                }
            }
        } catch (error) {
            console.error(ST_LOG_TITLE, {error});
        }
    }

    const saveRecord = (scriptContext) => {
        let ST_LOG_TITLE = 'saveRecord';
        try {
            let objRecord = scriptContext.currentRecord;
            let intSelectedItem = 0;
            let arrInvalidLines = [];
            let intLineCount = objRecord.getLineCount({sublistId: PAGESL_BSO_ITEMS});
            for (let i = 0; i < intLineCount; i++) {
                let bIsRelease = objRecord.getSublistValue({
                    sublistId: PAGESL_BSO_ITEMS,
                    fieldId: PAGECOL_BSO_ITEM_RELEASE,
                    line: i
                });

                let intQuantity = objRecord.getSublistValue({
                    sublistId: PAGESL_BSO_ITEMS,
                    fieldId: PAGECOL_BSO_ITEM_QTY,
                    line: i
                });

                let intQuantityRemaining = objRecord.getSublistValue({
                    sublistId: PAGESL_BSO_ITEMS,
                    fieldId: PAGECOL_BSO_ITEM_QTY_REMAINING,
                    line: i
                });
                console.log(ST_LOG_TITLE, { bIsRelease, intQuantity, intQuantityRemaining });

                if (bIsRelease) {
                    intSelectedItem++
                    if (isEmpty(intQuantity) || intQuantity <= 0) {
                        arrInvalidLines.push({
                            line: i + 1,
                            message: 'Please fill up quantity.'
                        });
                    } else if (intQuantity > intQuantityRemaining) {
                        arrInvalidLines.push({
                            line: i + 1,
                            message: 'Quantity is greater than remaining quantity.'
                        });
                    }
                }
            }

            if (intSelectedItem == 0) {
                alert('Please select atleast one item from the transaction.');
                return false;
            } else if (arrInvalidLines.length) {
                let stErrorMsg = arrInvalidLines
                    .map(objLine => `Line ${objLine.line}: ${objLine.message}`)
                    .join('\n');
                alert(stErrorMsg);
                return false;
            }
            return true;
        } catch (error) {
            console.error(ST_LOG_TITLE, {error});
        }
    }

    const isEmpty = (stValue) => {
        return ((stValue ==='' || stValue == null || stValue == undefined)
            || (stValue.constructor === Array && stValue.length ==0)
            || (stValue.constructor === Object && ((v) => { for (let k in v) return false; return true; })(stValue)));
    }

    return { fieldChanged, saveRecord }

});