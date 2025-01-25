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
 * 1.1              24 Feb 2023   christian.grande     Removed unused variables, Fixed logic in getBsoItems function
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget','N/format','./NSUtilvSS2.js'], (record, search, serverWidget, format, NSUtil) => {
    // Record Types
    const RECORD_BSO = 'customrecord_ns_bso_header';
    const RECORD_BSO_ITEMS = 'customrecord_ns_bso_items';

    // Sales Order Custom Field
    const FIELD_SO_BSO_LINK = 'custbody_ns_bso_id';

    // Blanket Sales Order Fields
    const FIELD_BSO_STATUS = 'custrecord_status';

    // Blanket Sales Order Item Fields
    const FIELD_BSO_ITEM_ID = 'internalid';
    const FIELD_BSO_ITEM_BSO_ID = 'custrecord_bso_id';
    const FIELD_BSO_ITEM = 'custrecord_item';
    const FIELD_BSO_ITEM_QTY = 'custrecord_quantity';
    const FIELD_BSO_ITEM_UOM = 'custrecord_units_measure';
    const FIELD_BSO_ITEM_QTY_RELEASED = 'custrecord_quantity_released';
    const FIELD_BSO_ITEM_QTY_REMAINING = 'custrecord_quantity_remaining';
    const FIELD_BSO_ITEM_PRICE = 'custrecord_price';
    const FIELD_BSO_ITEM_AMOUNT = 'custrecord_amount';

    // Release Page: Header Fields
    const PAGEFLD_BSO_ID = 'custpage_bso_id'
    const PAGEFLD_BSO_CUSTOMER = 'custpage_bso_customer';
    const PAGEFLD_BSO_INCOTERM = 'custpage_fp_cust_incoterm';
    //const PAGEFLD_BSO_INCOTERM = 'custpage_bso_incoterm';
    const PAGESL_BSO_ITEMS = 'custpage_sublist_bso_items';

    // Release Page: Item Sublist Fields
    const PAGECOL_BSO_ITEM_RELEASE = 'custpage_bso_item_release';
    const PAGECOL_BSO_ITEM_ID = 'custpage_bso_item_id';
    const PAGECOL_BSO_ITEM = 'custpage_bso_item';
    const PAGECOL_BSO_ITEM_QTY = 'custpage_bso_item_quantity';
    const PAGECOL_BSO_ITEM_UOM = 'custpage_bso_item_units_measure';
    const PAGECOL_BSO_ITEM_QTY_RELEASED = 'custpage_bso_item_quantity_released';
    const PAGECOL_BSO_ITEM_QTY_REMAINING = 'custpage_bso_item_quantity_remaining';
    const PAGECOL_BSO_ITEM_PRICE = 'custpage_bso_item_price';
    const PAGECOL_BSO_ITEM_AMOUNT = 'custpage_bso_item_amount';

    const BSO_STATUS = {
        COMPLETE: 1,
        PARTIAL: 2
    };
    

const STANDARD_UNIT = {
    'Gallon': 11,
    'MT': 12,
    'Pound': 10,
    'Pounds Solids': 13
};
    const onRequest = (scriptContext) =>
    {
        const ST_LOG_TITLE = 'onRequest';

        try
        {
            if (scriptContext.request.method == 'GET') {
                let objForm = createForm(scriptContext);
                scriptContext.response.writePage(objForm);
            } else {
                createSalesOrder(scriptContext);
                let stHtml = `
                    <script>
                        let objLoc = window.opener.location;
                        if (objLoc.href.indexOf('released=T') == -1) {
                            if (objLoc.href.indexOf('?') > -1) {
                                objLoc.search += '&released=T'
                            } else {
                                objLoc.search += '?released=T'
                            }
                        } else {
                            window.opener.location.reload();
                        }
                        window.close();
                    </script>`;
                scriptContext.response.write(stHtml);
            }
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const createForm = (scriptContext) => {
        const ST_LOG_TITLE = 'createForm';
        try {
            const PARAMS = scriptContext.request.parameters;
            log.debug(ST_LOG_TITLE, 'Request Parameters: ' + JSON.stringify(PARAMS));

            let objForm = serverWidget.createForm({
                id: 'custpage_form_release_bso_items',
                title: 'Release Items'
            });
            objForm.addSubtab({
                id: 'custpage_subtab_items',
                label: 'Items',
                tab: 'items'
            });
            objForm.addSubmitButton({
                label: 'Release'
            });
            objForm.clientScriptModulePath = './ns_cs_release_lines_field_validation.js';

            objForm.addField({
                id: PAGEFLD_BSO_ID,
                label: 'Blanket Sales Order ID',
                type: serverWidget.FieldType.SELECT,
                source: RECORD_BSO
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            }).defaultValue = PARAMS.bsoId

            objForm.addField({
                id: PAGEFLD_BSO_CUSTOMER,
                label: 'Customer',
                type: serverWidget.FieldType.SELECT,
                source: 'customer'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            }).defaultValue = PARAMS.customerId

            objForm.addField({
                id: PAGEFLD_BSO_INCOTERM,
                label: 'Incoterm',
                type: serverWidget.FieldType.SELECT,
                source: 'incoterm'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }).defaultValue = PARAMS.incotermId

            let objBsoItemsSublist = objForm.addSublist({
                id: PAGESL_BSO_ITEMS,
                label: 'Items',
                tab: 'items',
                type: serverWidget.SublistType.LIST
            });
            objBsoItemsSublist.addMarkAllButtons();

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_RELEASE,
                label: 'Release',
                type: serverWidget.FieldType.CHECKBOX
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_QTY,
                label: 'Quantity',
                type: serverWidget.FieldType.FLOAT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_ID,
                label: 'ID',
                type: serverWidget.FieldType.SELECT,
                source: RECORD_BSO_ITEMS
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM,
                label: 'Item',
                type: serverWidget.FieldType.SELECT,
                source: 'item'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_UOM,
                label: 'Unit Of Measure',
                type: serverWidget.FieldType.TEXT,
                source: 'unitstype'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.NORMAL
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_QTY_RELEASED,
                label: 'Quantity Released',
                type: serverWidget.FieldType.FLOAT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_QTY_REMAINING,
                label: 'Remaining Quantity',
                type: serverWidget.FieldType.FLOAT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_PRICE,
                label: 'Price',
                type: serverWidget.FieldType.CURRENCY
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            objBsoItemsSublist.addField({
                id: PAGECOL_BSO_ITEM_AMOUNT,
                label: 'Amount',
                type: serverWidget.FieldType.CURRENCY
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            let intIndex = 0;
            let objBsoItems = getBsoItems(PARAMS.bsoId);
            for (let objItem in objBsoItems) {
                objBsoItemsSublist.setSublistValue({
                    id: PAGECOL_BSO_ITEM_ID,
                    line: intIndex,
                    value: objItem
                });
                for (let obj in objBsoItems[objItem])
                {
                    if (obj === PAGECOL_BSO_ITEM_QTY)
                    {
                        objBsoItemsSublist.setSublistValue({
                            id: obj,
                            line: intIndex,
                            value: (!NSUtil.isEmpty(objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY_REMAINING])) ? (objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY_REMAINING]) : (objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY])
                        });
                    }
                    if (obj === PAGECOL_BSO_ITEM_QTY_REMAINING)
                    {
                        objBsoItemsSublist.setSublistValue({
                            id: obj,
                            line: intIndex,
                            value: (!NSUtil.isEmpty(objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY_REMAINING])) ? (objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY_REMAINING]) : (objBsoItems[objItem][PAGECOL_BSO_ITEM_QTY])
                        });
                    }
                    else
                    {
                        objBsoItemsSublist.setSublistValue({
                            id: obj,
                            line: intIndex,
                            value: (objBsoItems[objItem][obj]) ? objBsoItems[objItem][obj] : 0
                        });
                    }
                }
                intIndex++;
            }

            return objForm;
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const getBsoItems = (intBsoId) => {
        const ST_LOG_TITLE = 'getBsoItems';
        try {
            let objBsoItemsSearch = search.create({
                type: RECORD_BSO_ITEMS,
                filters: [
                    search.createFilter({
                        name: FIELD_BSO_ITEM_BSO_ID,
                        operator: search.Operator.IS,
                        values: intBsoId
                    }),
                    search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: 'F'
                    })
                ],
                columns: [
                    search.createColumn({name: FIELD_BSO_ITEM_ID}),
                    search.createColumn({name: FIELD_BSO_ITEM}),
                    search.createColumn({name: FIELD_BSO_ITEM_QTY}),
                    search.createColumn({name: FIELD_BSO_ITEM_UOM}),
                    search.createColumn({name: FIELD_BSO_ITEM_QTY_RELEASED}),
                    search.createColumn({name: FIELD_BSO_ITEM_QTY_REMAINING}),
                    search.createColumn({name: FIELD_BSO_ITEM_PRICE}),
                    search.createColumn({name: FIELD_BSO_ITEM_AMOUNT})
                ]
            });
    
            let objBsoItemsResults = objBsoItemsSearch.run();
            log.debug(ST_LOG_TITLE, 'Search Result: ' + JSON.stringify(objBsoItemsResults));

            let objMappedData ={};
            objBsoItemsResults.each(objBsoItemsResult => {
                let stId = objBsoItemsResult.getValue(FIELD_BSO_ITEM_ID);
                objMappedData[stId] = {};
                objMappedData[stId][PAGECOL_BSO_ITEM] = objBsoItemsResult.getValue(FIELD_BSO_ITEM);
                objMappedData[stId][PAGECOL_BSO_ITEM_QTY] = objBsoItemsResult.getValue(FIELD_BSO_ITEM_QTY);
                objMappedData[stId][PAGECOL_BSO_ITEM_UOM] = objBsoItemsResult.getText(FIELD_BSO_ITEM_UOM);
                objMappedData[stId][PAGECOL_BSO_ITEM_QTY_RELEASED] = objBsoItemsResult.getValue(FIELD_BSO_ITEM_QTY_RELEASED);
                objMappedData[stId][PAGECOL_BSO_ITEM_QTY_REMAINING] = objBsoItemsResult.getValue(FIELD_BSO_ITEM_QTY_REMAINING);
                objMappedData[stId][PAGECOL_BSO_ITEM_PRICE] = objBsoItemsResult.getValue(FIELD_BSO_ITEM_PRICE);
                objMappedData[stId][PAGECOL_BSO_ITEM_AMOUNT] = objBsoItemsResult.getValue(FIELD_BSO_ITEM_AMOUNT);
                return true;
            });
            log.debug(ST_LOG_TITLE, objMappedData);
            return objMappedData;
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const createSalesOrder = (scriptContext) => {
        const ST_LOG_TITLE = 'createSalesOrder';
        try {
            objRequest = scriptContext.request;
            objParams = objRequest.parameters;
            log.debug(ST_LOG_TITLE, objParams);

            let objBSOData = getBlanketSOData(objParams);
            log.debug(ST_LOG_TITLE, 'objBSOData:'+JSON.stringify(objBSOData));

            let objSoRecord = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true
            });

            //Set SO Header Fields
            for (var fieldId in objBSOData) {
                // log.debug("fieldId",fieldId);
                // log.debug("objBSOData",objBSOData);
                objSoRecord.setValue({
                    fieldId: fieldId,
                    value: objBSOData[fieldId]
                });
            }

            let arrReleasedItems = [];
            let intItemUom =0;
            let intBsoItemCount = objRequest.getLineCount({group: PAGESL_BSO_ITEMS});

            for (let i = 0; i < intBsoItemCount; i++)
            {
                let bIsReleased = objRequest.getSublistValue({
                    group: PAGESL_BSO_ITEMS,
                    name: PAGECOL_BSO_ITEM_RELEASE,
                    line: i
                });
                log.debug(ST_LOG_TITLE + '.loop', bIsReleased);
                if (bIsReleased == 'F') continue;

                let intItemId = objRequest.getSublistValue({
                    group: PAGESL_BSO_ITEMS,
                    name: PAGECOL_BSO_ITEM,
                    line: i
                });

                let intItemQty = objRequest.getSublistValue({
                    group: PAGESL_BSO_ITEMS,
                    name: PAGECOL_BSO_ITEM_QTY,
                    line: i
                });

                let intItemUom = objRequest.getSublistValue({
                    group: PAGESL_BSO_ITEMS,
                    name: PAGECOL_BSO_ITEM_UOM,
                    line: i
                });

                let flItemPrice = objRequest.getSublistValue({
                    group: PAGESL_BSO_ITEMS,
                    name: PAGECOL_BSO_ITEM_PRICE,
                    line: i
                });
                
                let standardUnitId = STANDARD_UNIT[intItemUom];

                log.debug(ST_LOG_TITLE + '.loop', `Unit Mapping: Custom UOM ID = ${intItemUom}, Standard ID = ${standardUnitId}`);
    
                objSoRecord.selectNewLine({sublistId: 'item'});

                objSoRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: intItemId,
                    forceSyncSourcing: true
                });

                objSoRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: intItemQty,
                    forceSyncSourcing: true
                });

                objSoRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    value: standardUnitId
                });

                objSoRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: flItemPrice
                });

                objSoRecord.commitLine({sublistId: 'item'});
                arrReleasedItems.push({
                    item: intItemId,
                    quantity: intItemQty
                });
                log.debug(ST_LOG_TITLE + '.loop', 'BSO Item: ' + intItemId + ' marked for released and inserted to Sales Order');
            }

            let intSoId = objSoRecord.save();
            // let newobjsoRecord = record.load({   
            //     type: record.Type.SALES_ORDER,
            //     id: intSoId,
            //     isDynamic: true
            // });
            // for (let i = 0; i < intBsoItemCount; i++)
            //     {     let intItemUom = objRequest.getSublistValue({
            //         group: PAGESL_BSO_ITEMS,
            //         name: PAGECOL_BSO_ITEM_UOM,
            //         line: i
            //     });
            //         let standardUnitId = STANDARD_UNIT[intItemUom];
            //          log.debug("standardUnitId",standardUnitId);
            //         newobjsoRecord.setCurrentSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'unit',
            //             value: standardUnitId
            //         });
            //         objRecord.setSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'item',
            //             line: 3,
            //             value: true
            //         });
    
            //         newobjsoRecord.commitLine({sublistId: 'item'});
            //         let upSoId = newobjsoRecord.save();
                  
            //     }
             
            log.audit(ST_LOG_TITLE, 'Sales Order ID: ' + intSoId + ' has been generated for released items.');

            matchBso(objParams[PAGEFLD_BSO_ID], arrReleasedItems);
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const getBlanketSOData = (objParams) => {
        const ST_LOG_TITLE = 'getBSODetails';
        try {

            log.debug(ST_LOG_TITLE, 'objParams[PAGEFLD_BSO_ID]:'+JSON.stringify(objParams[PAGEFLD_BSO_ID]));
            let objBlanketSOData = {};
            let objBSOData = search.lookupFields({
                type: 'customrecord_ns_bso_header',
                id: objParams[PAGEFLD_BSO_ID],
                columns: ['custrecord_fp_bso_salesrep','custrecord_fp_account_manager','custrecord_fp_terms','custrecord_bso_delv_start',
                    'custrecord_bso_delv_end','custrecord_bso_condition','custrecord_fp_cust_incoterm','custrecord_bso_cust_incoterm_descript',
                    'custrecord_bso_pymt_basis','custrecord_bso_pallets_req','custrecord_bso_pckg_type','custrecord_fp_delivery_notes','custrecord_fp_customer_po']
            });
            log.debug(ST_LOG_TITLE, 'objBSOData:'+JSON.stringify(objBSOData));

            objBlanketSOData.entity = objParams[PAGEFLD_BSO_CUSTOMER];
            objBlanketSOData.custbody_ns_bso_id = objParams[PAGEFLD_BSO_ID];
            objBlanketSOData.salesrep = (!NSUtil.isEmpty(objBSOData['custrecord_fp_bso_salesrep'])) ? objBSOData['custrecord_fp_bso_salesrep'][0].value : null;
            objBlanketSOData.custbody_fp_ops_co_assigned = (!NSUtil.isEmpty(objBSOData['custrecord_fp_account_manager'])) ? objBSOData['custrecord_fp_account_manager'][0].value : null;
            objBlanketSOData.terms = (!NSUtil.isEmpty(objBSOData['custrecord_fp_terms'])) ? objBSOData['custrecord_fp_terms'][0].value : null;
            objBlanketSOData.custbodyfp_ship_condition = (!NSUtil.isEmpty(objBSOData['custrecord_bso_condition'])) ? objBSOData['custrecord_bso_condition'][0].value : null;
            objBlanketSOData.custbody_incoterm = (!NSUtil.isEmpty(objBSOData['custrecord_fp_cust_incoterm'])) ? objBSOData['custrecord_fp_cust_incoterm'][0].value : null;
            objBlanketSOData.custbody_fp_cust_incoterm_description = objBSOData['custrecord_bso_cust_incoterm_descript'];
            objBlanketSOData.custbody_cus_payment_basis = objBSOData['custrecord_bso_pymt_basis'];
            objBlanketSOData.custbody_fp_pallet_req = (!NSUtil.isEmpty(objBSOData['custrecord_bso_pallets_req'])) ? objBSOData['custrecord_bso_pallets_req'][0].value : null;
            objBlanketSOData.custbody_fl_type_packaging = (!NSUtil.isEmpty(objBSOData['custrecord_bso_pckg_type'])) ? objBSOData['custrecord_bso_pckg_type'][0].value : null;
            objBlanketSOData.custbody_delivery_note = objBSOData['custrecord_fp_delivery_notes'];
            objBlanketSOData.custbody_customer_po_number = objBSOData['custrecord_fp_customer_po'];

            if (!NSUtil.isEmpty(objBSOData['custrecord_bso_delv_start'])) {
                objBlanketSOData.custbodyfp_dlvry_period_start = format.parse({
                    value: objBSOData['custrecord_bso_delv_start'],
                    type: format.Type.DATE
                });
            }
            if (!NSUtil.isEmpty(objBSOData['custrecord_bso_delv_end'])) {
                objBlanketSOData.custbody_fp_dlvry_period_end = format.parse({
                    value: objBSOData['custrecord_bso_delv_end'],
                    type: format.Type.DATE
                });
            }

            return objBlanketSOData;
        }
        catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const matchBso = (intBsoId, arrReleasedItems) => {
        const ST_LOG_TITLE = 'matchBso';
        try {
            log.debug(ST_LOG_TITLE, {arrReleasedItems});
            let objBsoRecord = record.load({
                type: RECORD_BSO,
                id: intBsoId
            });

            let stSublistId = 'recmach' + FIELD_BSO_ITEM_BSO_ID;

            arrReleasedItems.forEach(objReleasedItem => {

                let intBsoItem = objReleasedItem.item;
                let intBsoItemQty = objReleasedItem.quantity;
                let intLine = objBsoRecord.findSublistLineWithValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM,
                    value: intBsoItem
                });
                let intBsoItemQtyReleased = objBsoRecord.getSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY_RELEASED,
                    line: intLine
                });
                let intNewItemQtyReleased = parseFloat(intBsoItemQtyReleased) + parseFloat(intBsoItemQty);
                objBsoRecord.setSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY_RELEASED,
                    line: intLine,
                    value: intNewItemQtyReleased
                });
                log.debug(ST_LOG_TITLE + '.loop', `BSO Item: ${intBsoItem} | Quantity released has been matched. (from: ${intBsoItemQtyReleased} | to: ${intNewItemQtyReleased})`);

                let intBsoLineQty = objBsoRecord.getSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY,
                    line: intLine
                });
                let intBsoItemQtyRemaining = objBsoRecord.getSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY_REMAINING,
                    line: intLine
                });
                log.debug(ST_LOG_TITLE, 'intBsoItemQtyRemaining:'+intBsoItemQtyRemaining)
                intBsoItemQtyRemaining = (!NSUtil.isEmpty(intBsoItemQtyRemaining)) ? intBsoItemQtyRemaining : intBsoLineQty;
                log.debug(ST_LOG_TITLE, 'intBsoItemQtyRemaining:'+intBsoItemQtyRemaining+' | intBsoLineQty:'+intBsoLineQty);

                let intNewItemQtyRemaining = intBsoItemQtyRemaining - intBsoItemQty;
                log.debug(ST_LOG_TITLE, 'intNewItemQtyRemaining:'+intNewItemQtyRemaining)
                objBsoRecord.setSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY_REMAINING,
                    line: intLine,
                    value: intNewItemQtyRemaining
                });
                log.debug(ST_LOG_TITLE + '.loop', `BSO Item: ${intBsoItem} | Remaining quantity has been matched. (from: ${intBsoItemQtyRemaining} | to: ${intNewItemQtyRemaining})`);
            });

            let bIsComplete = true;
            let intLineCount = objBsoRecord.getLineCount({sublistId: stSublistId});
            for (let i = 0; i < intLineCount; i++) {
                let intQtyRemaining = parseFloat(objBsoRecord.getSublistValue({
                    sublistId: stSublistId,
                    fieldId: FIELD_BSO_ITEM_QTY_REMAINING,
                    line: i
                }));

                if (intQtyRemaining != 0) {
                    bIsComplete = false;
                    break;
                }
            }

            objBsoRecord.setValue({
                fieldId: FIELD_BSO_STATUS,
                value: bIsComplete ? BSO_STATUS.COMPLETE : BSO_STATUS.PARTIAL 
            });

            objBsoRecord.save();
            
            log.audit(ST_LOG_TITLE, 'Blanket Sales Order ID: ' + intBsoId + ' has been matched with released items.');
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    return { onRequest }

});